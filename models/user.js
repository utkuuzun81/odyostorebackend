// server/models/user.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  firmaAdi:     String,
  sehir:        String,
  sirketTuru:   String,
  vergiNo:      String,
  vergiDairesi: String,
  utsNo:        String,
  ruhsatDosya:  String,
  role: {
    type: String,
    enum: ['is_merkezi', 'tedarikci', 'admin'],
    default: 'is_merkezi'
  },
  onayDurumu: {
    type: String,
    enum: ['bekliyor', 'onaylandi', 'reddedildi'],
    default: 'bekliyor'
  }
}, {
  timestamps: true
});

// Only define the model once; reuse if already compiled
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
