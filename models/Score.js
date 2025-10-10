import { Schema, model } from "mongoose";
import Exam from "./Exam.js";
import Class from "./Class.js";
import Marksheet from "./Marksheet.js";

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
  const exam = await Exam.findById(scoreDoc.exam)
  if (!exam) return;
  const { term, academicSession } = exam
  const classData = await Class.findById(scoreDoc.class).populate('subjects', '_id')
  if (!classData || !classData.subjects) return;
  const subjectIds = classData.subjects.map(sub => sub._id.toString())
  const allScores = await model("Score").find({
    student: scoreDoc.student,
    class: scoreDoc.class
  })
    .populate('exam', 'term academicSession totalMarks')
    .populate('subject', 'name')
  const termScores = allScores.filter(s =>
    s.exam && s.exam.term === term && s.exam.academicSession === academicSession
  )
  const scoredSubject = termScores.map((s) => s.subject._id.toString())
  const allSubjectsScored = subjectIds.every(id => scoredSubject.includes(id))
  if (!allSubjectsScored) {
    console.log("Waiting for all subjects to be scored, cannot generate marksheet")
    return;
  }

  const subjectMap = new Map()
  for (const s of termScores) {
    const subId = s.subject._id.toString()
    if (!subjectMap.has(subId)) {
      subjectMap.set(subId, { subject: s.subject, marksObtained: 0, totalMarks: 0 })
    }
    const subData = subjectMap.get(subId)
    subData.marksObtained += s.marksObtained
    subData.totalMarks += s.exam.totalMarks
  }
  const subjects = Array.from(subjectMap.values()).map(s => {
    const percentage = (s.marksObtained / s.totalMarks) * 100
    return { ...s, percentage, grade: getGrade(percentage) }
  })

  const grandObtained = subjects.reduce((acc, curr) => acc + curr.marksObtained, 0)
  const grandTotal = subjects.reduce((acc, curr) => acc + curr.totalMarks, 0)
  const grandPercentage = (grandObtained / grandTotal) * 100
  const overallGrade = getGrade(grandPercentage)

  let finalRemakarks = "Needs Improvement"
  if (overallGrade === 'A+' || overallGrade === 'A') finalRemakarks = "Excellent"
  else if (overallGrade === 'B') finalRemakarks = "Very Good"
  else if (overallGrade === 'C') finalRemakarks = "Good"
  else if (overallGrade === 'D') finalRemakarks = "Fair"

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
      overallGrade: overallGrade,
      finalRemarks: finalRemakarks
    },
    {upsert: true, new: true}
  )
  console.log("Marksheet generated/updated successfully for student: ", scoreDoc.student)
}

scoreSchema.post('save', async function(doc){
  await generateMarksheet(doc)
})
scoreSchema.post('findOneAndUpdate', async function (doc){
  await generateMarksheet(doc)
})

export default model("Score", scoreSchema);
