// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import offerRoutes from './routes/offers.js';
import notificationRoutes from './routes/notifications.js';
import franchiseRoutes from './routes/franchise.js';
import orderRoute from './routes/order.js';

// Model import for seeding
import User from './models/user.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use('/licenses', express.static('uploads/licenses'));

// Helper: Create default admin on startup with fallback credentials
async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@odyostore.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (!existing) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        email:      adminEmail,
        password:   hashed,
        role:       'admin',
        onayDurumu: 'onaylandi',
        firmaAdi:   'Admin'
      });
      await admin.save();
      console.log(`🔐 Default admin created: ${adminEmail} / password: ${adminPassword}`);
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
  }
}

// Start MongoDB (Atlas)
async function startMongo() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI tanımlı değil. Lütfen .env dosyasını kontrol edin.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB Atlas');
    await seedAdmin();
  } catch (err) {
    console.error('❌ MongoDB Atlas bağlantı hatası:', err);
    process.exit(1);
  }
}

startMongo();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/franchise', franchiseRoutes);
app.use('/api/order', orderRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler:', err.stack || err);
  res.status(err.status || 500).json({
    message: err.message || 'Sunucuda beklenmeyen bir hata oluştu.'
  });
});

// Start server
const PORT = process.env.PORT || 4444;
app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
