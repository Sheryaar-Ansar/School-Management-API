import express from "express";

import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { deleteStudentAttendance, getAllStudentsAttendance, getStudentAttendance, markBulkStudentAttendance, updateStudentAttendance } from "../controllers/studentAttendanceController.js";

const router = express.Router();

router.post("/markAttendance", authenticate, authRole("teacher", "campus-admin"), markBulkStudentAttendance);
router.get("/", authenticate, authRole("campus-admin"), getAllStudentsAttendance);
router.get("/:studentId", authenticate, authRole("campus-admin"), getStudentAttendance);
router.put("/:id", authenticate, authRole("campus-admin"), updateStudentAttendance);
router.delete("/:id", authenticate, authRole("campus-admin"), deleteStudentAttendance);

export default router;
