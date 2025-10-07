import mongoose from "mongoose";
import User from "../models/User.js";
import Campus from "../models/Campus.js";

const seed = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/school-management-system");
    console.log("DB Connected ✅");

    // Clear old data
    await User.deleteMany();
    await Campus.deleteMany();

    // Super Admin
    const superAdmin = await User.create({
      name: "Saad",
      gender: "Male",
      email: "saad@gmail.com",
      password: "123456", // plain text -> pre-save will hash
      contact: "03001234567",
      address: "Head Office Karachi",
      dob: new Date("1990-01-01"),
      role: "super-admin",
    });

    // Campus Admins (create first so Campus can be created with required campusAdmin)
    const campusAdminA = await User.create({
      name: "Admin A",
      gender: "Male",
      email: "adminA@school.com",
      password: "adminA123",
      contact: "03009998888",
      address: "Karachi",
      dob: new Date("1985-05-15"),
      role: "campus-admin",
    });

    const campusAdminB = await User.create({
      name: "Admin B",
      gender: "Female",
      email: "adminB@school.com",
      password: "adminB123",
      contact: "03008887777",
      address: "Lahore",
      dob: new Date("1988-07-20"),
      role: "campus-admin",
    });

    // Campus A
    const campusA = await Campus.create({
      name: "Campus A",
      code: "CAMP-A",
      address: "Main Street, Karachi",
      city: "Karachi",
      location: { type: "Point", coordinates: [67.0011, 24.8607] },
      contact: { phone: "021-111222333", email: "campusA@school.com" },
      campusAdmin: campusAdminA._id
    });

    // Campus B
    const campusB = await Campus.create({
      name: "Campus B",
      code: "CAMP-B",
      address: "Mall Road, Lahore",
      city: "Lahore",
      location: { type: "Point", coordinates: [74.3587, 31.5204] },
      contact: { phone: "042-222333444", email: "campusB@school.com" },
      campusAdmin: campusAdminB._id
    });

    // link admin -> campus
    campusAdminA.campus = campusA._id;
    campusAdminB.campus = campusB._id;
    await campusAdminA.save();
    await campusAdminB.save();

    // Teachers + Students in Campus A
    await User.create({
      name: "Teacher A1",
      gender: "Female",
      email: "teacherA1@school.com",
      password: "teacher123",
      contact: "03001231231",
      address: "Karachi",
      dob: new Date("1992-03-15"),
      role: "teacher",
      campus: campusA._id,
    });

    await User.create({
      name: "Student A1",
      gender: "Male",
      email: "studentA1@school.com",
      password: "student123",
      contact: "03005556666",
      address: "Karachi",
      dob: new Date("2005-09-25"),
      role: "student",
      campus: campusA._id,
    });

    // Teachers + Students in Campus B
    await User.create({
      name: "Teacher B1",
      gender: "Male",
      email: "teacherB1@school.com",
      password: "teacher123",
      contact: "03007778888",
      address: "Lahore",
      dob: new Date("1990-04-10"),
      role: "teacher",
      campus: campusB._id,
    });

    await User.create({
      name: "Student B1",
      gender: "Female",
      email: "studentB1@school.com",
      password: "student123",
      contact: "03009990000",
      address: "Lahore",
      dob: new Date("2006-12-12"),
      role: "student",
      campus: campusB._id,
    });

    console.log("✅ Seeding Completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seed();
