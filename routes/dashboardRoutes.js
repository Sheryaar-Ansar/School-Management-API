import { getDropRatio, getOverviewStats, getTopPerformers } from '../controllers/dashboardController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

router.get('/super-admin/getOverview', authenticate, authRole(['super-admin']), getOverviewStats)
router.get('/getTopPerformers', authenticate, authRole(['super-admin']), getTopPerformers)
router.get('/getDropRatio', authenticate, authRole(['campus-admin', 'super-admin']), getDropRatio)

export default router