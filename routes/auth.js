// server/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/user.js';

const router = express.Router();

// ─── Multer / file upload setup ──────────────────────────────────────────────

// Ruhsat dosyalarının kaydedileceği klasör
const uploadDir = path.join(process.cwd(), 'uploads', 'licenses');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `ruhsat_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Sadece PDF, JPG veya PNG dosyaları yüklenebilir.'));
  }
});

// ─── Kayıt (register) ────────────────────────────────────────────────────────
router.post(
  '/register',
  upload.single('ruhsat'),
  async (req, res, next) => {
    try {
      const {
        email,
        password,
        firmaAdi,
        sehir,
        sirketTuru,
        vergiNo,
        vergiDairesi,
        utsNo
      } = req.body;
      const ruhsatDosya = req.file?.filename;

      // Zorunlu alan kontrolü
      if (!email || !password || !firmaAdi || !sehir || !ruhsatDosya) {
        return res
          .status(400)
          .json({ message: 'Lütfen zorunlu tüm alanları doldurun.' });
      }

      // Aynı email var mı?
      if (await User.exists({ email })) {
        return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
      }

      // Hash + kaydet
      const hashed = await bcrypt.hash(password, 10);
      const newUser = new User({
        email,
        password:   hashed,
        firmaAdi,
        sehir,
        sirketTuru,
        vergiNo,
        vergiDairesi,
        utsNo,
        ruhsatDosya,
        role:       'is_merkezi',
        onayDurumu: 'bekliyor'
      });
      await newUser.save();
      res.status(201).json({ message: 'Kayıt başarılı. Onay bekleniyor.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Giriş (login) ───────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Onay durumu kontrolü
    if (user.onayDurumu !== 'onaylandi') {
      return res.status(403).json({ message: 'Hesabınız onay bekliyor.' });
    }

    // Şifre kontrolü
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Şifre hatalı.' });

    // JWT oluştur
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '2d' }
    );

    // Cevap ver
    res.json({
      token,
      user: {
        id:         user._id,
        email:      user.email,
        role:       user.role,
        firmaAdi:   user.firmaAdi,
        onayDurumu: user.onayDurumu
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─── Admin onay (pending) ────────────────────────────────────────────────────

// Onay bekleyen tüm kullanıcıları getir
router.get('/pending', async (_req, res) => {
  try {
    const users = await User.find({ onayDurumu: 'bekliyor' }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Başvurular alınamadı.' });
  }
});

// Belirli kullanıcıyı onayla (role seçeneği destekli)
router.post('/pending/:id/approve', async (req, res) => {
  const { role } = req.body;
  try {
    const update = { onayDurumu: 'onaylandi' };
    if (role && ['is_merkezi', 'tedarikci'].includes(role)) {
      update.role = role;
    }
    await User.findByIdAndUpdate(req.params.id, update);
    res.json({ success: true, message: 'Kullanıcı onaylandı.' });
  } catch (err) {
    console.error('Onaylama hatası:', err);
    res.status(500).json({ message: 'Onaylama başarısız.' });
  }
});

// Belirli kullanıcıyı reddet
router.post('/pending/:id/reject', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Kullanıcı reddedildi.' });
  } catch (err) {
    console.error('Reddetme hatası:', err);
    res.status(500).json({ message: 'Reddetme başarısız.' });
  }
});

// ─── Yardımcı / debug rotaları ───────────────────────────────────────────────
router.get('/debug/users', async (_req, res) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(3)
    .select('-password');
  res.json(users);
});

// “/me” – token’dan profili getir
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token eksik.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    res.json(user);
  } catch {
    res.status(401).json({ message: 'Geçersiz token.' });
  }
});

export default router;
