import Shipment from '../models/Shipment.js';

// Clamp lat/lng to valid globe bounds to prevent markers drifting off the map
const clampLat = (lat) => Math.max(-85, Math.min(85, lat));
const clampLng = (lng) => {
  // Wrap longitude into [-180, 180] range
  const wrapped = ((lng + 180) % 360 + 360) % 360 - 180;
  return parseFloat(wrapped.toFixed(4));
};

const moveShipment = (shipment) => ({
  lat: parseFloat(clampLat(
    shipment.currentLocation.lat + (Math.random() - 0.5) * 0.8
  ).toFixed(4)),
  lng: clampLng(
    shipment.currentLocation.lng + (Math.random() - 0.5) * 0.8
  )
});

export const startGPSSimulator = (io) => {
  console.log('GPS Simulator started');

  setInterval(async () => {
    try {
      const shipments = await Shipment.find();
      for (const shipment of shipments) {
        const newLocation = moveShipment(shipment);
        // returnDocument: 'after' is the correct Mongoose 9 / MongoDB driver option
        const updated = await Shipment.findOneAndUpdate(
          { shipmentId: shipment.shipmentId },
          { $set: { 'currentLocation.lat': newLocation.lat, 'currentLocation.lng': newLocation.lng } },
          { returnDocument: 'after' }
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