import express from "express";
import {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/classController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authRole("campus-admin"), createClass);
router.get("/", authenticate, authRole("campus-admin"), getClasses);
router.get("/:id", authenticate, authRole("campus-admin"), getClassById);
router.put("/:id", authenticate, authRole("campus-admin"), updateClass);
router.delete("/:id", authenticate, authRole("campus-admin"), deleteClass);

export default router;
