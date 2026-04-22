import Shipment from '../models/Shipment.js';
import Hub from '../models/Hub.js';
import DisruptionLog from '../models/DisruptionLog.js';
import { getIO } from '../socket.js';
import { generateDisruptionAlert } from './geminiService.js';

const getWeatherRisk = (hub) => {
  const seed = (hub.location.lat + hub.location.lng) % 10;
  const base = Math.abs(seed) * 7;
  const variation = Math.random() * 20;
  return Math.min(100, Math.round(base + variation));
};

const getHistoricalDelayRate = (hub) => {
  const rates = {
    'HUB001': 35,
    'HUB002': 28,
    'HUB003': 45,
    'HUB004': 20,
    'HUB005': 60,
    'HUB006': 38
  };
  return rates[hub.hubId] || 30;
};

export const calculateRippleScore = (congestionLevel, hub) => {
  const weatherRisk = getWeatherRisk(hub);
  const historicalDelayRate = getHistoricalDelayRate(hub);
  const score = (congestionLevel * 0.5) +
                (weatherRisk * 0.3) +
                (historicalDelayRate * 0.2);
  return Math.min(100, Math.round(score));
};

export const findAffectedShipments = async (hubName) => {
  return await Shipment.find({ transitHubs: hubName });
};

export const processDisruption = async (hub) => {
  const io = getIO();
  const rippleScore = calculateRippleScore(hub.congestionLevel, hub);
  const rawShipments = await findAffectedShipments(hub.name);
  const updatedShipments = [];

  for (const shipment of rawShipments) {
    const newRisk = Math.min(100, Math.round(
      (shipment.riskScore * 0.4) + (rippleScore * 0.6)
    ));
    const newStatus = newRisk >= 70 ? 'delayed' : 'at-risk';

    // Mongoose 9: use returnDocument: 'after' (idiomatic MongoDB driver style)
    await Shipment.findOneAndUpdate(
      { shipmentId: shipment.shipmentId },
      { $set: { riskScore: newRisk, status: newStatus } },
      { returnDocument: 'after' }
    );

    updatedShipments.push({
      shipmentId: shipment.shipmentId,
      origin: shipment.origin,
      destination: shipment.destination,
      carrier: shipment.carrier,
      riskScore: newRisk,
      status: newStatus
    });
  }

  // Call Gemini — await before saving or emitting
  const aiMessage = await generateDisruptionAlert(
    hub.name,
    hub.congestionLevel,
    updatedShipments,
    rippleScore
  );

  // Save log with aiMessage already filled
  const log = await DisruptionLog.create({
    hubId: hub.hubId,
    hubName: hub.name,
    congestionLevel: hub.congestionLevel,
    affectedShipments: updatedShipments,
    totalAffected: updatedShipments.length,
    aiMessage
  });

  // Emit with aiMessage included in payload
  const alertPayload = {
    logId: log._id.toString(),
    hubId: hub.hubId,
    hubName: hub.name,
    congestionLevel: hub.congestionLevel,
    rippleScore,
    affectedShipments: updatedShipments,
    totalAffected: updatedShipments.length,
    aiMessage,
    timestamp: log.createdAt.toISOString()
  };

  io.emit('disruption-alert', alertPayload);
  console.log(`ENGINE: ${hub.name} — score ${rippleScore} — ${updatedShipments.length} affected`);

  return log;
};

export const detectAnomalies = async () => {
  try {
    // FIX: Only query hubs that are NOT yet marked disrupted to prevent
    // re-firing processDisruption (and Gemini API calls) every 30s
    const newlyDisruptedHubs = await Hub.find({
      congestionLevel: { $gt: 70 },
      isDisrupted: false
    });

    for (const hub of newlyDisruptedHubs) {
      const updated = await Hub.findOneAndUpdate(
        { hubId: hub.hubId },
        { $set: { isDisrupted: true } },
        { returnDocument: 'after' }
      );
      // Emit hub-update so frontend turns marker red immediately
      getIO().emit('hub-update', {
        hubId: updated.hubId,
        name: updated.name,
        congestionLevel: updated.congestionLevel,
        isDisrupted: true
      });
      await processDisruption(updated);
    }

    // Auto-recovery: hubs that dropped BELOW 70% but are still flagged.
    // Use $lt (not $lte) to match the disruption trigger of $gt: 70.
    // A hub at exactly 70% stays in its current state — consistent boundary.
    const recoveredHubs = await Hub.find({
      congestionLevel: { $lt: 70 },
      isDisrupted: true
    });

    for (const hub of recoveredHubs) {
      await Hub.findOneAndUpdate(
        { hubId: hub.hubId },
        { $set: { isDisrupted: false } },
        { returnDocument: 'after' }
      );
      getIO().emit('hub-update', {
        hubId: hub.hubId,
        name: hub.name,
        congestionLevel: hub.congestionLevel,
        isDisrupted: false
      });
    }
  } catch (error) {
    console.error('Anomaly detection error:', error.message);
  }
};

export const startDisruptionEngine = () => {
  console.log('Disruption Engine started');
  setInterval(async () => {
    await detectAnomalies();
  }, 30000);
};