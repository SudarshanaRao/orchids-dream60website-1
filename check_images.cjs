const mongoose = require('mongoose');
require('dotenv').config();
const EmailTemplate = require('./src/backend/src/models/EmailTemplate');

async function checkImageUrls() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dream60';
    console.log(`Connecting to ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const templates = await EmailTemplate.find({ isActive: true });
    
    if (templates.length === 0) {
      console.log('No active templates found.');
    }

    templates.forEach(t => {
      const insecureLinks = t.body.match(/http:\/\/[^"'\s]+/g);
      if (insecureLinks) {
        console.log(`⚠️ Template "${t.name}" has insecure links:`);
        console.table(insecureLinks);
      }
      
      const images = t.body.match(/<img[^>]+src="([^">]+)"/g);
      if (images) {
        console.log(`🖼️ Template "${t.name}" has ${images.length} images.`);
        images.forEach(img => {
            const src = img.match(/src="([^"]+)"/)[1];
            if (!src.startsWith('https://')) {
                console.log(`   - ❌ Insecure image src: ${src}`);
            }
        });
      }
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkImageUrls();
