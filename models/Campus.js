import Class from "./Class.js";
import User from "./User.js";
import { model, Schema } from "mongoose";

const campusSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
   campusAdmin: { type: Schema.Types.ObjectId, ref: "User", required: true },
   isActive: {type:Boolean, default: true}
}, { timestamps: true });


campusSchema.index({ location: '2dsphere' });

//this will free this code field which means we can create campus with this inactive campus code
campusSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
)

campusSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.isActive === false) {
    await Class.updateMany({ campus: doc._id }, { isActive: false })

    await User.updateMany(
      { campus: doc._id, role: { $in: ["teacher", "student"] } },
      { isActive: false }
    );
  }
});


export default model("Campus", campusSchema)