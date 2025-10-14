import mongoose from "mongoose";
import Campus from "../models/Campus.js";
import Score from "../models/Score.js";
import User from "../models/User.js";

export const getOverviewStats = async (req, res) => {
  try {
    const { from, to, campusId } = req.query;
    let filter = {};

    if (req.user.role === "campus-admin") {
      filter.createdBy = req.user._id;
    } else if (campusId) {
      const campus = await Campus.findById(campusId);
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      filter.createdBy = campus.campusAdmin;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const [campusCount, studentCount, teacherCount] = await Promise.all([
      req.user.role === "super-admin" ? Campus.countDocuments() : 1,
      User.countDocuments({
        role: "student",
        isActive: true,
        ...filter,
      }),
      User.countDocuments({
        role: "teacher",
        isActive: true,
        ...filter,
      }),
    ]);

    return res.status(200).json({
      data: { campusCount, studentCount, teacherCount },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTopPerformers = async (req, res) => {
  try {
    const { campusId, classId, academicSession, term } = req.query;
    let matchStage = {};

    if (req.user.role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: req.user._id });
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      matchStage.campus = campus._id;

      if (classId) matchStage.class = new mongoose.Types.ObjectId(classId);
    } else {
      if (campusId) matchStage.campus = new mongoose.Types.ObjectId(campusId);
      if (classId) matchStage.class = new mongoose.Types.ObjectId(classId);
    }

    const topPerformers = await Score.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
      ...(academicSession || term
        ? [
            {
              $match: {
                ...(academicSession && {
                  "exam.academicSession": academicSession,
                }),
                ...(term && { "exam.term": term }),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "campus",
          localField: "campus",
          foreignField: "_id",
          as: "campus",
        },
      },
      { $unwind: "$campus" },
      {
        $lookup: {
          from: "classes",
          localField: "class",
          foreignField: "_id",
          as: "class",
        },
      },
      { $unwind: "$class" },
      {
        $group: {
          _id: {
            campusId: "$campus._id",
            campusName: "$campus.name",
            studentId: "$student._id",
            studentName: "$student.name",
            classId: "$class._id",
            classGrade: "$class.grade",
            classSection: "$class.section",
          },
          totalMarks: { $sum: "$marksObtained" },
          avgMarks: { $avg: "$marksObtained" },
          examCount: { $sum: 1 },
        },
      },
      {
        $addFields: {
          avgPercentage: {
            $round: [{ $divide: ["$totalMarks", "$examCount"] }, 2],
          },
        },
      },
      { $sort: { avgMarks: -1 } },
      {
        $group: {
          _id: {
            campusId: "$_id.campusId",
            campusName: "$_id.campusName",
          },
          topStudents: {
            $push: {
              studentId: "$_id.studentId",
              name: "$_id.studentName",
              avgMarks: "$avgMarks",
              avgPercentage: "$avgPercentage",
              classId: "$_id.classId",
              classGrade: "$_id.classGrade",
              classSection: "$_id.classSection",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          campusId: "$_id.campusId",
          campusName: "$_id.campusName",
          topStudents: { $slice: ["$topStudents", 3] },
        },
      },
    ]);

    let finalData = topPerformers;
    if (req.user.role === "super-admin" && !campusId) {
      const allCampuses = await Campus.find({}, "_id name");
      finalData = allCampuses.map((c) => {
        const found = topPerformers.find(
          (p) => p.campusId.toString() === c._id.toString()
        );
        return (
          found || {
            campusId: c._id,
            campusName: c.name,
            topStudents: [],
          }
        );
      });
    }

    const firstCampus = finalData[0];
    const firstStudent = firstCampus?.topStudents?.[0];
    const classLabel =
      firstStudent && firstStudent.classGrade && firstStudent.classSection
        ? `${firstStudent.classGrade}${firstStudent.classSection}`
        : "All";

    res.status(200).json({
      filtersApplied: {
        academicSession: academicSession || "All",
        term: term || "All",
        class: classLabel,
      },
      data: finalData,
    });
  } catch (error) {
    console.error("Error in getting Top Performers:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getDropRatio = async (req, res) => {
  try {
    const { from, to, campusId } = req.query;
    const match = { role: "student" };

    if (req.user.role === "campus-admin") {
      match.createdBy = req.user._id;
    } else if (campusId) {
      const campus = await Campus.findById(campusId);
      if (!campus) return res.status(404).json({ message: "Campus not found" });
      match.createdBy = campus.campusAdmin;
    }

    if (from && to)
      match.createdAt = { $gte: new Date(from), $lte: new Date(to) };

    const totalStudents = await User.countDocuments(match);
    const inactiveStudents = await User.countDocuments({
      ...match,
      isActive: false,
    });

    const dropRatio =
      totalStudents === 0 ? 0 : (inactiveStudents / totalStudents) * 100;

    res.status(200).json({
      data: {
        totalStudents,
        inactiveStudents,
        dropRatio: dropRatio.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCampusComparison = async (req, res) => {
  try {
    const comparison = await Score.aggregate([
      {
        $lookup: {
          from: "campus",
          localField: "campus",
          foreignField: "_id",
          as: "campus",
        },
      },
      { $unwind: "$campus" },
      {
        $group: {
          _id: { campusId: "$campus._id", campusName: "$campus.name" },
          averageResult: { $avg: "$marksObtained" },
          totalExams: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          campusId: "$_id.campusId",
          campusName: "$_id.campusName",
          averageResult: { $round: ["$averageResult", 2] },
        },
      },
      { $sort: { averageResult: -1 } },
    ]);

    res.status(200).json({ data: comparison });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
