import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/classController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, authRole(["campus-admin", 'super-admin']), createClass);
router.get("/", authenticate, authRole(["campus-admin", 'super-admin']), getAllClasses);
router.get("/:id", authenticate, authRole(["campus-admin", 'super-admin']), getClassById);
router.put("/:id", authenticate, authRole(["campus-admin", 'super-admin']), updateClass);
router.delete("/:id", authenticate, authRole(["campus-admin", 'super-admin']), deleteClass);

export default router;
