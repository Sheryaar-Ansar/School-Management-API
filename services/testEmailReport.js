import "dotenv/config";
import mongoose from "mongoose";
import { sendEmailReport } from "../utils/nodemailer.js";
import StudentAttendance from "../models/StudentAttendance.js";
import StudentEnrollment from "../models/StudentEnrollment.js"; // must import
import User from "../models/User.js"; // must import

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/school-management-system";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const testGenerateSingleReport = async () => {
  try {
    // Pick a single student attendance record for testing
    const record = await StudentAttendance.findOne()
      .populate({
        path: "enrollment",
        populate: { path: "student", select: "name email" }, // needs User model loaded
      });

    if (!record) {
      console.log("No attendance records found.");
      return;
    }

    const studentName = record.enrollment.student.name;
    // const studentEmail = record.enrollment.student.email;
    const studentEmail = "saadkhalid0095@gmail.com";

    // Prepare a fake monthly report
    const report = {
      totalDays: 20,
      // presentDays: 18,
      // absentDays: 2,
      presentDays: 10,
      absentDays: 10,
      attendancePercentage: 50,
      studentName,
    };

    await sendEmailReport(report, new Date().getMonth(), new Date().getFullYear(), studentEmail);
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Error sending test email:", err);
  } finally {
    mongoose.connection.close();
  }
};

testGenerateSingleReport();
