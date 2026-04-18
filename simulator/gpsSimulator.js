import Shipment from '../models/Shipment.js';

const moveShipment = (shipment) => ({
  lat: parseFloat((shipment.currentLocation.lat + (Math.random() - 0.5) * 0.8).toFixed(4)),
  lng: parseFloat((shipment.currentLocation.lng + (Math.random() - 0.5) * 0.8).toFixed(4))
});

export const startGPSSimulator = (io) => {
  console.log('GPS Simulator started');

  setInterval(async () => {
    try {
      const shipments = await Shipment.find();
      for (const shipment of shipments) {
        const newLocation = moveShipment(shipment);
        const updated = await Shipment.findOneAndUpdate(
          { shipmentId: shipment.shipmentId },
          { $set: { 'currentLocation.lat': newLocation.lat, 'currentLocation.lng': newLocation.lng } },
          { new: true }
        );
        io.emit('shipment-update', {
          shipmentId: updated.shipmentId,
          currentLocation: updated.currentLocation,
          status: updated.status,
          riskScore: updated.riskScore
        });
      }
    } catch (error) {
      console.error('GPS error:', error.message);
    }
  }, 3000);
};