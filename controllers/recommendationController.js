import Score from "../models/Score.js";
import { openrouter } from "../config/openrouter.js";

export const getStudyRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    const scores = await Score.find({ student: studentId }).populate("subject exam");

    if (!scores.length) {
      return res.status(404).json({ message: "No scores found for this student" });
    }

    const weakSubjects = scores
      .filter(s => s.marksObtained < 50)
      .map(s => ({
        subject: s.subject.name,
        marksObtained: s.marksObtained,
        exam: s.exam.name,
        maxMarks: s.exam.totalMarks,
      }));

    const prompt = `
You are an expert teacher.
A student has scored the following marks:

${weakSubjects.map(ws => `Subject: ${ws.subject}, Marks: ${ws.marksObtained}/${ws.maxMarks}`).join("\n")}

Provide personalized study recommendations for this student to improve in these subjects.
Be concise and actionable.
`;

    const response = await openrouter.post("/chat/completions", {
      model: "meta-llama/llama-3.3-70b-instruct:free", 
      messages: [
        { role: "system", content: "You are a helpful education assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const recommendation = response.data.choices[0].message.content;

    res.json({
      studentId,
      weakSubjects,
      recommendation,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      message: "Error generating study recommendations",
      error: error.message,
    });
  }
};


// import Score from "../models/Score.js";
// import { openai } from "../config/openai.js";

// export const getStudyRecommendations = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const scores = await Score.find({ student: studentId }).populate("subject exam");

//     if (!scores.length) {
//       return res.status(404).json({ message: "No scores found for this student" });
//     }

//     const weakSubjects = scores
//       .filter(s => s.marksObtained < 50)
//       .map(s => ({
//         subject: s.subject.name,
//         marksObtained: s.marksObtained,
//         exam: s.exam.name,
//         maxMarks: s.exam.totalMarks,
//       }));

//     const prompt = `
// You are an expert teacher. 
// A student has scored the following marks:

// ${weakSubjects.map(ws => `Subject: ${ws.subject}, Marks: ${ws.marksObtained}/${ws.maxMarks}`).join("\n")}

// Provide personalized study recommendations for this student to improve in these subjects. 
// Be concise and actionable.
// `;

//     // Call OpenAI API
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: "You provide study tips and recommendations." },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.7,
//     });

//     const recommendation = completion.choices[0].message.content;

//     res.json({
//       studentId,
//       weakSubjects,
//       recommendation,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error generating study recommendations", error: error.message });
//   }
// };
