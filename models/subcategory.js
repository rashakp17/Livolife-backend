const Mongoose = require('mongoose');
const slug = require('mongoose-slug-generator');
const { Schema } = Mongoose;

const options = {
  separator: '-',
  lang: 'en',
  truncate: 120
};

Mongoose.plugin(slug, options);

const SubCategorySchema = new Schema({
  _id: {
    type: Schema.ObjectId,
    auto: true
  },
  name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  // Parent category. Required in practice — the routes reject a subcategory
  // without one, since an orphaned subcategory can never be reached from the store.
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // Cloudinary secure_url. Stored as a URL, never as binary — same reason as
  // Category: image bytes in the document bloat every response that populates it.
  image: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('SubCategory', SubCategorySchema);
