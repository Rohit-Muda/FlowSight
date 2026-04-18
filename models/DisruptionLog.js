import mongoose from 'mongoose';

const disruptionLogSchema = new mongoose.Schema({
  hubId: { type: String, required: true },
  hubName: { type: String, required: true },
  congestionLevel: { type: Number, required: true },
  affectedShipments: [
    {
      shipmentId: String,
      origin: { city: String, country: String },
      destination: { city: String, country: String },
      carrier: String,
      riskScore: Number,
      status: String
    }
  ],
  totalAffected: { type: Number, default: 0 },
  aiMessage: { type: String, default: '' },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('DisruptionLog', disruptionLogSchema);