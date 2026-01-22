const mongoose = require('mongoose');
require('dotenv').config();
const EmailTemplate = require('./src/backend/src/models/EmailTemplate');

async function checkTemplates() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dream60';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const templates = await EmailTemplate.find({}, { name: 1, category: 1, isActive: 1 });
    console.log('Available Templates:');
    console.table(templates.map(t => ({
      name: t.name,
      category: t.category,
      isActive: t.isActive
    })));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTemplates();
