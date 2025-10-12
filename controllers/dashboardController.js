import Campus from "../models/Campus.js";
import Class from "../models/Class.js";
import Score from "../models/Score.js";
import User from "../models/User.js";

export const getOverviewStats = async (req, res) => {
  try {
    const [campusCount, studentCount, teacherCount] = await Promise.all([
      Campus.countDocuments(),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      data: { campusCount, studentCount, teacherCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopPerformers = async (req, res) => {
  try {
    const { campusId } = req.query;
    let campusFilter = {};

    if (req.user.role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: req.user._id });
      if (!campus)
        return res
          .status(404)
          .json({ success: false, message: "Campus not found" });
      campusFilter.campus = campus._id;
    } else if (campusId) {
      campusFilter.campus = new mongoose.Types.ObjectId(campusId);
    }

    const topPerformers = await Score.aggregate([
      { $match: campusFilter },
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
          from: "campuses",
          localField: "campus",
          foreignField: "_id",
          as: "campus",
        },
      },
      { $unwind: "$campus" },
      {
        $group: {
          _id: { campus: "$campus.name", student: "$student.name" },
          avgMarks: { $avg: "$marksObtained" },
        },
      },
      { $sort: { avgMarks: -1 } },
      {
        $group: {
          _id: "$_id.campus",
          topStudents: {
            $push: { name: "$_id.student", avgMarks: "$avgMarks" },
          },
        },
      },
      {
        $project: {
          campus: "$_id",
          topStudents: { $slice: ["$topStudents", 3] },
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ success: true, data: topPerformers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDropRatio = async (req, res) => {
  try {
    const { from, to, campusId } = req.query;
    const match = { role: "student" };

    if (req.user.role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: req.user._id });
      if (!campus)
        return res
          .status(404)
          .json({ success: false, message: "Campus not found" });
      match.campus = campus._id;
      match.createdBy = req.user._id;
    } else if (campusId) {
      const campus = await Campus.findById(campusId);
      if (!campus)
        return res
          .status(404)
          .json({ success: false, message: "Campus not found" });
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
      success: true,
      data: {
        totalStudents,
        inactiveStudents,
        dropRatio: dropRatio.toFixed(2),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
 🏫 4️⃣ CAMPUS COMPARISON (Average results)
-------------------------------------------------- */
export const getCampusComparison = async (req, res) => {
  try {
    const comparison = await Score.aggregate([
      {
        $lookup: {
          from: "campuses",
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
          totalExams: 1,
        },
      },
      { $sort: { averageResult: -1 } },
    ]);

    res.status(200).json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* --------------------------------------------------
 📊 5️⃣ ATTENDANCE & SUBJECT PERFORMANCE TRENDS
-------------------------------------------------- */
export const getAttendanceAndSubjectTrends = async (req, res) => {
  try {
    // Attendance trend per month
    const attendanceTrend = await StudentAttendance.aggregate([
      {
        $group: {
          _id: { $month: "$date" },
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: ["$isPresent", 1, 0] } },
        },
      },
      {
        $project: {
          month: "$_id",
          attendancePercentage: {
            $multiply: [{ $divide: ["$presentDays", "$totalDays"] }, 100],
          },
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    // Subject-wise performance
    const subjectPerformance = await Score.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subject",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: "$subject" },
      {
        $group: {
          _id: "$subject.name",
          avgMarks: { $avg: "$marksObtained" },
        },
      },
      { $sort: { avgMarks: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { attendanceTrend, subjectPerformance },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
