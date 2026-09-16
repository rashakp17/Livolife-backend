const express = require('express');
const router = express.Router();

// Bring in Models & Utils
const SubCategory = require('../../models/subcategory');
const Category = require('../../models/category');
const Product = require('../../models/product');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const store = require('../../utils/store');
const { ROLES } = require('../../constants');
const { uploadImage } = require('../../utils/uploadImage');

router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { name, description, category, products, isActive, image } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'You must enter a name.' });
    }

    if (!category) {
      return res.status(400).json({ error: 'You must select a category.' });
    }

    // Reject an unknown parent up front: Mongo would happily store the ObjectId
    // and the subcategory would then be invisible everywhere it is looked up by category.
    const parent = await Category.findOne({ _id: category });

    if (!parent) {
      return res.status(400).json({ error: 'No Category found.' });
    }

    // Base64 from the admin becomes a Cloudinary URL before it ever reaches Mongo.
    const imageUrl = await uploadImage(image, 'subcategories');

    const subCategory = new SubCategory({
      name,
      description,
      category,
      products,
      isActive,
      image: imageUrl
    });

    const data = await subCategory.save();

    res.status(200).json({
      success: true,
      message: `Subcategory has been added successfully!`,
      subCategory: data
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch store subcategories api
router.get('/list', async (req, res) => {
  try {
    const subCategories = await SubCategory.find({ isActive: true }).populate(
      'category',
      'name slug'
    );

    res.status(200).json({
      subCategories
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch subcategories api
router.get('/', async (req, res) => {
  try {
    const subCategories = await SubCategory.find({}).populate(
      'category',
      'name slug'
    );

    res.status(200).json({
      subCategories
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch the subcategories of one category api.
// Declared before '/:id' so "category" is not swallowed as an id.
router.get('/category/:categoryId', async (req, res) => {
  try {
    const subCategories = await SubCategory.find({
      category: req.params.categoryId
    }).populate('category', 'name slug');

    res.status(200).json({
      subCategories
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

// fetch subcategory api
router.get('/:id', async (req, res) => {
  try {
    const subCategoryId = req.params.id;

    const subCategoryDoc = await SubCategory.findOne({ _id: subCategoryId })
      .populate('category', 'name slug')
      .populate({
        path: 'products',
        select: 'name'
      });

    if (!subCategoryDoc) {
      return res.status(404).json({
        message: 'No Subcategory found.'
      });
    }

    res.status(200).json({
      subCategory: subCategoryDoc
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const subCategoryId = req.params.id;
    const update = req.body.subCategory;
    const query = { _id: subCategoryId };
    const { slug, category } = req.body.subCategory;

    const foundSubCategory = await SubCategory.findOne({
      $or: [{ slug }]
    });

    if (foundSubCategory && foundSubCategory._id != subCategoryId) {
      return res.status(400).json({ error: 'Slug is already in use.' });
    }

    // Moving a subcategory under another category still has to land on a real one.
    if (category) {
      const parent = await Category.findOne({ _id: category });

      if (!parent) {
        return res.status(400).json({ error: 'No Category found.' });
      }
    }

    // Only touch the image when one was sent, so an edit that omits it keeps
    // the existing picture instead of clearing it.
    if (update && typeof update.image !== 'undefined') {
      update.image = await uploadImage(update.image, 'subcategories');
    }

    const updated = await SubCategory.findOneAndUpdate(query, update, {
      new: true
    }).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Subcategory has been updated successfully!',
      subCategory: updated
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.put('/:id/active', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const subCategoryId = req.params.id;
    const update = req.body.subCategory;
    const query = { _id: subCategoryId };

    // disable subcategory(subCategoryId) products
    if (!update.isActive) {
      const subCategoryDoc = await SubCategory.findOne(
        { _id: subCategoryId, isActive: true },
        'products -_id'
      ).populate('products');

      if (subCategoryDoc) {
        store.disableProducts(subCategoryDoc.products);
      }
    }

    await SubCategory.findOneAndUpdate(query, update, {
      new: true
    });

    res.status(200).json({
      success: true,
      message: 'Subcategory has been updated successfully!'
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.'
    });
  }
});

router.delete(
  '/delete/:id',
  auth,
  role.check(ROLES.Admin),
  async (req, res) => {
    try {
      const subCategory = await SubCategory.deleteOne({ _id: req.params.id });

      // Untag the products that pointed here, so they stay in their category
      // rather than filtering under a subcategory that no longer exists.
      await Product.updateMany(
        { subCategory: req.params.id },
        { $set: { subCategory: null } }
      );

      res.status(200).json({
        success: true,
        message: `Subcategory has been deleted successfully!`,
        subCategory
      });
    } catch (error) {
      res.status(400).json({
        error: 'Your request could not be processed. Please try again.'
      });
    }
  }
);

module.exports = router;
