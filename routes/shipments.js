import express from 'express';
import Shipment from '../models/Shipment.js';

const router = express.Router();

// Allowlist of fields that can be updated via the public API.
// Prevents arbitrary $set overwriting of any field (e.g. shipmentId, transitHubs).
const UPDATABLE_FIELDS = new Set([
  'status', 'riskScore', 'estimatedArrival',
  'currentLocation', 'carrier'
]);

router.get('/', async (req, res) => {
  try {
    const shipments = await Shipment.find();
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.shipmentId });
    if (!shipment) return res.status(404).json({ message: 'Not found' });
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:shipmentId', async (req, res) => {
  try {
    // Strip any field not in the allowlist before passing to $set
    const safeUpdate = {};
    for (const key of Object.keys(req.body)) {
      if (UPDATABLE_FIELDS.has(key)) {
        safeUpdate[key] = req.body[key];
      }
    }

    if (Object.keys(safeUpdate).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const updated = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      { $set: safeUpdate },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;