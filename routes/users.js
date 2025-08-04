// server/routes/users.js
import express from 'express';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

// ✅ Bekleyen bayilik başvurularını getir
router.get('/pending', verifyToken, isAdmin, async (req, res) => {
  try {
    const applications = await User.find({ onayDurumu: 'bekliyor' });
    res.json(applications);
  } catch (err) {
    console.error('❌ Başvurular alınamadı:', err);
    res.status(500).json({ error: 'Başvurular alınamadı.' });
  }
});

export default router;
