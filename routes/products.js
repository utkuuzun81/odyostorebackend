// src/routes/products.js
import express from 'express';
import Product from '../models/product.js';
import Cart from '../models/cart.js';

const router = express.Router();

/**
 * GET /api/products
 * - filter: popular,new,campaign
 * - category: kategoriye göre filtre
 * - search: isim içinde geçen metne göre
 * - sort: 'priceAsc','priceDesc','rating'
 */
router.get('/', async (req, res) => {
  const { filter, category, search, sort } = req.query;
  try {
    let qry = {};
    if (category) qry.category = category;
    if (search) qry.name = new RegExp(search, 'i');

    let dbq = Product.find(qry);

    // filtre
    if (filter === 'popular')   dbq = dbq.sort({ sold: -1 });
    if (filter === 'new')       dbq = dbq.sort({ createdAt: -1 });
    if (filter === 'campaign')  dbq = dbq.where('campaign').equals(true);

    // sıralama
    if (sort === 'priceAsc')    dbq = dbq.sort({ price: 1 });
    if (sort === 'priceDesc')   dbq = dbq.sort({ price: -1 });
    if (sort === 'rating')      dbq = dbq.sort({ 'reviews.length': -1 });

    const products = await dbq.exec();
    return res.json(products);
  } catch (err) {
    console.error('❌ Ürünler alınamadı:', err);
    return res.status(500).json({ error: 'Ürünler alınamadı.' });
  }
});

/**
 * GET /api/products/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Ürün bulunamadı.' });
    return res.json(prod);
  } catch (err) {
    console.error('❌ Tek ürün çekilemedi:', err);
    return res.status(400).json({ error: 'Geçersiz ürün ID.' });
  }
});

/**
 * POST /api/products
 */
router.post('/', async (req, res) => {
  try {
    const newP = new Product(req.body);
    const saved = await newP.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('❌ Ürün oluşturulamadı:', err);
    return res.status(500).json({ error: 'Ürün kaydedilemedi.' });
  }
});

/**
 * PUT /api/products/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Ürün bulunamadı.' });
    return res.json(updated);
  } catch (err) {
    console.error('❌ Ürün güncellenemedi:', err);
    return res.status(400).json({ error: 'Ürün güncellenirken hata.' });
  }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ürün bulunamadı.' });
    return res.json({ success: true, message: 'Ürün silindi.' });
  } catch (err) {
    console.error('❌ Ürün silinemedi:', err);
    return res.status(400).json({ error: 'Ürün silinirken hata.' });
  }
});

/**
 * POST /api/products/add-to-cart
 */
router.post('/add-to-cart', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });
    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) existing.quantity += quantity;
    else cart.items.push({ product: productId, quantity });
    await cart.save();
    return res.json({ success: true, message: 'Ürün sepete eklendi.', cart });
  } catch (err) {
    console.error('❌ Sepete eklenemedi:', err);
    return res.status(500).json({ error: 'Sepete eklenemedi.' });
  }
});

export default router;
