import express from 'express';
import Hub from '../models/Hub.js';
import { getIO } from '../socket.js';
import { processDisruption } from '../services/disruptionEngine.js';
import DisruptionLog from '../models/DisruptionLog.js';

const router = express.Router();

// Allowlist of fields updatable via public PATCH (prevents arbitrary writes)
const HUB_UPDATABLE_FIELDS = new Set([
  'congestionLevel', 'isDisrupted'
]);

// Cooldown duration for simulate-disruption (10 seconds)
const SIMULATE_COOLDOWN_MS = 10000;

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

// GET reroute suggestions for a hub — scored and sorted
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

// PATCH update hub — field-allowlisted
router.patch('/:hubId', async (req, res) => {
  try {
    const safeUpdate = {};
    for (const key of Object.keys(req.body)) {
      if (HUB_UPDATABLE_FIELDS.has(key)) {
        safeUpdate[key] = req.body[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const updated = await Hub.findOneAndUpdate(
      { hubId: req.params.hubId },
      { $set: safeUpdate },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST simulate disruption (demo button) — rate-limited to 1 per 10s per hub (DB-persisted)
router.post('/:hubId/simulate-disruption', async (req, res) => {
  try {
    const { hubId } = req.params;

    // Fetch hub to check DB-persisted rate-limit timestamp
    const existingHub = await Hub.findOne({ hubId });
    if (!existingHub) return res.status(404).json({ message: 'Hub not found' });

    // DB-persisted rate-limit check (survives server restarts)
    if (existingHub.lastSimulatedAt) {
      const elapsed = Date.now() - new Date(existingHub.lastSimulatedAt).getTime();
      if (elapsed < SIMULATE_COOLDOWN_MS) {
        const remaining = Math.ceil((SIMULATE_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          message: `Disruption simulation on cooldown. Try again in ${remaining}s.`
        });
      }
    }

    const hub = await Hub.findOneAndUpdate(
      { hubId },
      { $set: { congestionLevel: 92, isDisrupted: true, lastSimulatedAt: new Date() } },
      { returnDocument: 'after' }
    );

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