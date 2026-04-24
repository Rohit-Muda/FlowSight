import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  shipmentId: { type: String, required: true },
  bidderName: { type: String, required: true },
  bidderContact: { type: String, required: true },
  amountUSD: { type: Number, required: true },
  auctionType: { type: String, enum: ['distress', 'unclaimed'] },
  status: { type: String, enum: ['active', 'won', 'outbid'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Bid', bidSchema);