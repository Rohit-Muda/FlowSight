import mongoose from 'mongoose';

const hubSchema = new mongoose.Schema({
  hubId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  type: {
    type: String,
    enum: ['port', 'airport', 'warehouse', 'customs'],
    default: 'port'
  },
  congestionLevel: { type: Number, min: 0, max: 100, default: 20 },
  isDisrupted: { type: Boolean, default: false },
  alternateRoutes: [{
    name: String,
    extraTimeMins: Number,
    extraCostUSD: Number,
    reliabilityScore: Number
  }]
}, { timestamps: true });

export default mongoose.model('Hub', hubSchema);