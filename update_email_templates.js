const mongoose = require('mongoose');
require('dotenv').config();
const EmailTemplate = require('./src/backend/src/models/EmailTemplate');
const { connectDB } = require('./src/backend/src/config/db');

async function updateTemplates() {
  await connectDB();
  
  const winnerTemplate = await EmailTemplate.findOne({ slug: 'winner-rank-1' });
  const claimTemplate = await EmailTemplate.findOne({ slug: 'prize-claim' });
  
  if (winnerTemplate) {
    console.log('--- Current Winner Template ---');
    console.log(winnerTemplate.body);
    
    // Add the required text if not present
    const newText = 'To proceed with claiming your prize, please complete the final bid amount of {{paymentAmount}} as per auction rules.';
    if (!winnerTemplate.body.includes(newText)) {
      // Find a good place to insert. Usually after "Congratulations" or before the button.
      // Let's just append it before the claim link or at the end of a paragraph.
      winnerTemplate.body = winnerTemplate.body.replace(
        '</p>',
        `</p><p>${newText}</p>`
      );
      await winnerTemplate.save();
      console.log('✅ Updated Winner Template');
    }
  }
  
  if (claimTemplate) {
    console.log('--- Current Claim Template ---');
    console.log(claimTemplate.body);
    
    const paidAmountText = 'Paid Amount: ₹{{paymentAmount}}';
    if (!claimTemplate.body.includes(paidAmountText)) {
      // Append after prize amount
      claimTemplate.body = claimTemplate.body.replace(
        'Prize Amount: ₹{{prizeAmount}}',
        `Prize Amount: ₹{{prizeAmount}}<br>Paid Amount: ₹{{paymentAmount}}`
      );
      await claimTemplate.save();
      console.log('✅ Updated Claim Template');
    }
  }
  
  await mongoose.disconnect();
}

updateTemplates().catch(err => {
  console.error(err);
  process.exit(1);
});
