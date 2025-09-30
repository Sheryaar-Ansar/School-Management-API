// models/Class.js
import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    grade: { type: Number, required: true },
    section: { type: String, required: true },
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
