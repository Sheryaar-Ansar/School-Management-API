import Score from '../models/Score.js';
import Campus from '../models/Campus.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import Assignment from '../models/Assignment.js';
import Class from '../models/Class.js';
import express from 'express';

export const addScore = async (req, res) => {
    try {
        const { role, _id: userId } = req.user
        const { studentId, classId, subjectId, campusId, examId, marksObtained, remarks } = req.body
        if (role !== 'campus-admin' && role !== 'teacher' && role !== 'super-admin') {
            return res.status(403).json({ message: "Forbidden: You're not allowed to perform this action" });
        }
        let campusData = {};
        if (role === 'campus-admin') {
            campusData = await Campus.findOne({ campusAdmin: userId })
            if (campusData._id.toString() !== campusId) {
                return res.status(403).json({ message: "You can only add scores for your own campus" })
            }
        }
        if (role === 'teacher') {
            const teacherAssign = await TeacherAssignment.findOne({ teacher: userId, isActive: true })
                .populate({
                    path: 'assignments',
                    match: { isActive: true },
                    select: 'campus class subject'
                })
            if (!teacherAssign) {
                return res.status(403).json({ message: "You don't have any active assignments" });
            }
            const assigned = teacherAssign.assignments.some((a) =>
                a.campus.toString() === campusId &&
                a.class.toString() === classId &&
                a.subject.toString() === subjectId
            )
            if (!assigned) {
                return res.status(403).json({ message: "You can only add scores for your assigned campus, class, and subject" });
            }
        }

        const existingScore = await Score.findOne({ student: studentId, exam: examId, subject: subjectId, campus: campusId, class: classId })
        if (existingScore) {
            return res.status(400).json({ message: "Score for this student in this exam already exists." });
        }
        const newScore = await Score.create({
            student: studentId,
            class: classId,
            subject: subjectId,
            campus: campusId,
            exam: examId,
            marksObtained,
            remarks,
            enteredBy: userId
        })
        res.status(201).json({
            message: "Score added successfully", score: newScore
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const getScoresByExam = async (req, res) => {
    try {
        const { role, _id: userId } = req.user
        const { page = 1, limit = 5 } = req.query
        let filter = {}
        if (role !== 'campus-admin' && role !== 'teacher' && role !== 'super-admin') {
            return res.status(403).json({ message: "Forbidden: You're not allowed to view the scores" });
        }
        if (role === 'campus-admin') {
            const campusData = await Campus.findOne({ campusAdmin: userId })
            if (!campusData) {
                return res.status(403).json({ message: "You dont have any campus assigned" })
            }
            filter.campus = campusData._id
        }
        else if (role === 'teacher') {

            const classTeacher = await Class.findOne({ classTeacher: userId, isActive: true })
            if (classTeacher) {
                filter.class = classTeacher._id
            }
            else {
                const teacherAssign = await TeacherAssignment.findOne({ teacher: userId, isActive: true })
                    .populate({
                        path: 'assignments',
                        match: { isActive: true },
                        select: 'campus class subject'
                    })
                if (!teacherAssign) {
                    return res.status(403).json({ message: "You dont have any active assignments" })
                }

                filter.$or = teacherAssign.assignments.map((a) => ({
                    campus: a.campus.toString(),
                    class: a.class.toString(),
                    subject: a.subject.toString()
                }))
            }
        }
        else if (role === 'super-admin') {

        }
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const TotalScores = await Score.countDocuments(filter)
        const scores = await Score.find(filter)
            .populate('student', 'name rollNumber')
            .populate('class', 'grade section')
            .populate('subject', 'name')
            .populate('exam', 'term type totalMarks')
            .populate('campus', 'name location')
            .populate('enteredBy', 'name role')
            .skip(skip)
            .limit(limit)
            .sort({ marksObtained: -1 })

        res.json({
            totalScores: TotalScores,
            page: parseInt(page),
            limit: parseInt(limit),
            scores
        })
    }
    catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const updateScore = async (req, res) => {
    try {
        const { scoreId } = req.params
        const { role, _id: userId } = req.user
        const { marksObtained, remarks } = req.body
        if (role !== 'campus-admin' && role !== 'teacher' && role !== 'super-admin') {
            return res.status(403).json({ message: "Forbidden: You're not allowed to perform this action" });
        }
        const score = await Score.findById(scoreId)
        if (!score) {
            return res.status(404).json({ message: "Score not found" })
        }
        if (role === 'campus-admin') {
            const campusData = await Campus.findOne({ campusAdmin: userId })
            if (!campusData) {
                return res.status(403).json({ message: "You dont have any campus assigned" })
            }
            if (campusData._id.toString() !== score.campus.toString()) {
                return res.status(403).json({ message: "You can only update scores for your own campus" })
            }
        }
        else if (role === 'teacher') {
            const teacherAssign = await TeacherAssignment.findOne({ teacher: userId, isActive: true })
                .populate({
                    path: 'assignments',
                    match: { isActive: true },
                    select: 'campus class subject'
                })
            if (!teacherAssign) {
                return res.status(403).json({ message: "You don't have any active assignments" });
            }
            const assigned = teacherAssign.assignments.some((a) =>
                a.campus.toString() === score.campus.toString() &&
                a.class.toString() === score.class.toString() &&
                a.subject.toString() === score.subject.toString()
            )
            if (!assigned) {
                return res.status(403).json({ message: "You can only update scores for your assigned campus, class, and subject" });
            }
        } 
        const updatedScore = await Score.findByIdAndUpdate(
            scoreId,
            { marksObtained, remarks },
            { new: true, runValidators: true }
        )
        res.json({ message: "Score updated successfully", score: updatedScore })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const deleteScore = async (req, res) => {
    try {
        const { scoreId } = req.params
        const { role, _id: userId } = req.user
        if (role !== 'campus-admin' && role !== 'super-admin'){
            return res.status(403).json({ message: "Forbidden: You're not allowed to perform this action" });
        }
        const score = await Score.findById(scoreId)
        if (!score) {
            return res.status(404).json({ message: "Score not found" })
        }
        if(role === 'super-admin'){

        }else if (role === 'campus-admin'){
            const campusData = await Campus.findOne({campusAdmin: userId})
            if(!campusData){
                return res.status(403).json({ message: "You dont have any campus assigned" })
            }
            if(campusData._id.toString() !== score.campus.toString()){
                return res.status(403).json({ message: "You can only delete scores for your own campus" })
            }
        }
        await Score.findByIdAndDelete(scoreId)
        res.json({ message: "Score deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

