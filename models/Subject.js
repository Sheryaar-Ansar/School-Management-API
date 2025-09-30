import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true }, 
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);