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
  transitHubs: [String],
  cargoType: {
    type: String,
    enum: ['general', 'perishable', 'pharmaceutical', 'frozen', 'electronics'],
    default: 'general'
  },
  cargoDescription: { type: String, default: '' },
  cargoValueUSD: { type: Number, default: 0 },
  expiryHours: { type: Number, default: null },
  daysStuckAtHub: { type: Number, default: 0 },
  noticesSent: { type: Number, default: 0 },
  auction: {
    isOpen: { type: Boolean, default: false },
    type: { type: String, enum: ['distress', 'unclaimed', null], default: null },
    minBidUSD: { type: Number, default: 0 },
    currentBidUSD: { type: Number, default: 0 },
    currentBidder: { type: String, default: '' },
    auctionDeadline: { type: Date, default: null },
    ownerApproved: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);