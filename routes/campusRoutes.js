import { createCampus, getAllCampuses, getCampusById, updateCampusDetailsById, deleteCampusById, getCampusDetails } from '../controllers/campusController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

router.post('/', authenticate, authRole(['super-admin']), createCampus)
router.get('/', authenticate, authRole(['super-admin']), getAllCampuses)
router.get('/details', authenticate, authRole(['campus-admin', 'super-admin']), getCampusDetails)
router.get('/:id', authenticate, authRole(['super-admin']), getCampusById)
router.patch('/:id', authenticate, authRole(['super-admin']), updateCampusDetailsById)
router.post('/:id/delete', authenticate, authRole(['super-admin']), deleteCampusById)

export default router