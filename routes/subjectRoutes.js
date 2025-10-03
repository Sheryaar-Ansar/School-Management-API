import express from "express";
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
  getSubjectById,
} from "../controllers/subjectController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authRole("super-admin"), createSubject);
router.get("/", authenticate, authRole("super-admin"), getAllSubjects);
router.get("/:id", authenticate, authRole("super-admin"), getSubjectById);
router.put("/:id", authenticate, authRole("super-admin"), updateSubject);
router.delete("/:id", authenticate, authRole("super-admin"), deleteSubject);

export default router;
