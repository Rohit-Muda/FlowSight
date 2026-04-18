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

    await Shipment.findOneAndUpdate(
      { shipmentId: shipment.shipmentId },
      { $set: { riskScore: newRisk, status: newStatus } }
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
    const hubs = await Hub.find({ congestionLevel: { $gt: 70 } });

    for (const hub of hubs) {
      if (!hub.isDisrupted) {
        await Hub.findOneAndUpdate(
          { hubId: hub.hubId },
          { $set: { isDisrupted: true } }
        );
      }
      await processDisruption(hub);
    }

    const recoveredHubs = await Hub.find({
      congestionLevel: { $lte: 70 },
      isDisrupted: true
    });

    for (const hub of recoveredHubs) {
      await Hub.findOneAndUpdate(
        { hubId: hub.hubId },
        { $set: { isDisrupted: false } }
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