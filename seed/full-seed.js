import mongoose from "mongoose";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
import Assignment from "../models/Assignment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Exam from "../models/Exam.js";
import Score, { generateMarksheet } from "../models/Score.js";
import TeacherAttendance from "../models/TeacherAttendance.js";
import StudentAttendance from "../models/StudentAttendance.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/school-management-system";

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI, { autoIndex: true });
    console.log("Connected to MongoDB ->", MONGODB_URI);

    // Clear old data from main collections used by app
    await Promise.all([
      User.deleteMany(),
      Campus.deleteMany(),
      ClassModel.deleteMany(),
      Subject.deleteMany(),
      Assignment.deleteMany(),
      TeacherAssignment.deleteMany(),
      StudentEnrollment.deleteMany(),
      Exam.deleteMany(),
      Score.deleteMany(),
      TeacherAttendance.deleteMany(),
      StudentAttendance.deleteMany(),
    ]);

    // 1) Super Admin
    const superAdmin = await User.create({
      name: "Super Admin",
      gender: "Male",
      email: "superadmin@example.com",
      password: "superpassword",
      contact: "03000000001",
      address: "Head Office",
      dob: new Date("1980-01-01"),
      role: "super-admin",
    });

    // 2) Create Campus Admins and Campuses
    const campusAdminData = [
      {
        name: "North Admin",
        email: "north.admin@school.com",
        contact: "03010000001",
        city: "Islamabad",
      },
      {
        name: "South Admin",
        email: "south.admin@school.com",
        contact: "03010000002",
        city: "Karachi",
      },
    ];

    const campusAdmins = [];
    for (const admin of campusAdminData) {
      const u = await User.create({
        name: admin.name,
        gender: "Female",
        email: admin.email,
        password: "admin123",
        contact: admin.contact,
        address: admin.city,
        dob: new Date("1990-05-05"),
        role: "campus-admin",
        createdBy: superAdmin._id,
      });
      campusAdmins.push(u);
    }

    const campusSpecs = [
      {
        name: "North Campus",
        code: "NORTH-001",
        city: "Islamabad",
        admin: campusAdmins[0],
      },
      {
        name: "South Campus",
        code: "SOUTH-001",
        city: "Karachi",
        admin: campusAdmins[1],
      },
    ];

    const campuses = [];
    for (const cs of campusSpecs) {
      const c = await Campus.create({
        name: cs.name,
        code: cs.code,
        address: `${cs.city} Main Road`,
        city: cs.city,
        location: {
          type: "Point",
          coordinates: [randomInt(60, 80), randomInt(20, 35)],
        },
        contact: {
          phone: "021-111-000000",
          email: `${cs.name.replace(/\s+/g, "").toLowerCase()}@school.com`,
        },
        campusAdmin: cs.admin._id,
      });
      cs.admin.campus = c._id;
      await cs.admin.save();
      campuses.push(c);
    }

    // 3) Subjects (global)
    const subjectList = [
      { name: "Mathematics", code: "MATH" },
      { name: "English", code: "ENG" },
      { name: "Science", code: "SCI" },
      { name: "History", code: "HIS" },
      { name: "Islamiyat", code: "ISL" },
      { name: "Computer", code: "COMP" },
    ];

    const subjects = [];
    for (const s of subjectList) {
      const doc = await Subject.create({ ...s, createdBy: superAdmin._id });
      subjects.push(doc);
    }

    // 4) Teachers per campus
 const teachers = {};
