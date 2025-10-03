import { Schema, model } from "mongoose";

const classSchema = new Schema(
  {
    grade: { type: Number, required: true },
    section: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
    campus: {
      type: Schema.Types.ObjectId,
      ref: "Campus",
      required: true,
    },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    // students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    classTeacher: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Campus Admin
    },
  },
  { timestamps: true }
);

export default model("Class", classSchema);
