import { Schema, model } from "mongoose";

const scoreSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    isPresent: { type: Boolean, default: true },
    marksObtained: { type: Number, required: true },

    // You can calculate Percentage from marks
    remarks: { type: String }, // Optional
    enteredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

scoreSchema.index({ student: 1, exam: 1 }, { unique: true });

export default model("Score", scoreSchema);
