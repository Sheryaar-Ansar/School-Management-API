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
    classTeacher: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true }

  },
  { timestamps: true }
);

export default model("Class", classSchema);
