import TeacherAttendance from "../models/TeacherAttendance.js";

export const markTeacherAttendance = async (req, res) => {
  try {
    const { teacher, status } = req.body;

    const today = new Date();
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0) {
      return res.status(400).json({ error: "Attendance cannot be marked on Sundays" });
    }

    const teacherId =
      req.user && req.user.role === "teacher" ? req.user.id : teacher;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const existing = await TeacherAttendance.findOne({ teacher: teacherId, date: startOfDay });
    if (existing) {
      return res.status(400).json({ error: "Already checked in today" });
    }

    const attendance = await TeacherAttendance.create({
      teacher: teacherId,
      status,
      campus: req.user?.campus || req.body.campus,
      date: startOfDay,
      checkIn: new Date(), 
      markedBy: req.user._id,
    });

    res.status(201).json({ message: "Check-in successful!", id: attendance._id, attendance });
  } catch (err) {
    res.status(400).json({
      message: "Error marking teacher attendance",
      error: err.message,
    });
  }
};

export const teacherCheckOut = async (req, res) => {
  try {
    const teacherId =
      req.user && req.user.role === "teacher" ? req.user.id : req.body.teacher;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID is required" });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const attendance = await TeacherAttendance.findOne({
      teacher: teacherId,
      date: startOfDay,
    });

    if (!attendance) {
      return res.status(404).json({ error: "No check-in found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: "Already checked out today" });
    }

    attendance.checkOut = new Date(); // stores full date+time
    await attendance.save();

    res.json({ message: "Check-out successful!", attendance });
  } catch (err) {
    res.status(500).json({
      message: "Error marking check-out",
      error: err.message,
    });
  }
};


export const getTeacherAttendance = async (req, res) => {
  try {
    const query = {};
    if (req.user?.campus) query.campus = req.user.campus;

    const records = await TeacherAttendance.find(query)
      .populate("teacher", "name email")
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching teacher attendance",
      error: err.message,
    });
  }
};

export const updateTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await TeacherAttendance.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Teacher attendance updated!", updated });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating attendance", error: err.message });
  }
};

export const deleteTeacherAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TeacherAttendance.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Teacher attendance deleted!" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting attendance", error: err.message });
  }
};
