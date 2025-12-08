// src/scripts/testMidnightScheduler.js
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * Test the midnight reset and creation workflow
 * This script properly connects to MongoDB first, then runs the scheduler
 */
async function testMidnightScheduler() {
  try {
    console.log('🔧 [TEST] Connecting to MongoDB...');
    console.log('🔧 [TEST] MongoDB URI:', process.env.MONGO_URI?.substring(0, 20) + '...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ [TEST] Connected to MongoDB');
    console.log('');

    // Now require the controller (after connection is established)
    const { midnightResetAndCreate } = require('../controllers/schedulerController');

    console.log('🚀 [TEST] Running midnight reset and creation workflow...\n');
    
    const result = await midnightResetAndCreate();
    
    console.log('\n📊 [TEST] Final Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ [TEST] Midnight scheduler test PASSED!');
      console.log('✅ [TEST] Your scheduler is working correctly and ready for production.');
    } else {
      console.log('\n❌ [TEST] Midnight scheduler test FAILED!');
      console.log('❌ [TEST] Error:', result.message);
    }
    
    await mongoose.connection.close();
    console.log('\n🔌 [TEST] MongoDB connection closed');
    
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ [TEST] Fatal error:', error);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run the test
console.log('🌙 [TEST] ========================================');
console.log('🌙 [TEST] Testing Midnight Scheduler');
console.log('🌙 [TEST] Time:', new Date().toISOString());
console.log('🌙 [TEST] ========================================\n');

testMidnightScheduler();
