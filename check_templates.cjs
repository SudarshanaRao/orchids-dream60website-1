const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Define schema directly to avoid import issues
const emailTemplateSchema = new mongoose.Schema({
    template_id: String,
    name: String,
    subject: String,
    body: String,
    category: String,
    isActive: Boolean
});
const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);

async function checkTemplates() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dream60';
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const templates = await EmailTemplate.find({});
    console.log('Available Templates Count:', templates.length);
    
    if (templates.length > 0) {
        console.log('Available Templates:');
        console.table(templates.map(t => ({
          name: t.name,
          category: t.category,
          isActive: t.isActive,
          subject: t.subject.substring(0, 30) + '...'
        })));
    } else {
        console.log('No templates found in the database.');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTemplates();
