// controllers/userController.js
import User from '../models/user.js';

// Bekleyen kullanıcı kayıtlarını listele (role === 'pending')
export async function listPendingUsers(req, res) {
  try {
    const users = await User.find({ role: 'pending' })
      .select('firmaAdi email licenseUrl createdAt')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Kullanıcıya rol ata (supplier veya center)
export async function assignRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['supplier', 'center'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol.' });
    }
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('firmaAdi email role licenseUrl');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
