// routes/notifications.js
import express from 'express';
const router = express.Router();

// Bildirimleri getir (genel sistem bildirimleri)
router.get('/', (req, res) => {
  res.json([
    { id: 1, title: 'Yeni ürünler eklendi!', date: '2025-07-29' },
    { id: 2, title: 'Teklif modülü güncellendi', date: '2025-07-28' }
  ]);
});

export default router;