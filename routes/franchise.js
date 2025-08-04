// routes/franchise.js
import express from 'express';
import { submitApplication, listApplications, approveApplication, rejectApplication } from '../controllers/franchiseController.js';
import verifyToken from '../middleware/verifyToken.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

// Bayilik başvurusu (tüm girişli kullanıcılar)
router.post('/apply', verifyToken, submitApplication);

// Başvuruları listele (sadece admin)
router.get('/', verifyToken, isAdmin, listApplications);

// Onayla / reddet (admin)
router.post('/:id/approve', verifyToken, isAdmin, approveApplication);
router.post('/:id/reject', verifyToken, isAdmin, rejectApplication);

export default router;
