// src/models/Product.js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: String,
  rating: { type: Number, min: 0, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  brand:         { type: String, default: '' },
  category:      { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true },
  oldPrice:      { type: Number },
  stock:         { type: Number, default: 0 },
  variants:      { type: [String], default: [] },
  specs:         { type: [String], default: [] },
  images:        { type: [String], default: [] },
  sold:          { type: Number, default: 0 },
  campaign:      { type: Boolean, default: false },
  reviews:       { type: [reviewSchema], default: [] },
  createdAt:     { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sanal alan: reviewCount ve averageRating
productSchema.virtual('reviewCount').get(function() {
  return this.reviews.length;
});
productSchema.virtual('averageRating').get(function() {
  if (!this.reviews.length) return 0;
  return this.reviews.reduce((sum, r) => sum + r.rating, 0) / this.reviews.length;
});

export default mongoose.model('Product', productSchema);
