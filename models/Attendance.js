import { Schema, model } from "mongoose";

const attendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    campus: { type: Schema.Types.ObjectId, ref: "Campus" },
    date: { type: Date, default: Date.now() },
  },
  { timestamps: true }
);

export default model("Attendance", attendanceSchema);
