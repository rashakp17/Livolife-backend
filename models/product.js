const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

Mongoose.plugin(slug, { separator: '-', lang: 'en', truncate: 120 });

const VariantSchema = new Schema({
  // Optional: the storefront sells items that have no colour choice, and the
  // admin no longer asks for one. Kept so existing products keep their value.
  color: { type: String, trim: true, default: '' },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  images: [{ type: String }],
  // scalable: add sizes/discounts here later
  sizes: [{ size: String, stock: Number }],
  discount: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const ProductSchema = new Schema({
  name: { type: String, trim: true, required: true },
  slug: { type: String, slug: 'name', unique: true },
  description: { type: String, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  // Optional narrowing of `category`. The routes reject a subcategory whose
  // parent is not the product's own category, so the two can never disagree.
  subCategory: { type: Schema.Types.ObjectId, ref: 'SubCategory', default: null },
  brand: { type: Schema.Types.ObjectId, ref: 'Brand', default: null },
  // GST percentage applied on top of the variant price. Prices are stored and
  // displayed tax-exclusive; tax is only added at the cart.
  taxRate: { type: Number, default: 0, min: 0, max: 100 },
  variants: [VariantSchema],
  isActive: { type: Boolean, default: true },
  updated: Date,
  created: { type: Date, default: Date.now }
});

module.exports = Mongoose.model('Product', ProductSchema);
