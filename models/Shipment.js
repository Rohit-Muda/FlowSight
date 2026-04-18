import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true, unique: true },
  origin: { city: String, country: String },
  destination: { city: String, country: String },
  currentLocation: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  carrier: { type: String, default: 'DHL' },
  status: {
    type: String,
    enum: ['on-time', 'at-risk', 'delayed'],
    default: 'on-time'
  },
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  estimatedArrival: { type: Date },
  transitHubs: [String]
}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);