import mongoose from "mongoose";
import User from "../models/User.js";
import Campus from "../models/Campus.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";
import Assignment from "../models/Assignment.js";
import TeacherAssignment from "../models/TeacherAssignment.js";
import StudentEnrollment from "../models/StudentEnrollment.js";
import Exam from "../models/Exam.js";
import Score from "../models/Score.js";
import { generateMarksheet } from "../models/Score.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/school-management-system";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

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
      { name: "North Admin", email: "north.admin@school.com", contact: "03010000001", city: "Islamabad" },
      { name: "South Admin", email: "south.admin@school.com", contact: "03010000002", city: "Karachi" },
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
      { name: "North Campus", code: "NORTH-001", city: "Islamabad", admin: campusAdmins[0] },
      { name: "South Campus", code: "SOUTH-001", city: "Karachi", admin: campusAdmins[1] },
    ];

    const campuses = [];
    for (const cs of campusSpecs) {
      const c = await Campus.create({
        name: cs.name,
        code: cs.code,
        address: `${cs.city} Main Road`,
        city: cs.city,
        location: { type: "Point", coordinates: [randomInt(60, 80), randomInt(20, 35)] },
        contact: { phone: "021-111-000000", email: `${cs.name.replace(/\s+/g, "").toLowerCase()}@school.com` },
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

    // 4) Teachers for each campus
    const teachers = {};
    for (const campus of campuses) {
      teachers[campus.code] = [];
      for (let i = 1; i <= 6; i++) {
        const t = await User.create({
          name: `${campus.name.split(' ')[0]} Teacher ${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          email: `${campus.code.toLowerCase()}_teacher${i}@school.com`,
          password: "teacher123",
          contact: `03020000${100 + i}`,
          address: campus.city,
          dob: new Date(`199${i}-01-01`),
          role: "teacher",
          campus: campus._id,
          createdBy: campus.campusAdmin,
        });
        teachers[campus.code].push(t);
      }
    }

    // 5) Create classes (grades 6-8, sections A,B) per campus and assign class teachers
    const classes = [];
    for (const campus of campuses) {
      const campusTeachers = teachers[campus.code];
      const grades = [6, 7, 8];
      const sections = ['A', 'B'];
      for (const grade of grades) {
        for (const section of sections) {
          // pick a random teacher from campus to be class teacher
          const classTeacher = campusTeachers[randomInt(0, campusTeachers.length - 1)];
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

    // 6) Attach subjects to classes and create Assignment documents (campus-class-subject)
    const allAssignments = [];
    for (const cls of classes) {
      // choose 4 subjects for this class randomly
      const chosen = [];
      while (chosen.length < 4) {
        const s = subjects[randomInt(0, subjects.length - 1)];
        if (!chosen.find(x => x._id.equals(s._id))) chosen.push(s);
      }
      // update class subjects
      cls.subjects = chosen.map(s => s._id);
      await cls.save();

      for (const subj of chosen) {
        const asg = await Assignment.create({ campus: cls.campus, class: cls._id, subject: subj._id });
        allAssignments.push(asg);
      }
    }

    // 7) Create TeacherAssignment documents: map each teacher to 2-3 assignments in their campus
    const teacherAssignments = [];
    for (const campus of campuses) {
      const campusAssigns = allAssignments.filter(a => a.campus.equals(campus._id));
      const campusTeachers = teachers[campus.code];
      for (const teacher of campusTeachers) {
        // pick 2-4 assignments
        const picks = [];
        const pickCount = randomInt(2, Math.min(4, campusAssigns.length));
        while (picks.length < pickCount) {
          const cand = campusAssigns[randomInt(0, campusAssigns.length - 1)];
          if (!picks.find(p => p._id.equals(cand._id))) picks.push(cand);
        }
        const ta = await TeacherAssignment.create({ teacher: teacher._id, assignments: picks.map(p => p._id) });
        teacherAssignments.push(ta);
      }
    }

    // 8) Create students and enroll them (8 students per class)
    const students = [];
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
        students.push({ user: stu, class: cls });

        // Enrollment
        const rollNumber = `${cls.grade}${cls.section}${String(i).padStart(2, '0')}`;
        await StudentEnrollment.create({ student: stu._id, campus: cls.campus, class: cls._id, rollNumber, academicSession: '2025-2026' });
      }
    }

    // small pause to ensure indexes are created and DB settled
    await pause(200);

    // 9) Create Exams for each class-subject (two types per subject)
    const exams = [];
    const examTypes = ["Examination", "Assessment 1"];
    for (const cls of classes) {
      // get class subjects
      const clsSubjects = await Subject.find({ _id: { $in: cls.subjects } });
      for (const subj of clsSubjects) {
        for (const type of examTypes) {
          const ex = await Exam.create({
            term: "FirstTerm",
            academicSession: '2025-2026',
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

    // 10) Create Scores for each student for each exam related to their class
    let scoreCount = 0;
    for (const exam of exams) {
      // find students in this class
      const enrolled = students.filter(s => s.class._id.equals(exam.class));
      for (const s of enrolled) {
        const obtained = randomInt(Math.max(30, Math.floor(exam.totalMarks * 0.35)), exam.totalMarks);
        await Score.create({ student: s.user._id, class: exam.class, subject: exam.subject, campus: exam.campus, exam: exam._id, marksObtained: obtained, enteredBy: superAdmin._id });
        scoreCount++;
      }
    }

    console.log("⏳ Regenerating marksheets...");
    const scores = await Score.find();
    for (const score of scores) {
      await generateMarksheet(score);
    }
    console.log("✅ All marksheets generated successfully");

    console.log(`\nSeeding summary:`);
    console.log(`  Super Admin: 1`);
    console.log(`  Campus Admins: ${campusAdmins.length}`);
    console.log(`  Campuses: ${campuses.length}`);
    console.log(`  Subjects: ${subjects.length}`);
    console.log(`  Teachers: ${Object.values(teachers).reduce((a, b) => a + b.length, 0)}`);
    console.log(`  Classes: ${classes.length}`);
    console.log(`  Assignments: ${allAssignments.length}`);
    console.log(`  TeacherAssignments: ${teacherAssignments.length}`);
    console.log(`  Students: ${students.length}`);
    console.log(`  Enrollments: ${students.length}`);
    console.log(`  Exams: ${exams.length}`);
    console.log(`  Scores: ${scoreCount}`);

    console.log('\n✅ Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
