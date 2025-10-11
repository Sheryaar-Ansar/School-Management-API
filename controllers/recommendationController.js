import Score from "../models/Score.js";
import { openai } from "../config/openai.js";

export const getStudyRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Fetch all scores for the student
    const scores = await Score.find({ student: studentId }).populate("subject exam");

    if (!scores.length) {
      return res.status(404).json({ message: "No scores found for this student" });
    }

    // Identify weak subjects (marks < 50)
    const weakSubjects = scores
      .filter(s => s.marksObtained < 50)
      .map(s => ({
        subject: s.subject.name,
        marksObtained: s.marksObtained,
        exam: s.exam.name,
        maxMarks: s.exam.totalMarks,
      }));

    // Prepare prompt for OpenAI
    const prompt = `
You are an expert teacher. 
A student has scored the following marks:

${weakSubjects.map(ws => `Subject: ${ws.subject}, Marks: ${ws.marksObtained}/${ws.maxMarks}`).join("\n")}

Provide personalized study recommendations for this student to improve in these subjects. 
Be concise and actionable.
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You provide study tips and recommendations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const recommendation = completion.choices[0].message.content;

    res.json({
      studentId,
      weakSubjects,
      recommendation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating study recommendations", error: error.message });
  }
};
