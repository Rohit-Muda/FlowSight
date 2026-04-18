import express from 'express';
import Shipment from '../models/Shipment.js';

const router = express.Router();

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
    const updated = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.shipmentId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;