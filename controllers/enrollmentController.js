import StudentEnrollment from '../models/StudentEnrollment.js'
import TeacherAssignment from '../models/TeacherAssignment.js'
import Assignment from '../models/Assignment.js'


export const assignTeacher = async (req, res) => {
    try {
        const { teacherId, campusId, classId, subjectId } = req.body

        const assignment = await Assignment.findOneAndUpdate(
            { campus: campusId, class: classId, subject: subjectId },
            { campus: campusId, class: classId, subject: subjectId },
            { new: true, upsert: true }
        )

        const assignTeacher = await TeacherAssignment.findOneAndUpdate(
            { teacher: teacherId },
            { $addToSet: { assignments: assignment._id } },
            { new: true, upsert: true }
        ).populate('teacher', 'name').populate('assignments')
        res.status(201).json({
            message: `${assignTeacher.teacher.name} assigned to ${assignment.campus.name}`
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const updateTeacher = async (req, res) => {
    try {
        const { teacherId, campusId, classId, subjectId, action } = req.body
        const assignment = await Assignment.findOneAndUpdate(
            { campus: campusId, class: classId, subject: subjectId },
            { campus: campusId, class: classId, subject: subjectId },
            { new: true, upsert: action === 'reassign' }
        )
        if (!assignment && action === 'unassign') return res.status(404).json({ error: 'Assignment of campus, class & subject not found' })

        let updated;
        if (action === 'unassign') {
            updated = await TeacherAssignment.findOneAndUpdate(
                { teacher: teacherId },
                { $pull: { assignments: assignment._id } },
                { new: true }
            )
        } else if (action === 'reassign') {
            updated = await TeacherAssignment.findOneAndUpdate(
                { teacher: teacherId },
                { $addToSet: { assignments: assignment._id } },
                { new: true, upsert: true }
            )
        }
        res.json({
            message: `Teacher ${action} successfully`,
            data: updated
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const deleteTeacher = async (req, res) => {
    try {
        const { teacherId, campusId } = req.body
        const teacherAssign = await TeacherAssignment.findOne({ teacher: teacherId }).populate('assignments')
        if (!teacherAssign) return res.status(404).json({ error: "Teacher not assigned or not found" })
        const campusAssign = teacherAssign.assignments.filter((a) => a.campus.toString() === campusId)
        if (!campusAssign) return res.status(404).json({ error: "No assignment to the teacher is found for the campus" })
        const assignmentIds = campusAssign.map((c) => c._id)

        await Assignment.updateMany(
            { _id: { $in: { assignmentIds } } },
            { $set: { isActive: false } }
        )
        const updatedTeacherAssignment = await TeacherAssignment.findOneAndUpdate(
            { teacher: teacherId },
            { $pull: { assignments: { $in: { assignmentIds } } } },
            { new: true }
        ).populate({
            path: 'assignments',
            match: { isActive: true } // will keep only active assignments i.e campus, class, subjects --
        })
        res.json({
            message: 'Teacher unassigned from the campus',
            data: updatedTeacherAssignment
        })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
} 