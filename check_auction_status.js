const mongoose = require('mongoose');
const HourlyAuction = require('./src/backend/src/models/HourlyAuction');
const DailyAuction = require('./src/backend/src/models/DailyAuction');

async function check() {
  try {
    await mongoose.connect('mongodb+srv://dream_60:dream60@dream60.lwgmno8.mongodb.net/dream60_test?retryWrites=true&w=majority&appName=Dream60');
    console.log('Connected to DB');
    
    const liveHourly = await HourlyAuction.findOne({ Status: 'LIVE' });
    console.log('Live Hourly Auction:', liveHourly ? liveHourly.hourlyAuctionCode : 'NONE');
    
    const daily = await DailyAuction.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (daily) {
      console.log('Daily Auction ID:', daily.dailyAuctionId);
      const liveInConfig = daily.dailyAuctionConfig.filter(c => c.Status === 'LIVE');
      console.log('Live in Daily Config:', liveInConfig.map(c => c.TimeSlot));
      
      for (const config of liveInConfig) {
        const hourly = await HourlyAuction.findOne({ hourlyAuctionId: config.hourlyAuctionId });
        console.log(`Hourly Doc for ${config.TimeSlot} (${config.hourlyAuctionId}):`, hourly ? hourly.Status : 'NOT FOUND');
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

check();
