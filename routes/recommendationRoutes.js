import express from "express";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { getStudyRecommendations } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/:studentId", authenticate, authRole(["student", "campus-admin", "super-admin"]), getStudyRecommendations);

export default router;
