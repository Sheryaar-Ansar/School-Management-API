import StudentAttendance from "../models/StudentAttendance.js";
import StudentEnrollment from "../models/StudentEnrollment.js";

export const markBulkStudentAttendance = async (req, res) => {
  try {
    const { classId, records } = req.body; //  records = [{ rollNo: "101", status: "present" }, ...]

    if (!classId || !records || !records.length) {
      return res
        .status(400)
        .json({ message: "Class ID and records are required" });
    }

    if (req.user.role !== "teacher" && req.user.role !== "campus-admin") {
      return res
        .status(403)
        .json({ message: "You are not authorized to mark student attendance" });
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) {
      return res
        .status(400)
        .json({ error: "Attendance cannot be marked on Sundays" });
    }

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceResults = [];

    for (let rec of records) {
      const { rollNo, status } = rec;

      const student = await StudentEnrollment.findOne({
        rollNo,
        class: classId,
      });

      if (!student) {
        attendanceResults.push({
          rollNo,
          message: "Student not found",
        });
        continue;
      }

      const alreadyMarked = await StudentAttendance.findOne({
        student: student._id,
        class: classId,
        date: { $gte: today, $lt: tomorrow },
      });

      if (alreadyMarked) {
        attendanceResults.push({ rollNo, status, message: "Already marked" });
        continue;
      }

      const attendance = await StudentAttendance.create({
        enrollment: student._id,
        status,
        class: classId,
        campus: req.user.campus,
        markedBy: req.user.role,
      });

      attendanceResults.push({
        rollNo,
        status,
        message: "Marked",
        id: attendance._id,
      });
    }

    res.status(201).json({
      message: "Bulk student attendance processed",
      results: attendanceResults,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error marking bulk attendance",
      error: err.message,
    });
  }
};

export const getAllStudentsAttendance = async (req, res) => {
  try {
    const records = await StudentAttendance.aggregate([
      { $match: { campus: req.user.campus } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          students: { $push: { status: "$status", enrollment: "$enrollment" } },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // const records = await StudentAttendance.find({
    //   campus: req.user.campus,
    // })
    //   .populate({
    //     path: "enrollment",
    //     populate: [
    //       { path: "student", select: "name email" },
    //       { path: "class", select: "name" },
    //     ],
    //   })
    //   .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching student attendance",
      error: err.message,
    });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params; 
    const { date } = req.query;       

    const filter = { student: studentId };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      filter.date = { $gte: dayStart, $lte: dayEnd };
    }

    const records = await StudentAttendance.find(filter)
      .populate({ path: "student", select: "name email" })
      .populate({ path: "class", select: "name" })
      .sort({ date: -1 });

    if (!records.length) {
      return res.status(404).json({
        message: "No attendance records found",
      });
    }

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching student attendance",
      error: err.message,
    });
  }
};

export const updateStudentAttendance = async (req, res) => {
  try {
    
    const updated = await StudentAttendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Student attendance updated!", record: updated });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating attendance", error: err.message });
  }
};

export const deleteStudentAttendance = async (req, res) => {
  try {
    const deleted = await StudentAttendance.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Student attendance deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting attendance", error: err.message });
  }
};