for (const campus of campuses) {
  teachers[campus.code] = [];
  // find the original campus spec to get the admin
  const cspec = campusSpecs.find((c) => c.code === campus.code);

  for (let i = 1; i <= 6; i++) {
    const t = await User.create({
      name: `${campus.name.split(" ")[0]} Teacher ${i}`,
      gender: i % 2 === 0 ? "Male" : "Female",
      email: `${campus.code.toLowerCase()}_teacher${i}@school.com`,
      password: "teacher123",
      contact: `03020000${100 + i}`,
      address: campus.city,
      dob: new Date(`199${i}-01-01`),
      role: "teacher",
      campus: campus._id,
      createdBy: cspec.admin._id, // ✅ fixed
    });
    teachers[campus.code].push(t);
  }
}

    // 5) Create classes (grades 6-8, sections A,B) per campus and assign unique class teachers
    const classes = [];
    for (const campus of campuses) {
      // make a shallow copy of teachers array and shuffle it so we can assign unique teachers per class
      const campusTeachers = [...teachers[campus.code]];
      // simple Fisher-Yates shuffle
      for (let i = campusTeachers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [campusTeachers[i], campusTeachers[j]] = [campusTeachers[j], campusTeachers[i]];
      }

      const grades = [6, 7, 8];
      const sections = ['A', 'B'];
      let teacherIndex = 0;
      for (const grade of grades) {
        for (const section of sections) {
          // assign each teacher only once as class teacher
          if (teacherIndex >= campusTeachers.length) {
            throw new Error(`Not enough teachers to assign unique class teachers for campus ${campus.name}`);
          }
          const classTeacher = campusTeachers[teacherIndex];
          teacherIndex++;
          const classDoc = await ClassModel.create({
            grade,
            section,
            campus: campus._id,
            classTeacher: classTeacher._id,
            createdBy: campus.campusAdmin,
          });
          classes.push(classDoc);
        }
      }
    }

    // 6) Attach subjects + Assignments
    const allAssignments = [];
    for (const cls of classes) {
      const chosen = [];
      while (chosen.length < 4) {
        const s = subjects[randomInt(0, subjects.length - 1)];
        if (!chosen.find((x) => x._id.equals(s._id))) chosen.push(s);
      }
      cls.subjects = chosen.map((s) => s._id);
      await cls.save();

      for (const subj of chosen) {
        const asg = await Assignment.create({
          campus: cls.campus,
          class: cls._id,
          subject: subj._id,
        });
        allAssignments.push(asg);
      }
    }

    // 7) TeacherAssignments
    const teacherAssignments = [];
    for (const campus of campuses) {
      const campusAssigns = allAssignments.filter((a) =>
        a.campus.equals(campus._id)
      );
      const campusTeachers = teachers[campus.code];
      for (const teacher of campusTeachers) {
        const picks = [];
        const pickCount = randomInt(2, Math.min(4, campusAssigns.length));
        while (picks.length < pickCount) {
          const cand = campusAssigns[randomInt(0, campusAssigns.length - 1)];
          if (!picks.find((p) => p._id.equals(cand._id))) picks.push(cand);
        }
        const ta = await TeacherAssignment.create({
          teacher: teacher._id,
          assignments: picks.map((p) => p._id),
        });
        teacherAssignments.push(ta);
      }
    }

    // 8) Students + Enrollments
    const students = [];
    const enrollments = [];
    for (const cls of classes) {
      for (let i = 1; i <= 8; i++) {
        const stu = await User.create({
          name: `Student ${cls.grade}${cls.section}-${i}`,
          gender: i % 2 === 0 ? "Female" : "Male",
          email: `student_${cls._id.toString().slice(-4)}_${i}@school.com`,
          password: "student123",
          contact: `03030000${i}`,
          address: "Student Address",
          dob: new Date(2008, randomInt(0, 11), randomInt(1, 28)),
          role: "student",
          campus: cls.campus,
          createdBy: cls.createdBy,
        });
        const rollNumber = `${cls.grade}${cls.section}${String(i).padStart(
          2,
          "0"
        )}`;
        const enrollment = await StudentEnrollment.create({
          student: stu._id,
          campus: cls.campus,
          class: cls._id,
          rollNumber,
          academicSession: "2025-2026",
        });
        students.push({ user: stu, class: cls });
        enrollments.push(enrollment);
      }
    }

    await pause(200);

    // 9) Exams
    const exams = [];
    const examTypes = ["Examination", "Assessment 1"];
    for (const cls of classes) {
      const clsSubjects = await Subject.find({ _id: { $in: cls.subjects } });
      for (const subj of clsSubjects) {
        for (const type of examTypes) {
          const ex = await Exam.create({
            term: "FirstTerm",
            academicSession: "2025-2026",
            class: cls._id,
            subject: subj._id,
            campus: cls.campus,
            totalMarks: 100,
            type,
          });
          exams.push(ex);
        }
      }
    }

    // 10) Scores
    // let scoreCount = 0;
    // for (const exam of exams) {
    //   const enrolled = students.filter((s) => s.class._id.equals(exam.class));
    //   for (const s of enrolled) {
    //     const obtained = randomInt(
    //       Math.max(30, Math.floor(exam.totalMarks * 0.35)),
    //       exam.totalMarks
    //     );
    //     await Score.create({
    //       student: s.user._id,
    //       class: exam.class,
    //       subject: exam.subject,
    //       campus: exam.campus,
    //       exam: exam._id,
    //       marksObtained: obtained,
    //       enteredBy: superAdmin._id,
    //     });
    //     scoreCount++;
    //   }
    // }

    // 11) Teacher Attendance (limit 50)
    const teacherAttendances = [];
    const allTeachers = Object.values(teachers).flat();
    for (const teacher of allTeachers.slice(0, 50)) {
      if (!teacher.campus) {
        console.warn(`Teacher ${teacher.name} has no campus assigned.`);
        continue;
      }
      const campus = campuses.find(
        (c) => c._id.toString() === teacher.campus.toString()
      );
      if (!campus) {
        console.warn(`No campus found for teacher ${teacher.name}`);
        continue;
      }
      const date = new Date();
      await TeacherAttendance.create({
        teacher: teacher._id,
        status: ["present", "absent", "leave"][randomInt(0, 2)],
        campus: campus._id,
        checkIn: new Date(date.setHours(8, randomInt(0, 59))),
        checkOut: new Date(date.setHours(14, randomInt(0, 59))),
        date,
        markedBy: campus.campusAdmin._id,
      });
      teacherAttendances.push(teacher._id);
    }

  if (!campus) {
    console.warn(`Campus not found for teacher ${teacher.name}, skipping attendance.`);
    continue;
  }

  if (!campus.campusAdmin) {
    console.warn(`Campus admin missing for campus ${campus.name}, skipping teacher ${teacher.name}`);
    continue;
  }

  await TeacherAttendance.create({
    teacher: teacher._id,
    status: ["present", "absent", "leave"][randomInt(0, 2)],
    campus: campus._id,
    checkIn: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, randomInt(0, 59)),
    checkOut: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 14, randomInt(0, 59)),
    date,
    markedBy: campus.campusAdmin._id,
  });

  teacherAttendances.push(teacher._id);
}

