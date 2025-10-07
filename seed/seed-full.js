import mongoose from "mongoose";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
// Assignment and TeacherAssignment intentionally omitted per request
import Exam from "../models/Exam.js";
import Score from "../models/Score.js";
import Marksheet from "../models/Marksheet.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import StudentAttendance from "../models/StudentAttendance.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/school-management-system";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("DB Connected ✅");

    // Clear old data (except StudentEnrollment per request)
    await Marksheet.deleteMany();
    await Score.deleteMany();
    await Exam.deleteMany();
  // Do not delete or create assignments / teacher-assignments per request
    await Subject.deleteMany();
    await ClassModel.deleteMany();
    await TeacherAttendance.deleteMany();
    await StudentAttendance.deleteMany();
    await User.deleteMany();
    await Campus.deleteMany();

    // Super Admin
    const superAdmin = await User.create({
      name: "Saad",
      gender: "Male",
      email: "saad@gmail.com",
      password: "123456",
      contact: "03001234567",
      address: "Head Office Karachi",
      dob: new Date("1990-01-01"),
      role: "super-admin",
    });

    // Create multiple campuses and their campus-admins, classes, teachers, students, exams, scores and attendance
    const campusesInfo = [
      {
        name: "Campus A",
        code: "CAMP-A",
        address: "Main Street, Karachi",
        city: "Karachi",
        location: { type: "Point", coordinates: [67.0011, 24.8607] },
        contact: { phone: "021-111222333", email: "campusA@school.com" },
        admin: { name: "Admin A", email: "adminA@school.com", contact: "03009998888", gender: "Male", dob: new Date("1985-05-15") }
      },
      {
        name: "Campus B",
        code: "CAMP-B",
        address: "Mall Road, Lahore",
        city: "Lahore",
        location: { type: "Point", coordinates: [74.3587, 31.5204] },
        contact: { phone: "042-222333444", email: "campusB@school.com" },
        admin: { name: "Admin B", email: "adminB@school.com", contact: "03008887777", gender: "Female", dob: new Date("1988-07-20") }
      },
      {
        name: "Campus C",
        code: "CAMP-C",
        address: "Central Ave, Islamabad",
        city: "Islamabad",
        location: { type: "Point", coordinates: [73.0479, 33.6844] },
        contact: { phone: "051-333444555", email: "campusC@school.com" },
        admin: { name: "Admin C", email: "adminC@school.com", contact: "03007776666", gender: "Male", dob: new Date("1986-02-02") }
      }
    ];

    const campuses = [];

    // create subjects first
    const math = await Subject.create({ name: "Mathematics", code: "MATH" , createdBy: superAdmin._id});
    const eng = await Subject.create({ name: "English", code: "ENG" , createdBy: superAdmin._id});
    const sci = await Subject.create({ name: "Science", code: "SCI" , createdBy: superAdmin._id});

    for (const info of campusesInfo) {
      // create admin first so campus can be created with campusAdmin set (avoids validation if required)
      const admin = await User.create({
        name: info.admin.name,
        gender: info.admin.gender,
        email: info.admin.email,
        password: "admin123",
        contact: info.admin.contact,
        address: info.address,
        dob: info.admin.dob,
        role: "campus-admin",
      });

      const campus = await Campus.create({
        name: info.name,
        code: info.code,
        address: info.address,
        city: info.city,
        location: info.location,
        contact: info.contact,
        campusAdmin: admin._id
      });

      // set admin.campus now that campus exists
      admin.campus = campus._id;
      await admin.save();

      // create classes
      const class1 = await ClassModel.create({ grade: 1, section: "A", campus: campus._id, subjects: [math._id, eng._id], classTeacher: null, createdBy: admin._id });
      const class2 = await ClassModel.create({ grade: 2, section: "A", campus: campus._id, subjects: [math._id, eng._id, sci._id], classTeacher: null, createdBy: admin._id });

      // teachers & students
      const teacher1 = await User.create({ name: `${info.name} Teacher 1`, gender: "Female", email: `teacher_${info.code.toLowerCase()}_1@school.com`, password: "teacher123", contact: "03001231231", address: info.address, dob: new Date("1992-03-15"), role: "teacher", campus: campus._id });
      const teacher2 = await User.create({ name: `${info.name} Teacher 2`, gender: "Male", email: `teacher_${info.code.toLowerCase()}_2@school.com`, password: "teacher123", contact: "03001230000", address: info.address, dob: new Date("1990-06-10"), role: "teacher", campus: campus._id });

      const student1 = await User.create({ name: `${info.name} Student 1`, gender: "Male", email: `student_${info.code.toLowerCase()}_1@school.com`, password: "student123", contact: "03005556666", address: info.address, dob: new Date("2005-09-25"), role: "student", campus: campus._id });
      const student2 = await User.create({ name: `${info.name} Student 2`, gender: "Female", email: `student_${info.code.toLowerCase()}_2@school.com`, password: "student123", contact: "03005557777", address: info.address, dob: new Date("2006-04-12"), role: "student", campus: campus._id });

      // assign first class teacher
      class1.classTeacher = teacher1._id; await class1.save();

      // Exams
      const exam1 = await Exam.create({ name: `${info.name} Midterm Math`, term: "FirstTerm", academicSession: "2024-2025", class: class1._id, subject: math._id, campus: campus._id, totalMarks: 100, type: "Examination" });
      const exam2 = await Exam.create({ name: `${info.name} English Quiz`, term: "FirstTerm", academicSession: "2024-2025", class: class2._id, subject: eng._id, campus: campus._id, totalMarks: 50, type: "Assessment 1" });

      // Scores
      await Score.create({ student: student1._id, class: class1._id, subject: math._id, campus: campus._id, exam: exam1._id, marksObtained: 78, remarks: "Good", enteredBy: teacher1._id });
      await Score.create({ student: student2._id, class: class2._id, subject: eng._id, campus: campus._id, exam: exam2._id, marksObtained: 42, remarks: "Needs practice", enteredBy: teacher2._id });

      // Marksheet
      await Marksheet.create({ student: student1._id, class: class1._id, term: "FirstTerm", academicSession: "2024-2025", subjects: [ { subject: math._id, marksObtained: 78, totalMarks: 100, percentage: 78, grade: "B" } ], grandTotal: 100, grandObtained: 78, overallPercentage: 78, rank: 1, finalRemarks: "Well done" });

      // Teacher Attendance
      await TeacherAttendance.create({ teacher: teacher1._id, status: "present", campus: campus._id, checkIn: new Date(), markedBy: admin._id });
      await TeacherAttendance.create({ teacher: teacher2._id, status: "present", campus: campus._id, checkIn: new Date(), markedBy: admin._id });

      campuses.push({ campus, admin });
    }

    // Student Attendance (note: this uses enrollment ref — but per request we should avoid creating StudentEnrollment records; instead we will create attendance records referencing null/placeholder enrollments is invalid. So we will skip creating studentAttendance records that require enrollment.)

    console.log("✅ Full seeding Completed (excluding enrollments)");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seed();
