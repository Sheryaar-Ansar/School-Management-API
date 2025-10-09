import { addScore, getScoresByExam, updateScore, deleteScore } from '../controllers/scoreController.js';

import express from 'express';
const router = express.Router();
import { authenticate, authRole } from '../middlewares/authMiddleware.js'

router.post('/addScore', authenticate, authRole(['teacher', 'campus-admin', 'super-admin']), addScore)
router.get('/examScores', authenticate, authRole(['teacher', 'campus-admin', 'super-admin']), getScoresByExam)
router.patch('/updateScore/:scoreId', authenticate, authRole(['teacher', 'campus-admin', 'super-admin']), updateScore)
router.delete('/deleteScore/:scoreId', authenticate, authRole(['campus-admin', 'super-admin']), deleteScore)

export default router