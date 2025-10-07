import { createExam, getAllExams, updateExam, deleteExam } from '../controllers/examController.js'
import {authenticate, authRole} from '../middleware/authMiddleware.js'

import express from 'express'
import { authRole } from '../middlewares/authMiddleware.js'
const router = express.Router()

router.post('/', authenticate, authRole(['super-admin', 'campus-admin']), createExam)
router.get('/', authenticate, authRole(['super-admin', 'campus-admin']), getAllExams)
router.patch('/:examId', authenticate, authRole(['super-admin', 'campus-admin']), updateExam)
router.post('/:examId/delete', authenticate, authRole(['super-admin', 'campus-admin']), deleteExam)

export default router