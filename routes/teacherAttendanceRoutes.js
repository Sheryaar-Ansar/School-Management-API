import express from "express";

import { authenticate, authRole } from "../middlewares/authMiddleware.js";
import { deleteTeacherAttendance, getAllTeacherAttendance, getTeacherAttendance, markTeacherAttendance, teacherCheckOut, updateTeacherAttendance } from "../controllers/teacherAttendanceController.js";

const router = express.Router();

router.post("/markAttendance", authenticate, authRole(["teacher","campus-admin", "super-admin"]), markTeacherAttendance);
router.put("/checkout", authenticate, authRole(["teacher", "campus-admin", "super-admin"]), teacherCheckOut);
router.get("/", authenticate, authRole(["campus-admin", "super-admin"]), getAllTeacherAttendance);
router.get("/:teacherId", authenticate, authRole(["campus-admin", "super-admin"]), getTeacherAttendance);
router.put("/teacher/:id", authenticate, authRole(["campus-admin", "super-admin"]), updateTeacherAttendance);
router.delete("/teacher/:id", authenticate, authRole(["campus-admin", "super-admin"]), deleteTeacherAttendance);


export default router;
