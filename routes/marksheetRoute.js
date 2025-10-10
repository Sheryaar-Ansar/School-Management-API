import { getStudentMarksheet } from '../controllers/marksheetController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()


router.get('/marksheet', authenticate, authRole(['campus-admin', 'teacher', 'student', 'super-admin']), getStudentMarksheet)

export default router