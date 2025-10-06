import express from "express";

import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { deleteTeacherAttendance, getTeacherAttendance, markTeacherAttendance, teacherCheckOut, updateTeacherAttendance } from "../controllers/teacherAttendanceController.js";

const router = express.Router();

router.post("/markAttendance", authenticate, authRole("teacher","campus-admin"), markTeacherAttendance);
router.get("/checkout", authenticate, authRole("teacher", "campus-admin"), teacherCheckOut);
router.get("/:id", authenticate, authRole("campus-admin"), getTeacherAttendance);
router.put("/:id", authenticate, authRole("campus-admin"), updateTeacherAttendance);
router.delete("/:id", authenticate, authRole("campus-admin"), deleteTeacherAttendance);

export default router;
