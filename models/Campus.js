import { Schema } from "mongoose";

const campusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true },
  address: { type: String, unique: true },
  city: { type: String, unique: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  contact: {
    phone: { type: String },
    email: { type: String }
  },
   campusAdmin: { type: Schema.Types.ObjectId, ref: "User" } 
}, { timestamps: true });


campusSchema.index({ location: '2dsphere' });

export default model("Campus", campusSchema)