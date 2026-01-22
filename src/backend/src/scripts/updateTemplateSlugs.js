const mongoose = require('mongoose');
require('dotenv').config();
const EmailTemplate = require('../models/EmailTemplate');
const { connectDB } = require('../config/db');

const TEMPLATE_UPDATES = [
  { template_id: 'd8b8202a-747c-45e2-a24b-ada0c1876bf2', slug: 'otp' },
  { template_id: '7df3280e-8982-4284-80d8-f92713c6a361', slug: 'welcome' },
  { template_id: 'b30cdfbd-a37e-49cc-9155-6456634d2c46', slug: 'winner-rank-1' },
  { template_id: '66dc01a3-9d2f-4cd7-9f9f-3d8685e3d52e', slug: 'waiting-queue' },
  { template_id: '33f8ad7d-0550-480a-aa1b-41bd89cb682d', slug: 'password-changed' },
  { template_id: '3d0f9f1a-596c-4855-a5f6-2992e9eb728a', slug: 'auction-results' },
  { template_id: '2d60f3df-6278-49b1-94e8-e5b67214ce73', slug: 'prize-claim' },
  { template_id: '9acdff1b-81fb-43a8-8c5a-28d015e6bb81', slug: 'support-ticket' },
  { template_id: '3d01e12d-b21d-4b7b-83c5-4295048ec487', slug: 'marketing' }
];

async function updateTemplates() {
  try {
    await connectDB();
    console.log('Connected to database for updates...');

    for (const update of TEMPLATE_UPDATES) {
      const result = await EmailTemplate.findOneAndUpdate(
        { template_id: update.template_id },
        { $set: { slug: update.slug } },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated template: ${update.slug} (${update.template_id})`);
      } else {
        console.warn(`⚠️ Template not found: ${update.slug} (${update.template_id})`);
        
        // Try searching by name if ID fails (for some reason)
        const nameMap = {
          'otp': 'OTP Verification',
          'welcome': 'Welcome Email',
          'winner-rank-1': 'Prize Winner (Rank #1)',
          'waiting-queue': 'Waiting Queue (Rank #2 & #3)',
          'password-changed': 'Password Changed',
          'auction-results': 'Auction Results',
          'prize-claim': 'Prize claim',
          'support-ticket': 'Support Request Received',
          'marketing': 'Dream60 Marketing'
        };

        const byName = await EmailTemplate.findOneAndUpdate(
          { name: nameMap[update.slug] },
          { $set: { slug: update.slug, template_id: update.template_id } },
          { new: true }
        );

        if (byName) {
          console.log(`✅ Updated template by name: ${update.slug} (${byName.name})`);
        } else {
          console.error(`❌ Failed to find template for slug: ${update.slug}`);
        }
      }
    }

    console.log('All updates completed.');
    process.exit(0);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

updateTemplates();
