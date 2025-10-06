import Campus from "../models/Campus.js";
import Class from "../models/Class.js";


export const createClass = async (req, res) => {
  try {
    console.log("req.user", req.user);
    
    const { grade, section, subjects, classTeacher, campus } = req.body;
    const newClass = await Class.create({
      grade,
      section,
      campus,
      subjects,
      classTeacher,
      createdBy: req.user._id,
    });
    res.status(201).json({
      message: "Class created successfully",
      class: {
        id: newClass._id,
        grade: newClass.grade,
        section: newClass.section,
        subjects: newClass.subjects,
        classTeacher: newClass.classTeacher,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating class", error: err.message });
  }
};



export const getAllClasses = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { includeInactive } = req.query; // e.g. ?includeInactive=true

    let filter = {};

    if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: _id });
      if (!campus) {
        return res.status(404).json({ error: "No campus assigned to this admin" });
      }

      filter.campus = campus._id;
      filter.isActive = true; // campus-admins see only active
    }

    if (role === "super-admin") {
      if (!includeInactive) {
        filter.isActive = true;
      }
    }

    const classes = await Class.find(filter)
      .populate("campus", "name code isActive")
      .populate("classTeacher", "name email role")
      .populate("subjects", "name code")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      role,
      count: classes.length,
      filtersApplied: filter,
      data: classes,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const singleClass = await Class.findById(req.params.id)
      .populate("subjects")
      .populate("classTeacher", "name email contact");
    if (!singleClass)
      return res.status(404).json({ message: "Class not found" });

    res.json(singleClass);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching classes", error: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClass)
      return res.status(404).json({ message: "Class not found" });
    res.json({
      message: "Class updated successfully",
      class: {
        id: updatedClass._id,
        grade: updatedClass.grade,
        section: updatedClass.section,
        subjects: updatedClass.subjects,
        classTeacher: updatedClass.classTeacher,
      },
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating class", error: err.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id);
    if (!classDoc) return res.status(404).json({ message: "Class not found" });
    await Class.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    res.json({ message: "Class deleted (soft)" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting class", error: err.message });
  }
};
