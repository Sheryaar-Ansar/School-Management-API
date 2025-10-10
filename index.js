import express from "express";
import "dotenv/config";
import connectDB from "./db/index.js";
import authRoutes from "./routes/authRoutes.js"

import classRoutes from './routes/classRoutes.js'
import campusRoutes from './routes/campusRoutes.js'
import subjectRoutes from './routes/subjectRoutes.js'
import studentAttendanceRoutes from './routes/studentAttendanceRoutes.js'
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js'
import enrollmentRoutes from './routes/enrollmentRoutes.js'
import examRoutes from './routes/examRoutes.js'
import scoreRoutes from './routes/scoreRoutes.js'
import marksheetRoutes from './routes/marksheetRoute.js'

const app = express();

connectDB();
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes)
app.use('/api/campuses', campusRoutes)
app.use('/api/classes', classRoutes)
app.use('/api/subjects', subjectRoutes)
app.use("/api/attendance/students", studentAttendanceRoutes);
app.use("/api/attendance/teachers", teacherAttendanceRoutes);
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/score', scoreRoutes)
app.use('/api/result', marksheetRoutes)

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
