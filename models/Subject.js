import { model, Schema } from "mongoose";

const subjectSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true }, 
  },
  { timestamps: true }
);

export default model("Subject", subjectSchema);