// 12) Student Attendance (limit 50)
const studentAttendances = [];
for (const enrollment of enrollments.slice(0, 50)) {
  for (let d = 0; d < 60; d++) { // 60 days back
    const date = new Date();
    date.setDate(date.getDate() - d); // generate past dates
    await StudentAttendance.create({
      enrollment: enrollment._id,
      status: ["present", "absent", "leave"][randomInt(0, 2)],
      class: enrollment.class,
      campus: enrollment.campus,
      date,
      markedBy: superAdmin._id,
    });

  studentAttendances.push(enrollment._id);
  }
}

    // 12) Student Attendance
    // for (const enrollment of enrollments.slice(0, 30)) {
    //   for (let d = 0; d < 5; d++) {
    //     const date = new Date();
    //     date.setDate(date.getDate() - d);
    //     await StudentAttendance.create({
    //       enrollment: enrollment._id,
    //       status: ["present", "absent", "leave"][randomInt(0, 2)],
    //       class: enrollment.class,
    //       campus: enrollment.campus,
    //       date,
    //       markedBy: superAdmin._id,
    //     });
    //   }
    // }

    // Generate marksheets
    // console.log("⏳ Regenerating marksheets...");
    // const scores = await Score.find();
    // for (const score of scores) {
    //   await generateMarksheet(score);
    // }

    console.log("✅ All marksheets generated successfully");
    console.log("\nSeeding summary:");
    console.log(`  Teachers Attendance: ✅`);
    console.log(`  Students Attendance: ✅`);
    // console.log(`  Scores: ${scoreCount}`);
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seed();
