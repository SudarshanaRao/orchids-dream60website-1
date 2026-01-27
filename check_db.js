const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://dream_60:dream60@dream60.lwgmno8.mongodb.net/dream60_test?retryWrites=true&w=majority&appName=Dream60';

async function check() {
  await mongoose.connect(MONGO_URI);
  const HourlyAuction = mongoose.model('HourlyAuction', new mongoose.Schema({ 
    Status: String, 
    TimeSlot: String, 
    auctionDate: Date, 
    hourlyAuctionCode: String 
  }));
  
  const auctions = await HourlyAuction.find({ 
    hourlyAuctionCode: { $in: ['HA000836', 'HA000837', 'HA000838', 'HA000839', 'HA000840', 'HA000841'] }
  }).sort({ TimeSlot: 1 });
  
  console.log('Auctions found:', auctions.length);
  auctions.forEach(a => {
    console.log(`Code: ${a.hourlyAuctionCode}, Slot: ${a.TimeSlot}, Status: ${a.Status}, Date: ${a.auctionDate.toISOString()}`);
  });

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const todayIST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  console.log('Today IST Start:', todayIST.toISOString());
  
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
