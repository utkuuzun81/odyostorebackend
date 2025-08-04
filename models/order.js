// models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  shipping: {
    address: String,
    company: String,
    trackingNumber: String,
    shippedAt: Date
  },
  paymentMethod: {
    type: String,
    enum: ['kredi kartı', 'havale', 'kapıda ödeme'],
    default: 'kredi kartı'
  },
  status: {
    type: String,
    enum: ['bekliyor', 'onaylandi', 'faturalandi', 'sevkiyatta', 'teslim edildi', 'iptal edildi'],
    default: 'bekliyor'
  },
  totalPrice: { type: Number, required: true }
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', orderSchema);
