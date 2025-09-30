import { Schema,model } from "mongoose";

const classSchema = new Schema(
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

export default model("Class", classSchema);
