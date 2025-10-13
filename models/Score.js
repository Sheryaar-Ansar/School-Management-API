import "dotenv/config";
import { Schema, model } from "mongoose";
import Exam from "./Exam.js";
import Class from "./Class.js";
import Marksheet from "./Marksheet.js";
import { openrouter } from "../config/openrouter.js";

const scoreSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    campus: { type: Schema.Types.ObjectId, ref: "Campus", required: true },

    exam: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    isPresent: { type: Boolean, default: true },
    marksObtained: { type: Number, min: 0, required: true },

    // You can calculate Percentage from marks
    remarks: { type: String }, // Optional
    enteredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

scoreSchema.index({ student: 1, exam: 1 }, { unique: true });

function getGrade(percentage) {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

export async function generateMarksheet(scoreDoc) {
  if (!scoreDoc) return;
  const exam = await Exam.findById(scoreDoc.exam);
  if (!exam) return;

  const { term, academicSession } = exam;
  const classData = await Class.findById(scoreDoc.class).populate("subjects", "_id name");
  if (!classData || !classData.subjects) return;

  const subjectIds = classData.subjects.map((sub) => sub._id.toString());
  const allScores = await model("Score")
    .find({ student: scoreDoc.student, class: scoreDoc.class })
    .populate("exam", "term academicSession totalMarks")
    .populate("subject", "name")
    .populate("student", "name"); 

  const termScores = allScores.filter(
    (s) => s.exam && s.exam.term === term && s.exam.academicSession === academicSession
  );

  const scoredSubject = termScores.map((s) => s.subject._id.toString());
  const allSubjectsScored = subjectIds.every((id) => scoredSubject.includes(id));
  if (!allSubjectsScored) {
    console.log("Waiting for all subjects to be scored, cannot generate marksheet");
    return;
  }

  const subjectMap = new Map();
  for (const s of termScores) {
    const subId = s.subject._id.toString();
    if (!subjectMap.has(subId)) {
      subjectMap.set(subId, { subject: s.subject, marksObtained: 0, totalMarks: 0 });
    }
    const subData = subjectMap.get(subId);
    subData.marksObtained += s.marksObtained;
    subData.totalMarks += s.exam.totalMarks;
  }

  const subjects = Array.from(subjectMap.values()).map((s) => {
    const percentage = (s.marksObtained / s.totalMarks) * 100;
    return { ...s, percentage, grade: getGrade(percentage) };
  });

  const grandObtained = subjects.reduce((acc, curr) => acc + curr.marksObtained, 0);
  const grandTotal = subjects.reduce((acc, curr) => acc + curr.totalMarks, 0);
  const grandPercentage = (grandObtained / grandTotal) * 100;
  const overallGrade = getGrade(grandPercentage);

  let finalRemarks = "Needs Improvement";
  if (overallGrade === "A+" || overallGrade === "A") finalRemarks = "Excellent";
  else if (overallGrade === "B") finalRemarks = "Very Good";
  else if (overallGrade === "C") finalRemarks = "Good";
  else if (overallGrade === "D") finalRemarks = "Fair";

  try {
    const prompt = `
You are a teacher writing brief report card feedback.
Analyze the student's performance based on subjects and grades.

Student: ${termScores[0].student.name || "Unknown Student"}

Subjects and marks:
${subjects
  .map(
    (s) =>
      `• ${s.subject.name}: ${s.marksObtained}/${s.totalMarks} (${s.grade})`
  )
  .join("\n")}

Write a short, 1–2 sentence remark focusing on strengths and improvement areas.
Keep it encouraging and personalized.
`;

  const aiResponse = await openrouter.post("/chat/completions", {
model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: "You are a kind, concise, and experienced school teacher providing feedback.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.6,
    max_tokens: 30,
  });

    const aiRemark =
      aiResponse.data?.choices?.[0]?.message?.content?.trim() || finalRemarks;
console.log(aiResponse.data?.choices?.[0]?.message?.content?.trim());

    finalRemarks = aiRemark;
  } catch (error) {
    console.error("AI remark generation failed:", error.message);
  }

  await Marksheet.findOneAndUpdate(
    { student: scoreDoc.student, class: scoreDoc.class, term, academicSession },
    {
      student: scoreDoc.student,
      class: scoreDoc.class,
      campus: scoreDoc.campus,
      term,
      academicSession,
      subjects,
      grandObtained,
      grandTotal,
      overallPercentage: grandPercentage,
      overallGrade,
      finalRemarks,
    },
    { upsert: true, new: true }
  );

  console.log("✅ Marksheet generated with AI remarks for:", scoreDoc.student);
}

scoreSchema.post('save', async function(doc){
  await generateMarksheet(doc)
})
scoreSchema.post('findOneAndUpdate', async function (doc){
  await generateMarksheet(doc)
})

export default model("Score", scoreSchema);
