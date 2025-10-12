import express from "express";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { getStudyRecommendations } from "../controllers/aiController.js";
import { openrouter } from "../config/openrouter.js";

const router = express.Router();

router.get("/recommendation/:studentId", authenticate, authRole(["student", "campus-admin", "super-admin"]), getStudyRecommendations);
// router.get("/study-planner/:studentId", authenticate, authRole(["student", "campus-admin", "super-admin"]), getStudyRecommendations);
router.get("/test-ai", async (req, res) => {
  try {
    const response = await openrouter.post("/chat/completions", {
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: "Say Hello!" }],
    });

    res.json(response.data.choices[0].message);
  } catch (error) {
    console.error("❌ AI Test Failed:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

router.get("/debug-key", (req, res) => {
  res.json({
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "✅ Loaded" : "❌ Missing",
  });
});

export default router;
