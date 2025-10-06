import { createCampus, getAllCampuses, getCampusById, updateCampusDetailsById, deleteCampusById, getCampusDetails } from '../controllers/campusController.js'
import { authenticate, authRole } from '../middlewares/authMiddleware.js'
import express from 'express'
const router = express.Router()

router.post('/', createCampus)
router.get('/', getAllCampuses)
router.get('/details', authenticate, authRole('campus-admin'), getCampusDetails)
router.get('/:id', getCampusById)
router.patch('/:id', updateCampusDetailsById)
router.post('/:id/delete', deleteCampusById)

export default router