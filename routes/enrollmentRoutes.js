import { assignTeacher, updateTeacher, deleteTeacher, getTeachers, enrollStudent, updateStudentEnrollment, deleteStudentEnrollment, getStudentEnrollments } from '../controllers/enrollmentController.js'
import express from 'express'
const router = express.Router()


//----------------------------------------------------------------------
// --- Teacher Assignment Routes -- //
//----------------------------------------------------------------------
router.post('/assign-teacher', assignTeacher)
router.get('/teacher-assignments', getTeachers)
router.patch('/assign-teacher/:id', updateTeacher)
router.post('/assign-teacher/:id/delete', deleteTeacher)
//----------------------------------------------------------------------
// --- Student Enrollment Routes -- //
//----------------------------------------------------------------------
router.post('/enroll-student', enrollStudent)
router.get('/student-enrollments', getStudentEnrollments)
router.patch('/enroll-student/:id', updateStudentEnrollment)
router.post('/enroll-student/:id/delete', deleteStudentEnrollment)