import { createExam, getAllExams, updateExam, deleteExam } from '../controllers/examController.js'
import {authenticate, authRole} from '../middlewares/authMiddleware.js'

import express from 'express'
const router = express.Router()

router.post('/', authenticate, authRole(['super-admin', 'campus-admin']), createExam)
router.get('/', authenticate, authRole(['super-admin', 'campus-admin']), getAllExams)
router.patch('/:examId', authenticate, authRole(['super-admin', 'campus-admin']), updateExam)
router.delete('/:examId/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteExam)

export default router