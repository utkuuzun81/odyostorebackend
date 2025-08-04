// controllers/auth.js
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register user
export async function register(req, res) {
  try {
    const { email, password, firmaAdi } = req.body;
    const licenseUrl = req.file?.path || req.body.licenseUrl;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hash,
      firmaAdi,
      role: 'pending',
      licenseUrl
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: 'Kayıt başarılı',
      user: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
        firmaAdi: savedUser.firmaAdi
      }
    });

  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(400).json({ error: err.message });
  }
}

// Login user
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Kullanıcı bulunamadı' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Şifre hatalı' });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firmaAdi: user.firmaAdi
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: err.message });
  }
}
