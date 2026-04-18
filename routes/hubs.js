import express from 'express';
import Hub from '../models/Hub.js';
import Shipment from '../models/Shipment.js';
import { getIO } from '../socket.js';
import { processDisruption } from '../services/disruptionEngine.js';
import DisruptionLog from '../models/DisruptionLog.js';

const router = express.Router();

// GET all hubs
router.get('/', async (req, res) => {
  try {
    const hubs = await Hub.find();
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET recent disruption logs — MUST be before /:hubId routes
router.get('/logs/recent', async (req, res) => {
  try {
    const logs = await DisruptionLog.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET reroute suggestions for a hub
router.get('/:hubId/reroute', async (req, res) => {
  try {
    const hub = await Hub.findOne({ hubId: req.params.hubId });
    if (!hub) return res.status(404).json({ message: 'Hub not found' });

    const scored = hub.alternateRoutes.map(route => ({
      ...route.toObject(),
      score: Math.round((route.reliabilityScore * 0.6) - (route.extraTimeMins * 0.04))
    }));
    scored.sort((a, b) => b.score - a.score);

    res.json({ hub: hub.name, recommendations: scored });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH update hub
router.patch('/:hubId', async (req, res) => {
  try {
    const updated = await Hub.findOneAndUpdate(
      { hubId: req.params.hubId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST simulate disruption (demo button)
router.post('/:hubId/simulate-disruption', async (req, res) => {
  try {
    const hub = await Hub.findOneAndUpdate(
      { hubId: req.params.hubId },
      { $set: { congestionLevel: 92, isDisrupted: true } },
      { new: true }
    );
    if (!hub) return res.status(404).json({ message: 'Hub not found' });

    getIO().emit('hub-update', {
      hubId: hub.hubId,
      name: hub.name,
      congestionLevel: 92,
      isDisrupted: true
    });

    const log = await processDisruption(hub);

    res.json({
      message: `Disruption simulated for ${hub.name}`,
      affected: log.totalAffected,
      logId: log._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;