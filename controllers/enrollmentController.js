import StudentEnrollment from '../models/StudentEnrollment.js'
import TeacherAssignment from '../models/TeacherAssignment.js'
import Assignment from '../models/Assignment.js'
import Campus from '../models/Campus.js'
import User from '../models/User.js'

//----------------------------------------------------------------------
// --- Teacher Assignment Controllers -- // 
//----------------------------------------------------------------------

//any campus-admin can assign other campus teachers (will be fixed soon)
export const assignTeacher = async (req, res) => {
    try {
        const { teacherId, campusId, classId, subjectId } = req.body
        const { role, _id } = req.user

        if (role !== "campus-admin") {
            return res.status(403).json({ error: "Only campus-admins can assign teachers" })
        }

        const campus = await Campus.findOne({ campusAdmin: _id }).select("_id name")
        if (!campus) {
            return res.status(404).json({ error: "No campus assigned to this admin" })
        }

        if (campus._id.toString() !== campusId) {
            return res
                .status(403)
                .json({ error: "You can only assign teachers within your own campus" })
        }

        const teacher = await User.findById(teacherId).select("name role")
        if (!teacher || teacher.role !== "teacher") {
            return res.status(400).json({ error: "Invalid teacher ID" })
        }

        const assignment = await Assignment.findOneAndUpdate(
            { campus: campusId, class: classId, subject: subjectId },
            { campus: campusId, class: classId, subject: subjectId },
            { new: true, upsert: true }
        )

        const assignedTeacher = await TeacherAssignment.findOneAndUpdate(
            { teacher: teacherId },
            { $addToSet: { assignments: assignment._id } },
            { new: true, upsert: true }
        )
            .populate("teacher", "name email")
            .populate({
                path: "assignments",
                populate: [
                    { path: "campus", select: "name" },
                    { path: "class", select: "grade section" },
                    { path: "subject", select: "name" },
                ],
            })

        res.status(201).json({
            message: `${assignedTeacher.teacher.name} assigned successfully to ${campus.name}`,
            data: assignedTeacher,
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
        res.status(500).json({ error: error.message })
    }
}
//any campus-admin can see other campus teachers (will be fixed soon)
// FIXED

export const getTeachers = async (req, res) => {
    try {
        const { role, _id } = req.user;
        const { campusId, isActive, page = 1, limit = 5, sortBy = "createdAt", order = "asc" } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const match = {};

        if (typeof isActive !== "undefined") match.isActive = isActive === "true";

        let teachers = await TeacherAssignment.find(match)
            .populate({
                path: "assignments",
                populate: [
                    { path: "campus", select: "name" },
                    { path: "class", select: "grade section" },
                    { path: "subject", select: "name" },
                ],
            })
            .populate("teacher", "name email role")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ [sortBy]: order === "asc" ? 1 : -1 })

        if (role === "super-admin") {
            if (campusId) {
                teachers = teachers.filter((t) =>
                    t.assignments.some(
                        (a) => a.campus && a.campus._id.toString() === campusId.toString()
                    )
                )
            }
        } else if (role === "campus-admin") {
            const campus = await Campus.findOne({ campusAdmin: _id }).select("_id");
            if (!campus) {
                return res.status(404).json({ error: "No campus assigned to this admin" });
            }

            teachers = teachers.filter((t) =>
                t.assignments.some(
                    (a) => a.campus && a.campus._id.toString() === campus._id.toString()
                )
            )
        } else {
            return res.status(403).json({ error: "Access denied" })
        }

        const totalActiveTeachers = await teachers.length;

        res.json({
            totalActiveTeachers,
            page: parseInt(page),
            limit: parseInt(limit),
            count: teachers.length,
            data: teachers,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message })
    }
}
//----------------------------------------------------------------------
// --- Student Enrollment Controllers -- //
//----------------------------------------------------------------------


