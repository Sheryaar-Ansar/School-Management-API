import { Schema, model } from "mongoose";

// ** Ya to iska schema use karsakte hain Auto generate ke liye ke jaise hi marks add hote jaen, marksheet update hoti jae (kisi function se ya or method se) lekin ye mushkil bhi hosakta he, To second option phir Aggregation se hi directly on click "Generate marksheet" pe queries chalake generate kara sakte hain marksheet (Route hit hone pe) **

const marksheetSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    term: {
      type: String,
      enum: ["FirstTerm", "SecondTerm"],
      required: true,
    },
    academicSession: { type: String, required: true },
    subjects: [
      {
        subject: {
          type: Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        marksObtained: { type: Number, required: true },
        totalMarks: { type: Number, required: true },
        percentage: { type: Number, required:true  },
        grade: { type: String, required:true  },
      },
    ],
    grandTotal: { type: Number, required: true },
    grandObtained: { type: Number, required: true },
    overallPercentage: { type: Number, required: true },
    rank: { type: Number }, // position
    finalRemarks: {
      type: String,
    },
  },
  { timestamps: true }
);

export default model("Marksheet", marksheetSchema);
