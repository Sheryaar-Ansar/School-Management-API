import { createCampus, getAllCampuses, getCampusById, updateCampusDetailsById, deleteCampusById } from '../controllers/campusController'
import express from 'express'
const router = express.Router()

router.post('/', createCampus)
router.get('/', getAllCampuses)
router.get('/:id', getCampusById)
router.patch('/:id', updateCampusDetailsById)
router.post('/:id/delete', deleteCampusById)

export default router