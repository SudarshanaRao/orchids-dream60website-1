const PriceMart = require('../models/priceMart');
const { parse } = require('json2csv');

// helper to normalize incoming fields to arrays 
const toArray = (v) => {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v;
  // if string and comma separated, split; otherwise wrap
  if (typeof v === 'string') {
    // allow both comma-separated and single-value strings
    return v.includes(',') ? v.split(',').map(s => s.trim()).filter(Boolean) : [v.trim()];
  }
  return [v];
};

// Controller to handle POST request for form submission
const submitForm = async (req, res) => {
  try {
    // normalize arrays
    const restaurant_type = toArray(req.body.restaurant_type);
    const platforms = toArray(req.body.platforms);
    const categories = toArray(req.body.categories);
    const factors = toArray(req.body.factors);
    const payment = toArray(req.body.payment);

    // Create a new form submission document
    const priceMart = new PriceMart({
      restaurant_name: req.body.restaurant_name || '',
      location: req.body.location || '',
      contact_person: req.body.contact_person || '',
      contact_number: req.body.contact_number || '',
      restaurant_type,
      restaurant_type_other: req.body.restaurant_type_other || '',
      use_online: req.body.use_online || 'kirana',
      platforms,
      platforms_other: req.body.platforms_other || '',
      purchase_frequency: req.body.purchase_frequency || '',
      categories,
      categories_other: req.body.categories_other || '',
      experience_rating: req.body.experience_rating !== undefined ? req.body.experience_rating : null,
      factors,
      budget: req.body.budget || '',
      order_advance: req.body.order_advance || '',
      delivery_slot: req.body.delivery_slot || '',
      recurring: req.body.recurring || 'no',
      tech_comfort: req.body.tech_comfort !== undefined ? req.body.tech_comfort : null,
      payment,
      improvements: req.body.improvements || '',
      shift_all: req.body.shift_all || 'no',
      comments: req.body.comments || '',
      surveyed_by: req.body.surveyed_by || '',
    });

    // Save the form data to the database
    await priceMart.save();

    // Send response back to client
    res.status(201).json({
      success: true,
      message: 'Form submitted successfully!',
      data: priceMart,
    });
  } catch (err) {
    console.error('submitForm error:', err);
    res.status(500).json({
      success: false,
      message: 'Error in submitting form.',
      error: err.message,
    });
  }
};

// Controller to get form submission count
const getFormCount = async (req, res) => {
  try {
    // Count all form submissions in the database
    const formCount = await PriceMart.countDocuments();

    // Send count as response
    res.status(200).json({
      success: true,
      message: 'Form submission count retrieved successfully.',
      formCount,
    });
  } catch (err) {
    console.error('getFormCount error:', err);
    res.status(500).json({
      success: false,
      message: 'Error retrieving form submission count.',
      error: err.message,
    });
  }
};

// Controller to get all form submissions and download as CSV
const getAllFormsCSV = async (req, res) => {
  try {
    // Fetch all form submissions from the database as plain objects
    const priceMarts = await PriceMart.find().sort({ serial_No: 1 }).lean();

    // map documents to flat objects and join arrays for CSV readability
    const mapped = priceMarts.map((p) => ({
      serial_No: p.serial_No,
      restaurant_name: p.restaurant_name || '',
      location: p.location || '',
      contact_person: p.contact_person || '',
      contact_number: p.contact_number || '',
      restaurant_type: Array.isArray(p.restaurant_type) ? p.restaurant_type.join(', ') : (p.restaurant_type || ''),
      restaurant_type_other: p.restaurant_type_other || '',
      use_online: p.use_online || '',
      platforms: Array.isArray(p.platforms) ? p.platforms.join(', ') : (p.platforms || ''),
      platforms_other: p.platforms_other || '',
      purchase_frequency: p.purchase_frequency || '',
      categories: Array.isArray(p.categories) ? p.categories.join(', ') : (p.categories || ''),
      categories_other: p.categories_other || '',
      experience_rating: p.experience_rating != null ? p.experience_rating : '',
      factors: Array.isArray(p.factors) ? p.factors.join(', ') : (p.factors || ''),
      budget: p.budget || '',
      order_advance: p.order_advance || '',
      delivery_slot: p.delivery_slot || '',
      recurring: p.recurring || '',
      tech_comfort: p.tech_comfort != null ? p.tech_comfort : '',
      payment: Array.isArray(p.payment) ? p.payment.join(', ') : (p.payment || ''),
      improvements: p.improvements || '',
      shift_all: p.shift_all || '',
      comments: p.comments || '',
      surveyed_by: p.surveyed_by || '',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
      _id: p._id ? String(p._id) : '',
    }));

    // define CSV fields (order)
    const fields = [
      'serial_No',
      '_id',
      'restaurant_name',
      'location',
      'contact_person',
      'contact_number',
      'restaurant_type',
      'restaurant_type_other',
      'use_online',
      'platforms',
      'platforms_other',
      'purchase_frequency',
      'categories',
      'categories_other',
      'experience_rating',
      'factors',
      'budget',
      'order_advance',
      'delivery_slot',
      'recurring',
      'tech_comfort',
      'payment',
      'improvements',
      'shift_all',
      'comments',
      'surveyed_by',
      'createdAt',
      'updatedAt',
    ];

    const csv = parse(mapped, { fields });

    // Set the response headers to indicate a file download
    res.header('Content-Type', 'text/csv');
    res.attachment('priceMart_form_data.csv');
    res.send(csv);
  } catch (err) {
    console.error('getAllFormsCSV error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating CSV.',
      error: err.message,
    });
  }
};

module.exports = {
  submitForm,
  getFormCount,
  getAllFormsCSV,
};
