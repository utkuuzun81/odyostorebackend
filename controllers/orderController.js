// server/controllers/orderController.js
import Order from '../models/Order.js';
import PDFDocument from 'pdfkit';

// Kullanıcı: Sipariş oluştur
export async function createOrder(req, res) {
  try {
    console.log('📦 Sipariş verisi:', req.body);
    console.log('👤 Kullanıcı:', req.user);
    const { items, shippingAddress, paymentMethod, totalPrice } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sipariş ürünleri eksik.' });
    }
    const order = new Order({
      user: req.user._id,
      items,
      shipping: { address: shippingAddress },
      paymentMethod,
      totalPrice,
      status: 'bekliyor'
    });

    const saved = await order.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('❌ createOrder error:', err);
    return res.status(500).json({ error: 'Sipariş oluşturulamadı.' });
  }
}

// Kullanıcı: Kendi siparişlerini listele
export async function getUserOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    console.error('❌ getUserOrders error:', err);
    return res.status(500).json({ error: 'Siparişler alınamadı.' });
  }
}

// Admin: Tüm siparişleri listele
export async function getAllOrdersAdmin(req, res) {
  try {
    const orders = await Order.find()
      .populate('items.product')
      .populate({
        path: 'user',
        select: 'firmaAdi sehir sirketTuru vergiNo vergiDairesi utsNo'
      });
    return res.json(orders);
  } catch (err) {
    console.error('❌ getAllOrdersAdmin error:', err);
    return res.status(500).json({ error: 'Siparişler alınamadı.' });
  }
}

// Admin: ID ile sipariş getir
export async function getOrderByIdAdmin(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate({
        path: 'user',
        select: 'firmaAdi sehir sirketTuru vergiNo vergiDairesi utsNo'
      });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı.' });
    }
    return res.json(order);
  } catch (err) {
    console.error('❌ getOrderByIdAdmin error:', err);
    return res.status(500).json({ error: 'Sipariş alınamadı.' });
  }
}

// Admin: Sipariş durumunu güncelle
export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['bekliyor', 'onaylandi', 'faturalandi', 'sevkiyatta', 'teslim edildi', 'iptal edildi'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum değeri.' });
    }
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    return res.json(updated);
  } catch (err) {
    console.error('❌ updateOrderStatus error:', err);
    return res.status(500).json({ error: 'Durum güncellenemedi.' });
  }
}

// Admin: Kargo bilgisi ekle/güncelle
export async function updateShippingInfo(req, res) {
  try {
    const { company, trackingNumber } = req.body;
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        shipping: { company, trackingNumber, shippedAt: new Date() }
      },
      { new: true }
    );
    return res.json(updated);
  } catch (err) {
    console.error('❌ updateShippingInfo error:', err);
    return res.status(500).json({ error: 'Kargo bilgisi güncellenemedi.' });
  }
}

// Admin: Siparişi iptal et
export async function cancelOrderAdmin(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı.' });
    }
    if (order.status !== 'bekliyor') {
      return res.status(400).json({ error: 'Sadece beklemedeki siparişler iptal edilebilir.' });
    }
    order.status = 'iptal edildi';
    await order.save();
    return res.json({ message: 'Sipariş iptal edildi.' });
  } catch (err) {
    console.error('❌ cancelOrderAdmin error:', err);
    return res.status(500).json({ error: 'Sipariş iptal edilemedi.' });
  }
}

// Admin: Fatura PDF oluştur
export async function getInvoice(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product')
      .populate({
        path: 'user',
        select: 'firmaAdi sehir sirketTuru vergiNo vergiDairesi utsNo'
      });
    if (!order) {
      return res.status(404).json({ error: 'Sipariş bulunamadı.' });
    }

    const doc = new PDFDocument();
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdf = Buffer.concat(chunks);
      res.status(200)
        .set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Fatura_${order._id}.pdf"`
        })
        .send(pdf);
    });

    doc.fontSize(16).text('FATURA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Sipariş No: ${order._id}`);
    doc.text(`Tarih: ${new Date(order.createdAt).toLocaleString()}`);
    doc.text(`Müşteri: ${order.user?.firmaAdi || 'Bilinmiyor'}`);
    doc.text(`UTS No: ${order.user?.utsNo || '—'}`);
    doc.moveDown();

    doc.text('Ürünler:');
    order.items.forEach((item, i) => {
      doc.text(
        `${i + 1}) ${item.product.name} × ${item.quantity} — ${item.product.price * item.quantity} ₺`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Toplam Tutar: ${order.totalPrice} ₺`);
    doc.end();
  } catch (err) {
    console.error('❌ getInvoice error:', err);
    return res.status(500).json({ error: 'Fatura oluşturulamadı.' });
  }
}
