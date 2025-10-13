import { getCampusComparison, getDropRatio, getOverviewStats, getTopPerformers } from '../controllers/dashboardController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

// For Super Admin Only
router.get('/super-admin/getCampusComparison', authenticate, authRole([ 'super-admin']), getCampusComparison)

// For Super Admin + Campus Admin Only
router.get('/getOverview', authenticate, authRole(['campus-admin', 'super-admin']), getOverviewStats)
router.get('/getTopPerformers', authenticate, authRole(['campus-admin','super-admin']), getTopPerformers)
router.get('/getDropRatio', authenticate, authRole(['campus-admin', 'super-admin']), getDropRatio)

export default router