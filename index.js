import express from "express";
import "dotenv/config";
import connectDB from "./db/index.js";
import authRoutes from "./routes/authRoutes.js"

import classRoutes from './routes/classRoutes.js'
import campusRoutes from './routes/campusRoutes.js'
import subjectRoutes from './routes/subjectRoutes.js'
import studentAttendanceRoutes from './routes/studentAttendanceRoutes.js'
import teacherAttendanceRoutes from './routes/teacherAttendanceRoutes.js'

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
