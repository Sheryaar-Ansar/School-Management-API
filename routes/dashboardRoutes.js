import { getDropRatio } from '../controllers/dashboardController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

router.get('/dropRatio', authenticate, authRole(['campus-admin', 'super-admin']), getDropRatio)

export default router