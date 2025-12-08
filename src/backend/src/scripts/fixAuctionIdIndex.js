// src/scripts/fixAuctionIdIndex.js
const mongoose = require('mongoose');
const DailyAuction = require('../models/DailyAuction');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Fix auctionId index issue
 * 1. Drop the problematic unique index on auctionId
 * 2. Clean up existing null/undefined auctionId values
 * 3. Ensure all configs have valid UUIDs
 */
async function fixAuctionIdIndex() {
  try {
    console.log('🔧 [FIX] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ [FIX] Connected to MongoDB');

    // Step 1: Check and drop problematic index
    console.log('\n🔍 [FIX] Step 1: Checking for auctionId index...');
    const indexes = await DailyAuction.collection.getIndexes();
    console.log('📋 [FIX] Existing indexes:', Object.keys(indexes));

    if (indexes.auctionId_1) {
      console.log('🗑️ [FIX] Dropping problematic auctionId_1 index...');
      await DailyAuction.collection.dropIndex('auctionId_1');
      console.log('✅ [FIX] Index dropped successfully');
    } else {
      console.log('✅ [FIX] No auctionId_1 index found (already clean)');
    }

    // Step 2: Find all daily auctions with null/undefined auctionId in configs
    console.log('\n🔍 [FIX] Step 2: Finding daily auctions with null auctionId...');
    const allDailyAuctions = await DailyAuction.find({});
    console.log(`📊 [FIX] Found ${allDailyAuctions.length} daily auctions`);

    let updatedCount = 0;
    let configsFixed = 0;

    for (const dailyAuction of allDailyAuctions) {
      let needsUpdate = false;

      for (let i = 0; i < dailyAuction.dailyAuctionConfig.length; i++) {
        const config = dailyAuction.dailyAuctionConfig[i];
        
        // Check if auctionId is null, undefined, or invalid
        if (!config.auctionId || config.auctionId === 'null' || config.auctionId === 'undefined') {
          console.log(`  🔧 [FIX] Fixing null auctionId in ${dailyAuction.dailyAuctionCode} - Config #${i + 1}`);
          dailyAuction.dailyAuctionConfig[i].auctionId = uuidv4();
          needsUpdate = true;
          configsFixed++;
        }
      }

      if (needsUpdate) {
        dailyAuction.markModified('dailyAuctionConfig');
        await dailyAuction.save();
        updatedCount++;
        console.log(`  ✅ [FIX] Updated ${dailyAuction.dailyAuctionCode}`);
      }
    }

    console.log('\n📊 [FIX] Summary:');
    console.log(`  - Daily auctions checked: ${allDailyAuctions.length}`);
    console.log(`  - Daily auctions updated: ${updatedCount}`);
    console.log(`  - Configs fixed: ${configsFixed}`);

    // Step 3: Verify no null values remain
    console.log('\n🔍 [FIX] Step 3: Verifying cleanup...');
    const dailyAuctionsWithNulls = await DailyAuction.find({
      'dailyAuctionConfig.auctionId': null
    });

    if (dailyAuctionsWithNulls.length > 0) {
      console.warn(`⚠️ [FIX] Warning: ${dailyAuctionsWithNulls.length} daily auctions still have null auctionId values`);
    } else {
      console.log('✅ [FIX] All auctionId values are now valid UUIDs');
    }

    console.log('\n🎉 [FIX] Database cleanup completed successfully!');
    console.log('✅ [FIX] You can now run the midnight scheduler without errors');

    process.exit(0);
  } catch (error) {
    console.error('❌ [FIX] Error fixing auctionId index:', error);
    process.exit(1);
  }
}

// Run the fix
console.log('🚀 [FIX] Starting auctionId index fix...\n');
fixAuctionIdIndex();
