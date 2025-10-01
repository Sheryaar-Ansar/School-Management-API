import { Schema, model } from "mongoose";

const studentAttendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    class: { type: Schema.Types.ObjectId, ref: "Class" },
    campus: { type: Schema.Types.ObjectId, ref: "Campus" },
    date: { type: Date, default: Date.now() },
  },
  { timestamps: true }
);

export default model("StudentAttendance", studentAttendanceSchema);
