// src/controllers/productController.js
const Product = require('../models/Product');
const User = require('../models/user');

/**
 * Validate admin user
 */
const validateAdmin = async (userId) => {
  const user = await User.findOne({ user_id: userId });
  if (!user || (user.userType !== 'ADMIN' && user.isSuperAdmin !== true)) {
    return false;
  }
  return true;
};

/**
 * Get all products with search
 */
exports.getProducts = async (req, res) => {
  try {
    const { user_id, search, page = 1, limit = 20 } = req.query;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const query = { isActive: true };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(query)
      .sort({ usageCount: -1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    return res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

/**
 * Search products for autocomplete
 */
exports.searchProducts = async (req, res) => {
  try {
    const { user_id, q, limit = 10 } = req.query;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const products = await Product.searchByName(q, parseInt(limit));

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({ success: false, message: 'Failed to search products' });
  }
};

/**
 * Create a new product
 */
exports.createProduct = async (req, res) => {
  try {
    const { user_id } = req.query;
    const { name, prizeValue, imageUrl, productDescription, entryFeeType, minEntryFee, maxEntryFee, feeSplits, roundCount } = req.body;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!name || !prizeValue) {
      return res.status(400).json({ success: false, message: 'Name and prizeValue are required' });
    }

    const nameKey = String(name).trim().toLowerCase();
    const existing = await Product.findOne({ nameKey });

    if (existing) {
      existing.name = name;
      existing.prizeValue = prizeValue;
      existing.imageUrl = imageUrl;
      existing.productDescription = productDescription || {};
      existing.entryFeeType = entryFeeType || existing.entryFeeType;
      existing.minEntryFee = minEntryFee ?? existing.minEntryFee;
      existing.maxEntryFee = maxEntryFee ?? existing.maxEntryFee;
      existing.feeSplits = feeSplits || existing.feeSplits;
      existing.roundCount = roundCount || existing.roundCount;
      existing.isActive = true;
      await existing.save();

      return res.json({
        success: true,
        message: 'Product updated successfully',
        data: existing,
      });
    }

    const product = new Product({
      name,
      prizeValue,
      imageUrl,
      productDescription,
      entryFeeType,
      minEntryFee,
      maxEntryFee,
      feeSplits,
      roundCount,
      createdBy: user_id,
    });

    await product.save();

    return res.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

/**
 * Update a product
 */
exports.updateProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { user_id } = req.query;
    const updates = req.body;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (updates.name) {
      const nameKey = String(updates.name).trim().toLowerCase();
      const existing = await Product.findOne({ nameKey });
      if (existing && existing.product_id !== product_id) {
        return res.status(400).json({ success: false, message: 'Product name already exists' });
      }
    }

    const product = await Product.findOneAndUpdate(
      { product_id },
      { ...updates },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

/**
 * Delete a product (soft delete)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { user_id } = req.query;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const product = await Product.findOneAndUpdate(
      { product_id },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};

/**
 * Increment product usage count
 */
exports.incrementUsage = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { user_id } = req.query;

    if (!user_id || !(await validateAdmin(user_id))) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const product = await Product.incrementUsage(product_id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({
      success: true,
      message: 'Usage incremented',
      data: product,
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return res.status(500).json({ success: false, message: 'Failed to increment usage' });
  }
};
