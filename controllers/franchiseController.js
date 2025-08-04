// controllers/franchiseController.js
import FranchiseApplication from '../models/FranchiseApplication.js';

// Başvuru gönder
export async function submitApplication(req, res) {
  try {
    const { companyName, address, phone } = req.body;
    const userId = req.user.id; // verifyToken middleware ile gelir
    const app = await FranchiseApplication.create({ userId, companyName, address, phone });
    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// Tüm başvuruları listele (admin)
export async function listApplications(req, res) {
  try {
    const apps = await FranchiseApplication.find().populate('userId', 'email firmaAdi');
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Başvuruyu onayla
export async function approveApplication(req, res) {
  try {
    const { id } = req.params;
    const app = await FranchiseApplication.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Başvuruyu reddet
export async function rejectApplication(req, res) {
  try {
    const { id } = req.params;
    const app = await FranchiseApplication.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