export const enrollStudent = async (req, res) => {
    try {
        const { role, _id } = req.user;
        const { studentId, campusId, classId, rollNumber, academicSession } = req.body;

        if (role !== "campus-admin") {
            return res.status(403).json({ error: "Only campus-admins can enroll students" })
        }

        const campus = await Campus.findOne({ campusAdmin: _id }).select("_id name")
        if (!campus) {
            return res.status(404).json({ error: "No campus assigned to this admin" })
        }

        if (campus._id.toString() !== campusId.toString()) {
            return res.status(403).json({
                error: `You can only enroll students in your own campus: ${campus.name}`,
            })
        }

        const existStudent = await StudentEnrollment.findOne({
            student: studentId,
            campus: campusId,
            class: classId,
        })

        if (existStudent) {
            return res.status(400).json({ error: "Student already enrolled in this class" })
        }

        const newEnrollment = await StudentEnrollment.create({
            student: studentId,
            campus: campusId,
            class: classId,
            academicSession,
            rollNumber,
        })

        res.status(201).json({
            message: `Student enrolled successfully in ${campus.name}`,
            data: newEnrollment,
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const updateStudentEnrollment = async (req, res) => {
    try {
        const { role, _id: userId } = req.user
        const studentEnrollmentId = req.params.id
        const { campusId, classId, rollNumber, academicSession } = req.body

        if (!studentEnrollmentId) {
            return res.status(400).json({ error: "Student enrollment ID is required" })
        }

        const enrollment = await StudentEnrollment.findById(studentEnrollmentId)
        if (!enrollment) {
            return res.status(404).json({ error: "Student enrollment not found" })
        }

        if (role === "campus-admin") {
            const campus = await Campus.findOne({ campusAdmin: userId }).select("_id name")
            if (!campus) {
                return res.status(403).json({ error: "No campus assigned to this admin" })
            }

            if (campus._id.toString() !== enrollment.campus.toString()) {
                return res
                    .status(403).json({ error: "You can only update enrollments for your own campus" })
            }
        } else if (role !== "super-admin") {
            return res.status(403).json({ error: "Access denied" })
        }

        const updatedEnrollment = await StudentEnrollment.findByIdAndUpdate(
            studentEnrollmentId,
            { campus: campusId, class: classId, rollNumber, academicSession },
            { new: true, runValidators: true }
        )

        res.json({
            message: "Student enrollment updated successfully",
            data: updatedEnrollment,
        })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

export const deleteStudentEnrollment = async (req, res) => {
    try {
        const { role, _id: userId } = req.user
        const studentEnrollmentId = req.params.id

        if (!studentEnrollmentId) {
            return res.status(400).json({ error: "Student enrollment ID is required" })
        }

        const enrollment = await StudentEnrollment.findById(studentEnrollmentId)
        if (!enrollment) {
            return res.status(404).json({ error: "Student enrollment not found" })
        }

        if (role === "campus-admin") {
            const campus = await Campus.findOne({ campusAdmin: userId }).select("_id name")
            if (!campus) {
                return res.status(403).json({ error: "No campus assigned to this admin" })
            }

            if (campus._id.toString() !== enrollment.campus.toString()) {
                return res
                    .status(403)
                    .json({ error: "You can only delete enrollments for your own campus" })
            }
        } else if (role !== "super-admin") {
            return res.status(403).json({ error: "Access denied" })
        }

        await StudentEnrollment.findByIdAndUpdate(
            studentEnrollmentId,
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
        const { role, _id } = req.user;
        const {
            campusId,
            classId,
            isActive,
            page = 1,
            limit = 5,
            sortBy = "createdAt",
            order = "asc",
        } = req.query

        const skip = (parseInt(page) - 1) * parseInt(limit)
        let filter = {}

        if (role === "super-admin") {
            if (campusId) filter.campus = campusId
        } else if (role === "campus-admin") {
            const campus = await Campus.findOne({ campusAdmin: _id }).select("_id")
            if (!campus) {
                return res
                    .status(404)
                    .json({ error: "No campus assigned to this admin" })
            }
            filter.campus = campus._id
        } else {
            return res
                .status(403)
                .json({ error: "Access denied. Only admins can view enrollments." })
        }

        if (classId) filter.class = classId
        if (typeof isActive !== "undefined") {
            filter.isActive = isActive === "true"
        } else {
            filter.isActive = true 
        }

        const totalEnrollments = await StudentEnrollment.countDocuments(filter)

        const enrollments = await StudentEnrollment.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ [sortBy]: order === "asc" ? 1 : -1 })
            .populate("student", "name email gender")
            .populate("campus", "name")
            .populate("class", "grade section")

        res.json({
            totalEnrollments,
            page: parseInt(page),
            limit: parseInt(limit),
            data: enrollments,
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}