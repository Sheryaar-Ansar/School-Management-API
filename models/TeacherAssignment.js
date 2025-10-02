import { model, Schema } from "mongoose";

const teacherAssignmentSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },
    // campus: [{ type: Schema.Types.ObjectId, ref: "Campus", required: true }],

    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    // class: [{ type: Schema.Types.ObjectId, ref: "Class", required: true }],

    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    // subject: [{ type: Schema.Types.ObjectId, ref: "Subject", required: true}],
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// teacherID: 123, 1, 7, Math
// teacherID: 123, 1, 7, Urdu 
// teacherID: 123, 1, 8, Urdu 

// Index -> For uniqueness
teacherAssignmentSchema.index(
  { teacher: 1, campus: 1, class: 1, subject: 1 },
  { unique: true }
);

export default model("TeacherAssignment", teacherAssignmentSchema);
