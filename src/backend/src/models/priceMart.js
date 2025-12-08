const mongoose = require('mongoose');

// Define the PriceMart schema 
const priceMartSchema = new mongoose.Schema({
  serial_No: {
    type: Number,
    unique: true,
    required: false,
  },

  restaurant_name: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  contact_person: {
    type: String,
    required: true,
  },

  contact_number: {
    type: String,
    required: true,
  },

  // NOW ARRAY
  restaurant_type: [
    {
      type: String,
    }
  ],

  restaurant_type_other: {
    type: String,
  },

  use_online: {
    type: String,
    default: "kirana",
  },

  // NOW ARRAY
  platforms: [
    {
      type: String,
    }
  ],

  platforms_other: {
    type: String,
  },

  purchase_frequency: {
    type: String,
  },

  categories: [
    {
      type: String,
    }
  ],

  categories_other: {
    type: String,
  },

  experience_rating: {
    type: Number,
  },

  factors: [
    {
      type: String,
    }
  ],

  budget: {
    type: String,
  },

  order_advance: {
    type: String,
  },

  delivery_slot: {
    type: String,
  },

  recurring: {
    type: String,
    default: "no",
  },

  tech_comfort: {
    type: Number,
  },

  payment: [
    {
      type: String,
    }
  ],

  improvements: {
    type: String,
  },

  shift_all: {
    type: String,
    default: "no",
  },

  comments: {
    type: String,
  },

  surveyed_by: {
    type: String,
    required: true,
  },

}, { timestamps: true });


// Auto-increment serial_No
priceMartSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastRecord = await this.constructor.findOne().sort({ serial_No: -1 });
    this.serial_No = lastRecord ? lastRecord.serial_No + 1 : 1;
  }
  next();
});

module.exports = mongoose.model('PriceMart', priceMartSchema);
