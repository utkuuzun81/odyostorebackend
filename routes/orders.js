// server/routes/orders.js
import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
  updateShippingInfo,
  cancelOrderAdmin,
  getInvoice
} from '../controllers/orderController.js';

const router = express.Router();

// Admin: Tüm siparişleri getir
router.get('/admin', getAllOrdersAdmin);

// Admin: Tek bir siparişi getir
router.get('/admin/:id', getOrderByIdAdmin);

// Admin: Sipariş durumunu güncelle
router.put('/admin/:id/status', updateOrderStatus);

// Admin: Kargo bilgisi ekle / güncelle
router.put('/admin/:id/shipping', updateShippingInfo);

// Admin: Beklemedeki siparişi iptal et
router.put('/admin/:id/cancel', cancelOrderAdmin);

// Admin: Fatura PDF indir
router.get('/admin/:id/invoice', getInvoice);

// Admin: Gerçek zamanlı güncelleme stream (SSE)
//    Token’ı query’den alıp doğruluyoruz
router.get('/admin/stream', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).end();
  }
  if (decoded.role !== 'admin') return res.status(403).end();

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.write('retry: 10000\n\n');

  const sendUpdate = () => res.write('data: update\n\n');
  const listeners = req.app.locals.orderUpdateListeners ||= [];
  listeners.push(sendUpdate);

  req.on('close', () => {
    req.app.locals.orderUpdateListeners = listeners.filter(fn => fn !== sendUpdate);
  });
});

export default router;
