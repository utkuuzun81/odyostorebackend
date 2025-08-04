// server/routes/order.js
import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import {
  createOrder,
  getUserOrders
} from '../controllers/orderController.js';

const router = express.Router();

// Kullanıcı siparişi oluşturur
router.post('/', verifyToken, createOrder);

// Kullanıcı kendi siparişlerini listeler
router.get('/', verifyToken, getUserOrders);

export default router;
