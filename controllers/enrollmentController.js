import StudentEnrollment from '../models/StudentEnrollment.js'
import TeacherAssignment from '../models/TeacherAssignment.js'
import Assignment from '../models/Assignment.js'

//----------------------------------------------------------------------
// --- Teacher Assignment Controllers -- // 
//----------------------------------------------------------------------

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
            message: `${assignTeacher.teacher.name} assigned to campus successfully`
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
//any campus-admin can assign other campus teachers (will be fixed soon)
export const getTeachers = async (req, res) => {
    try {
        const { campusId, isActive, page = 1, limit = 5, sortBy = 'name', order = 'asc' } = req.query
        let campusMatch = {}
        if (campusId) campusMatch.campus = campusId
        if (typeof isActive !== "undefined") campusMatch.isActive = isActive === 'true'
        const skip = (parseInt(page) - 1) * parseInt(limit)

        const totalActiveTeachers = await TeacherAssignment.countDocuments({ isActive: true })
        const teachers = await TeacherAssignment.find(campusMatch)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })

        res.json({
            totalActiveTeachers,
            page: parseInt(page),
            limit: parseInt(limit),
            data: teachers
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
//----------------------------------------------------------------------
// --- Student Enrollment Controllers -- //
//----------------------------------------------------------------------

export const enrollStudent = async (req,res) => {
    try {
        const { studentId, campusId, classId, rollNumber, academicSession } = req.body

        const existStudent = await StudentEnrollment.findOne({
            student: studentId,
            campus: campusId,
            class: classId
        })
        if(existStudent) return res.status(400).json({ error: "Student already enrolled in the class" })
        const newEnrollment = await StudentEnrollment.create({
            student: studentId,
            campus: campusId,
            class: classId,
            academicSession: academicSession,
            rollNumber: rollNumber
        })
        res.status(201).json({ message: "Student enrolled successfully", data: newEnrollment })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}
export const updateStudentEnrollment = async (req, res) => {
    try {
        const studentId = req.params.id
        const { campusId, classId, rollNumber, academicSession } = req.body
        const updatedEnrollmentData = { campusId, classId, rollNumber, academicSession }
        if (!studentId) return res.status(400).json({ error: "Student ID is required" })
        const existStudent = await StudentEnrollment.findById(studentId)
        if(!existStudent) return res.status(404).json({ error: "Student enrollment not found" })
        const updatedEnrollment = await StudentEnrollment.findByIdAndUpdate(
            studentId,
            { $set: updatedEnrollmentData },
            { new: true, runValidators: true }
        )
        res.json({ message: "Student enrollment updated", data: updatedEnrollment })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const deleteStudentEnrollment = async (req,res ) => {
    try {
        const studentId = req.params.id
        if(!studentId) return res.status(400).json({ error: "Student ID is required" })
        const existStudent = await StudentEnrollment.findById(studentId)
        if(!existStudent) return res.status(404).json({ error: "Student enrollment not found" })
        await StudentEnrollment.findByIdAndUpdate(
            studentId,
            { isActive: false },
            { new: true }
        )
        res.json({ message: "Student enrollment deleted successfully" })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
export const getStudentEnrollments = async (req, res) => {
    try {
        const { campusId, classId, isActive, page = 1, limit = 5, sortBy = 'createdAt', order = 'asc' } = req.query
        let filter = {}
        if (campusId) filter.campus = campusId
        if (classId) filter.class = classId
        if (typeof isActive !== "undefined") filter.isActive = isActive === 'true'
        const skip = (parseInt(page) - 1) * parseInt(limit)
        const totalEnrollments = await StudentEnrollment.countDocuments(filter)
        const enrollments = await StudentEnrollment.find(filter).skip(skip).limit(parseInt(limit)).sort({ [sortBy]: order === 'asc' ? 1 : -1 }).populate('student', 'name').populate('campus', 'name').populate('class', 'name')
        res.json({
            totalEnrollments,
            page: parseInt(page),
            limit: parseInt(limit),
            data: enrollments
        })
    }
    catch (error) {
        res.status(500).json({ error: error.message })
    }
}