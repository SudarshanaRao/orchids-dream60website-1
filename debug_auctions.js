const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://dream_60:dream60@dream60.lwgmno8.mongodb.net/dream60_test?retryWrites=true&w=majority&appName=Dream60';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const HourlyAuction = mongoose.model('HourlyAuction', new mongoose.Schema({}, { strict: false }));
    const DailyAuction = mongoose.model('DailyAuction', new mongoose.Schema({}, { strict: false }));

    console.log('--- Checking HourlyAuctions with Status: LIVE ---');
    const liveHourly = await HourlyAuction.find({ Status: 'LIVE' }).lean();
    console.log('Live Hourly Auctions Count:', liveHourly.length);
    liveHourly.forEach(a => console.log(` - ID: ${a.hourlyAuctionId}, Code: ${a.hourlyAuctionCode}, Slot: ${a.TimeSlot}, Status: ${a.Status}`));

    console.log('\n--- Checking DailyAuction fallback ---');
    const latestDaily = await DailyAuction.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    if (latestDaily) {
      console.log('Active Daily ID:', latestDaily.dailyAuctionId);
      const liveInConfig = latestDaily.dailyAuctionConfig.filter(c => c.Status === 'LIVE');
      console.log('Live in Config Count:', liveInConfig.length);
      for (const config of liveInConfig) {
        console.log(` - Slot: ${config.TimeSlot}, hourlyAuctionId: ${config.hourlyAuctionId}`);
        const hourly = await HourlyAuction.findOne({ hourlyAuctionId: config.hourlyAuctionId }).lean();
        console.log(`   Hourly Document Found: ${!!hourly}`);
        if (hourly) {
          console.log(`   Hourly Status: ${hourly.Status}, Code: ${hourly.hourlyAuctionCode}`);
        }
      }
    } else {
      console.log('No active DailyAuction found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
