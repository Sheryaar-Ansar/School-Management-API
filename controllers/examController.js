import Exam from "../models/Exam";
import Campus from "../models/Campus";

export const createExam = async (req,res) => {
    try {
        const { name, term, academicSession, classId, subjectId, campusId, totalMarks, type } = req.body;
        const { role, _id: userId } = req.user;

        if (role !== "campus-admin" && role !== "super-admin") {
            return res.status(403).json({ message: "Only admins can perform this action" });
        }
        let campusData = {};
        if (role === "campus-admin") {
            campusData = await Campus.findById({campusAdmin: userId});
            if(campusData._id.toString() !== campusId){
                return res.status(403).json({ message: "You can only create exams for your own campus" });
            }
        }
        else if(role !== "super-admin"){
            res.status(403).json({ message: "Only admins can perform this action" });
        }
        const newExam = await Exam.create({
            name,
            term,
            academicSession,
            class: classId,
            subject: subjectId,
            campus: campusId,
            totalMarks,
            type
        })
        res.status(201).json({ message: "Exam created successfully", exam: newExam })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export const getAllExams = async (req,res) => {
    try {
        const { role, _id: userId } = req.user;
        const { campusId, page = 1, limit = 5 } = req.query;
        let filter = {};

        if (role === "campus-admin") {
            const campusData = await Campus.findOne({ campusAdmin: userId });
            if (!campusData) {
                return res.status(404).json({ message: "Campus not found for this admin" });
            }
            filter.campus = campusData._id;
        }
        else if (role === "super-admin") {
            if (campusId) {
                filter.campus = campusId;
            }
        }
        const skip = (parseInt(page - 1)) * parseInt(limit)
        const exams = await Exam.find(filter)
            .populate("class", "name")
            .populate("subject", "name")
            .populate("campus", "name")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        const totalExams = await Exam.countDocuments(filter)
        res.json({
            totalExams,
            page: parseInt(page),
            limit: parseInt(limit),
            exams
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export const updateExam = async (req,res) => {
    try {
        const { examId } = req.params
        const { name, term, academicSession, classId, subjectId, campusId, totalMarks, type } = req.body
        const { role, _id: userId } = req.user
        if (role !== "campus-admin" && role !== "super-admin") {
            return res.status(403).json({ message: "Only admins can perform this action" })
        }
        let campusData = {};
        if (role === "campus-admin") {
            campusData = await Campus.findById({campusAdmin: userId})
            if(campusData._id.toString() !== campusId){
                return res.status(403).json({ message: "You can only update exams for your own campus" })
            }
        }
        else if(role !== "super-admin"){
            res.status(403).json({ message: "Only admins can perform this action" })
        }
        const updatedExam = await Exam.findByIdAndUpdate(
            examId,
            {name, term, academicSession, class: classId, subject: subjectId, campus: campusId, totalMarks, type},
            { new: true, runValidators: true }
        )
        res.json({ message: "Exam updated successfully", exam: updatedExam })
    } catch (error) {
        res.status(400).json({error: error.message})
    }
}

export const deleteExam = async (req,res) => {
    try {
        const { examId } = req.params
        const { role, _id: userId } = req.user
        if (role !== "campus-admin" && role !== "super-admin") {
            return res.status(403).json({ message: "Only admins can perform this action" })
        }
        let campusData = {};
        let examData = await Exam.findById(examId);
        if (!examData) {
            return res.status(404).json({ message: "Exam not found" })
        }
        if (role === "campus-admin") {
            campusData = await Campus.findById({campusAdmin: userId})
            if(campusData._id.toString() !== examData.campus.toString()){
                return res.status(403).json({ message: "You can only delete exams for your own campus" })
            }
        }
        else if(role !== "super-admin"){
            res.status(403).json({ message: "Only admins can perform this action" })
        }
        const deletedExam = await Exam.findByIdAndDelete(examId)
        res.json({ message: "Exam deleted successfully", exam: deletedExam })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}