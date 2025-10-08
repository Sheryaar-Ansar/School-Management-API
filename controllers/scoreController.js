import Score from '../models/Score.js';
import Campus from '../models/Campus.js';
import TeacherAssignment from '../models/TeacherAssignment.js';
import Assignment from '../models/Assignment.js';

export const addScore = async (req, res) => {
    try {
        const { role, _id: userId } = req.user
        const { studentId, classId, subjectId, campusId, examId, marksObtained, remarks } = req.body
        if (role !== 'campus-admin' && role !== 'teacher' && role !== 'super-admin') {
            return res.status(403).json({ message: "Forbidden: You're not allowed to perform this action" });
        }
        let campusData = {};
        if(role === 'campus-admin'){
            campusData = await Campus.findOne({campusAdmin: userId})
            if(campusData._id.toString() !== campusId){
                return res.status(403).json({ message: "You can only add scores for your own campus" })
            }
        }
        if(role === 'teacher'){
            const teacherAssign = await TeacherAssignment.findOne({ teacher: userId, isActive: true })
            .populate({
                path: 'assignments',
                match: { isActive: true },
                select: 'campus class subject'
            })
            if (!teacherAssign) {
                return res.status(403).json({ message: "You don't have any active assignments" });
            }
            const assigned = teacherAssign.assignments.some((a)=>
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
        res.status(201).json({ message: "Score added successfully", score: newScore
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const getScoresByExam = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
}
