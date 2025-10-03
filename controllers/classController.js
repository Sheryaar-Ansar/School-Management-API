import Class from "../models/Class.js";

export const createClass = async (req, res) => {
  try {
    const { grade, section, subjects, classTeacher } = req.body;
    const newClass = await Class.create({
      grade,
      section,
      campus: req.user.campus,
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

export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find({
      campus: req.user.campus,
      isActive: true,
    })
      .populate("subjects")
      .populate("classTeacher", "name email contact");
    res.json(classes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching classes", error: err.message });
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
