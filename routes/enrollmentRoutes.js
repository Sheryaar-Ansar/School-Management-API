import { assignTeacher, updateTeacher, deleteTeacher, getTeachers, enrollStudent, updateStudentEnrollment, deleteStudentEnrollment, getStudentEnrollments } from '../controllers/enrollmentController.js'
import express from 'express'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
const router = express.Router()


//----------------------------------------------------------------------
// --- Teacher Assignment Routes -- //
//----------------------------------------------------------------------
router.post('/assign-teacher', authenticate, authRole(['super-admin', 'campus-admin']), assignTeacher)
router.get('/teacher-assignments', authenticate, authRole(['super-admin', 'campus-admin']), getTeachers)
router.patch('/assign-teacher/:id', authenticate, authRole(['super-admin', 'campus-admin']), updateTeacher)
router.post('/assign-teacher/:id/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteTeacher)
//----------------------------------------------------------------------
// --- Student Enrollment Routes -- //
//----------------------------------------------------------------------
router.post('/enroll-student', authenticate, authRole(['super-admin', 'campus-admin']), enrollStudent)
router.get('/student-enrollments', authenticate, authRole(['super-admin', 'campus-admin']), getStudentEnrollments)
router.patch('/enroll-student/:id', authenticate, authRole(['super-admin', 'campus-admin']), updateStudentEnrollment)
router.post('/enroll-student/:id/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteStudentEnrollment)

export default router