import Score from "../models/Score.js";
import User from "../models/User.js"; 
import { openrouter } from "../config/openrouter.js";

const buildPrompt = (studentName, scores) => `
You are an expert teacher analyzing ${studentName}'s academic performance.

Here are ${studentName}'s marks:
${scores
  .map(s => `• ${s.subject.name}: ${s.marksObtained}/${s.exam.totalMarks}`)
  .join("\n")}

Give **only a short, personalized study recommendation** (2–4 sentences) for this student. 
Focus on **how they can improve weak subjects** and **how to maintain good performance** in strong subjects.
Avoid long reports or sections. Keep it direct, motivational, and easy to understand.
`;

export const getStudyRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId)
      return res.status(400).json({ message: "Student ID is required" });

    const student = await User.findById(studentId).select("name role");
    if (!student || student.role !== "student")
      return res.status(404).json({ message: "Student not found" });

    const scores = await Score.find({ student: studentId }).populate("subject exam");
    if (!scores.length)
      return res.status(404).json({ message: "No scores found for this student" });

    const prompt = buildPrompt(student.name, scores);

    const response = await openrouter.post(
      "/chat/completions",
      {
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: "You are a professional academic advisor and teacher." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      },
      { timeout: 10000 }
    );

    const recommendation = response?.data?.choices?.[0]?.message?.content || "No recommendation generated.";

    res.json({
      studentId,
      studentName: student.name, 
      totalSubjects: scores.length,
    //   scores: scores.map(s => ({
    //     subject: s.subject.name,
    //     marksObtained: s.marksObtained,
    //     maxMarks: s.exam.totalMarks,
    //   })),
      recommendation,
    });
  } catch (error) {
    console.error("Error in getStudyRecommendations:", error);
    res.status(500).json({
      message: "Error generating study recommendations",
      error: error.response?.data || error.message,
    });
  }
};
