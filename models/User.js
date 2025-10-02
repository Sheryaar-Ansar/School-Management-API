import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    contact: { type: Number, required: true },
    address: { type: String },
    dob: { type: Date, required: true },
    role: {
      type: String,
      enum: ["super-admin", "campus-admin", "teacher", "student"],
      default: "student",
    },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: "Campus" },
    isActive: { type: Boolean, default: true }

  },
  { timestaps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ email: 1 });

export default model("User", userSchema);
