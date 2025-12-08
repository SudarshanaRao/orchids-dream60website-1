// src/controllers/schedulerController.js
const { v4: uuidv4 } = require('uuid');
const MasterAuction = require('../models/masterAuction');
const DailyAuction = require('../models/DailyAuction');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');

/**
 * ✅ Helper function to get current IST time
 * Returns a Date object representing the current time in IST timezone
 * Stores IST time components as UTC so they appear correct in database
 */
const getISTTime = () => {
  // Get current time
  const now = new Date();
  
  // IST is UTC+5:30 (5 hours and 30 minutes ahead)
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  // Get IST timestamp
  const istTimestamp = now.getTime() + istOffset;
  const istDate = new Date(istTimestamp);
  
  // Extract IST components as UTC
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const seconds = istDate.getUTCSeconds();
  const milliseconds = istDate.getUTCMilliseconds();
  
  // Create a new date with IST components as UTC (so it appears as IST in database)
  const result = new Date(Date.UTC(year, month, day, hours, minutes, seconds, milliseconds));
  
  console.log(`🕐 [IST-TIME] Current IST: ${hours}:${minutes}:${seconds}, Stored as UTC: ${result.toISOString()}`);
  
  return result;
};

/**
 * ✅ Helper function to create IST date from components
 * @param {Number} year - Full year (e.g., 2024)
 * @param {Number} month - Month (0-11, where 0 = January)
 * @param {Number} day - Day of month (1-31)
 * @param {Number} hours - Hours (0-23)
 * @param {Number} minutes - Minutes (0-59)
 * @returns {Date} - Date object with IST components stored as UTC
 */
const createISTDate = (year, month, day, hours, minutes) => {
  // Create a Date using Date.UTC which stores IST components as if they were UTC
  // This way the database will show IST times directly
  const result = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  console.log(`🕐 [CREATE-IST] IST Input: ${year}-${month+1}-${day} ${hours}:${minutes}, Stored as: ${result.toISOString()}`);
  
  return result;
};

/**
 * Helper function to parse TimeSlot "HH:MM" and create Date objects for round times in IST
 * @param {Date} auctionDate - The auction date (start of day)
 * @param {String} timeSlot - Time slot in "HH:MM" format (e.g., "11:00")
 * @param {Array} roundConfig - Array of round configurations with duration
 * @returns {Array} - Array of { roundNumber, startedAt, completedAt } in IST
 */
const calculateRoundTimes = (auctionDate, timeSlot, roundConfig) => {
  try {
    // Parse TimeSlot "HH:MM"
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // ✅ Get auction date components (from the auction date which is already in IST)
    const year = auctionDate.getUTCFullYear();
    const month = auctionDate.getUTCMonth();
    const day = auctionDate.getUTCDate();
    
    // ✅ Create the start time in IST using our helper function
    const baseDate = createISTDate(year, month, day, hours, minutes);
    
    const roundTimes = [];
    let currentStartTime = baseDate;
    
    for (let i = 0; i < roundConfig.length; i++) {
      const round = roundConfig[i];
      const duration = round.duration || 15; // default 15 minutes
      
      const startedAt = new Date(currentStartTime);
      const completedAt = new Date(currentStartTime.getTime() + duration * 60 * 1000);
      
      roundTimes.push({
        roundNumber: round.round,
        startedAt,
        completedAt,
        status: 'PENDING',
        totalParticipants: 0,
        playersData: [],
        qualifiedPlayers: [],
      });
      
      // Move to next round start time
      currentStartTime = completedAt;
    }
    
    console.log(`     ⏰ [ROUND-TIMES] Calculated IST times for TimeSlot ${timeSlot}:`);
    roundTimes.forEach(rt => {
      console.log(`        Round ${rt.roundNumber}: ${rt.startedAt.toISOString()} - ${rt.completedAt.toISOString()} (stored as UTC, represents IST)`);
    });
    
    return roundTimes;
  } catch (error) {
    console.error(`     ❌ [ROUND-TIMES] Error calculating round times:`, error);
    return [];
  }
};

/**
 * Sync hourly auction status back to daily auction config
 * Updates the corresponding slot in dailyAuctionConfig when hourly auction status changes
 * ✅ NOW ALSO SYNCS WINNERS when auction is completed 
 */
const syncHourlyStatusToDailyConfig = async (hourlyAuctionId, newStatus) => {
  try {
    // Find the hourly auction
    const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId });
    if (!hourlyAuction) {
      console.log(`⚠️ [SYNC] Hourly auction ${hourlyAuctionId} not found`);
      return { success: false, message: 'Hourly auction not found' };
    }

    // Find the corresponding daily auction
    const dailyAuction = await DailyAuction.findOne({ 
      dailyAuctionId: hourlyAuction.dailyAuctionId 
    });
    
    if (!dailyAuction) {
      console.log(`⚠️ [SYNC] Daily auction ${hourlyAuction.dailyAuctionId} not found`);
      return { success: false, message: 'Daily auction not found' };
    }

    // Find the matching config entry by TimeSlot
    const configIndex = dailyAuction.dailyAuctionConfig.findIndex(
      config => config.TimeSlot === hourlyAuction.TimeSlot && 
                config.auctionNumber === hourlyAuction.auctionNumber
    );

    if (configIndex === -1) {
      console.log(`⚠️ [SYNC] Config entry not found for TimeSlot ${hourlyAuction.TimeSlot}`);
      return { success: false, message: 'Config entry not found' };
    }

    // Update the status in dailyAuctionConfig
    const oldStatus = dailyAuction.dailyAuctionConfig[configIndex].Status;
    dailyAuction.dailyAuctionConfig[configIndex].Status = newStatus;

    // If completed, update completion tracking AND winners
    if (newStatus === 'COMPLETED') {
      dailyAuction.dailyAuctionConfig[configIndex].isAuctionCompleted = true;
      dailyAuction.dailyAuctionConfig[configIndex].completedAt = new Date();
      
      // ✅ NEW: Sync winners from hourly auction to daily auction config
      if (hourlyAuction.winners && hourlyAuction.winners.length > 0) {
        dailyAuction.dailyAuctionConfig[configIndex].topWinners = hourlyAuction.winners.map(winner => ({
          rank: winner.rank,
          playerId: winner.playerId,
          playerUsername: winner.playerUsername,
          finalAuctionAmount: winner.finalAuctionAmount,
          totalAmountPaid: winner.totalAmountPaid,
          prizeAmount: winner.prizeAmount,
          isPrizeClaimed: winner.isPrizeClaimed || false,
          prizeClaimedAt: winner.prizeClaimedAt || null
        }));
        
        console.log(`     🏆 [SYNC-WINNERS] Synced ${hourlyAuction.winners.length} winners to daily auction config for ${hourlyAuction.TimeSlot}`);
        console.log(`     🏆 [SYNC-WINNERS] Winners: ${hourlyAuction.winners.map(w => `${w.rank}. ${w.playerUsername}`).join(', ')}`);
      } else {
        console.log(`     ⚠️ [SYNC-WINNERS] No winners found in hourly auction ${hourlyAuctionId}`);
        dailyAuction.dailyAuctionConfig[configIndex].topWinners = [];
      }
      
      // Mark the array as modified for Mongoose
      dailyAuction.markModified('dailyAuctionConfig');
      
      // Update completed count
      const completedCount = dailyAuction.dailyAuctionConfig.filter(
        c => c.Status === 'COMPLETED'
      ).length;
      dailyAuction.completedAuctionsCount = completedCount;
      
      // Check if all auctions completed
      if (completedCount === dailyAuction.dailyAuctionConfig.length) {
        dailyAuction.isAllAuctionsCompleted = true;
        dailyAuction.Status = 'COMPLETED';
      }
    }

    await dailyAuction.save();

    console.log(`✅ [SYNC] Updated dailyAuctionConfig: ${hourlyAuction.TimeSlot} slot ${oldStatus} -> ${newStatus}`);
    
    return { 
      success: true, 
      message: 'Status synced to daily auction config',
      oldStatus,
      newStatus,
      winnersSynced: newStatus === 'COMPLETED' && hourlyAuction.winners ? hourlyAuction.winners.length : 0
    };
  } catch (error) {
    console.error('❌ [SYNC] Error syncing status:', error);
    return { 
      success: false, 
      message: 'Error syncing status',
      error: error.message 
    };
  }
};

/**
 * Reset all daily and hourly auctions by setting isActive to false
 * This runs at 00:00 AM (midnight) before creating new auctions
 */
const resetDailyAuctions = async () => {
  try {
    console.log('🔄 [RESET] Starting daily auction reset at', new Date().toISOString());
    
    // Update all daily auctions - set isActive to false
    const dailyResult = await DailyAuction.updateMany(
      { isActive: true },
      { 
        $set: { 
          isActive: false,
          Status: 'COMPLETED'
        } 
      }
    );
    
    console.log(`✅ [RESET] Updated ${dailyResult.modifiedCount} daily auctions (isActive: false)`);
    
    // Update all hourly auctions - set isActive to false (if you have this field)
    const hourlyResult = await HourlyAuction.updateMany(
      { Status: { $in: ['LIVE', 'UPCOMING'] } },
      { 
        $set: { 
          Status: 'COMPLETED',
          completedAt: new Date()
        } 
      }
    );
    
    console.log(`✅ [RESET] Updated ${hourlyResult.modifiedCount} hourly auctions (Status: COMPLETED)`);
    
    return {
      success: true,
      message: 'All daily and hourly auctions reset successfully',
      dailyAuctionsUpdated: dailyResult.modifiedCount,
      hourlyAuctionsUpdated: hourlyResult.modifiedCount,
    };
  } catch (error) {
    console.error('❌ [RESET] Error resetting auctions:', error);
    return {
      success: false,
      message: 'Error resetting daily auctions',
      error: error.message,
    };
  }
};

/**
 * Create daily auction from active master auction for TODAY
 * This runs automatically at 12:00 AM (midnight) every day AFTER resetting old auctions
 * Creates 1 DailyAuction for TODAY with all statuses set to UPCOMING
 */
const createDailyAuction = async () => {
  try {
    console.log('🕐 [SCHEDULER] Starting daily auction creation at', new Date().toISOString());
    
    // Find the active master auction
    const activeMasterAuction = await MasterAuction.findOne({ isActive: true });
    
    if (!activeMasterAuction) {
      console.log('⚠️ [SCHEDULER] No active master auction found. Skipping daily auction creation.');
      return {
        success: false,
        message: 'No active master auction found',
      };
    }
    
    console.log(`✅ [SCHEDULER] Found active master auction: ${activeMasterAuction.master_id}`);
    
    // Get TODAY's date (current day, start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`📅 [SCHEDULER] Creating daily auction for TODAY: ${today.toDateString()}`);
    
    // ✅ CRITICAL FIX: Delete existing daily auctions for today (including inactive ones)
    // This prevents compound unique index violations on { masterId, auctionDate }
    const deleteResult = await DailyAuction.deleteMany({
      masterId: activeMasterAuction.master_id,
      auctionDate: today,
    });
    
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️ [SCHEDULER] Deleted ${deleteResult.deletedCount} existing daily auction(s) for today`);
      
      // Also delete associated hourly auctions
      const hourlyDeleteResult = await HourlyAuction.deleteMany({
        masterId: activeMasterAuction.master_id,
        auctionDate: today,
      });
      console.log(`🗑️ [SCHEDULER] Deleted ${hourlyDeleteResult.deletedCount} associated hourly auctions`);
    }
    
    // ✅ Generate NEW unique auctionId for each config to avoid duplicate key errors
    const dailyAuctionConfigForToday = activeMasterAuction.dailyAuctionConfig.map(config => {
      const configObj = config.toObject ? config.toObject() : { ...config };
      return {
        ...configObj,
        auctionId: uuidv4(), // ✅ Generate NEW UUID for each config entry
        Status: 'UPCOMING', // Force all to UPCOMING
        isAuctionCompleted: false,
        completedAt: null,
        topWinners: [],
        hourlyAuctionId: null,
      };
    });
    
    // Create daily auction as complete replica of master auction for TODAY
    const dailyAuctionData = {
      masterId: activeMasterAuction.master_id,
      dailyAuctionId: uuidv4(), 
      auctionDate: today, // TODAY's date
      createdBy: activeMasterAuction.createdBy,
      isActive: true,
      totalAuctionsPerDay: activeMasterAuction.totalAuctionsPerDay,
      dailyAuctionConfig: dailyAuctionConfigForToday,
      Status: 'ACTIVE',
      isAllAuctionsCompleted: false,
      completedAuctionsCount: 0,
      totalParticipantsToday: 0,
      totalRevenueToday: 0,
    };
    
    const dailyAuction = await DailyAuction.create(dailyAuctionData);
    
    console.log(`✅ [SCHEDULER] Daily auction created for TODAY: ${dailyAuction.dailyAuctionId}`);
    console.log(`📊 [SCHEDULER] Total auctions to create: ${dailyAuction.dailyAuctionConfig.length}`);
    
    // Now create hourly auctions from the daily auction config (all UPCOMING)
    const hourlyAuctionResult = await createHourlyAuctions(dailyAuction);
    
    console.log(`🎉 [SCHEDULER] Daily auction creation completed for TODAY (${today.toDateString()}).`);
    
    return {
      success: true,
      message: `Daily auction and hourly auctions created successfully for today (${today.toDateString()})`,
      dailyAuction: dailyAuction,
      hourlyAuctions: hourlyAuctionResult,
      date: today.toISOString(),
      deletedOldAuctions: deleteResult.deletedCount,
    };
  } catch (error) {
    console.error('❌ [SCHEDULER] Error in createDailyAuction:', error);
    return {
      success: false,
      message: 'Error creating daily auction',
      error: error.message,
    };
  }
};

/**
 * Create hourly auctions from daily auction config (all set to UPCOMING)
 * Creates individual HourlyAuction documents for each config in DailyAuction
 * Also updates the dailyAuctionConfig with hourlyAuctionId references
 * ✅ NOW pre-calculates round startedAt and completedAt times based on TimeSlot
 * ✅ USES UPSERT to handle duplicate keys gracefully (update if exists, create if not)
 */
const createHourlyAuctions = async (dailyAuction) => {
  try {
    console.log(`🕐 [SCHEDULER] Creating hourly auctions for daily auction: ${dailyAuction.dailyAuctionId}`);
    
    const configs = dailyAuction.dailyAuctionConfig || [];
    
    if (configs.length === 0) {
      console.log('⚠️ [SCHEDULER] No auction configs found in daily auction.');
      return {
        success: false,
        message: 'No auction configurations found',
        created: 0,
      };
    }
    
    const createdAuctions = [];
    const updatedAuctions = [];
    const errors = [];
    
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      try {
        // ✅ Calculate pre-scheduled round times based on TimeSlot
        const roundTimes = calculateRoundTimes(
          dailyAuction.auctionDate,
          config.TimeSlot,
          config.roundConfig || []
        );
        
        // Prepare hourly auction data (all UPCOMING)
        const hourlyAuctionData = {
          dailyAuctionId: dailyAuction.dailyAuctionId,
          masterId: dailyAuction.masterId,
          auctionDate: dailyAuction.auctionDate,
          auctionNumber: config.auctionNumber,
          auctionId: config.auctionId,
          TimeSlot: config.TimeSlot,
          auctionName: config.auctionName,
          prizeValue: config.prizeValue,
          Status: 'UPCOMING', // Force UPCOMING for next day
          maxDiscount: config.maxDiscount || 0,
          EntryFee: config.EntryFee,
          minEntryFee: config.minEntryFee,
          maxEntryFee: config.maxEntryFee,
          FeeSplits: config.FeeSplits,
          roundCount: config.roundCount || 4,
          roundConfig: config.roundConfig || [],
          imageUrl: config.imageUrl || null,
          rounds: roundTimes, // ✅ Use pre-calculated round times
        };
        
        // ✅ CRITICAL FIX: Use findOneAndUpdate with upsert to handle duplicates
        // This will update if exists, create if not - no duplicate key errors
        const hourlyAuction = await HourlyAuction.findOneAndUpdate(
          { 
            dailyAuctionId: dailyAuction.dailyAuctionId,
            TimeSlot: config.TimeSlot 
          },
          { $set: hourlyAuctionData },
          { 
            upsert: true,  // Create if doesn't exist
            new: true,     // Return updated document
            setDefaultsOnInsert: true  // Apply schema defaults on insert
          }
        );
        
        // Check if this was an update or insert
        const isNew = !createdAuctions.some(a => a.hourlyAuctionId === hourlyAuction.hourlyAuctionId) &&
                      !updatedAuctions.some(a => a.hourlyAuctionId === hourlyAuction.hourlyAuctionId);
        
        if (isNew) {
          createdAuctions.push(hourlyAuction);
          console.log(`  ✅ Created hourly auction (UPCOMING): ${hourlyAuction.auctionName} at ${hourlyAuction.TimeSlot} (${hourlyAuction.hourlyAuctionCode})`);
        } else {
          updatedAuctions.push(hourlyAuction);
          console.log(`  🔄 Updated existing hourly auction: ${hourlyAuction.auctionName} at ${hourlyAuction.TimeSlot} (${hourlyAuction.hourlyAuctionCode})`);
        }
        
        // Update the dailyAuctionConfig with the hourlyAuctionId
        dailyAuction.dailyAuctionConfig[i].hourlyAuctionId = hourlyAuction.hourlyAuctionId;
        
      } catch (error) {
        console.error(`  ❌ Error creating/updating hourly auction for ${config.auctionName}:`, error.message);
        errors.push({
          auctionName: config.auctionName,
          error: error.message,
        });
      }
    }
    
    // Save the updated dailyAuction with hourlyAuctionId references
    await dailyAuction.save();
    
    console.log(`🎉 [SCHEDULER] Hourly auction creation completed. Created: ${createdAuctions.length}, Updated: ${updatedAuctions.length}, Errors: ${errors.length}`);
    
    return {
      success: true,
      message: 'Hourly auctions created/updated successfully (all UPCOMING with pre-calculated round times)',
      created: createdAuctions.length,
      updated: updatedAuctions.length,
      errors: errors.length > 0 ? errors : undefined,
      auctions: [...createdAuctions, ...updatedAuctions],
    };
  } catch (error) {
    console.error('❌ [SCHEDULER] Error in createHourlyAuctions:', error);
    return {
      success: false,
      message: 'Error creating hourly auctions',
      error: error.message,
    };
  }
};

/**
 * Complete midnight reset and creation workflow
 * This is the main function called by the cron job at 00:00 AM
 * 1. Resets all old daily and hourly auctions (isActive: false)
 * 2. Creates new daily auction for TODAY
 * 3. Creates hourly auctions for TODAY
 */
const midnightResetAndCreate = async () => {
  try {
    console.log('🌙 [MIDNIGHT] ========================================');
    console.log('🌙 [MIDNIGHT] Starting midnight reset and creation workflow');
    console.log('🌙 [MIDNIGHT] Time:', new Date().toISOString());
    console.log('🌙 [MIDNIGHT] ========================================');
    
    // Step 1: Reset all old auctions (set isActive to false)
    console.log('🌙 [MIDNIGHT] Step 1: Resetting old auctions...');
    const resetResult = await resetDailyAuctions();
    
    if (!resetResult.success) {
      console.error('❌ [MIDNIGHT] Reset failed:', resetResult.message);
      return {
        success: false,
        message: 'Midnight workflow failed at reset step',
        resetResult,
      };
    }
    
    console.log('✅ [MIDNIGHT] Step 1 completed: Old auctions reset');
    
    // Step 2: Create new daily auction for TODAY
    console.log('🌙 [MIDNIGHT] Step 2: Creating new daily auction for TODAY...');
    const createResult = await createDailyAuction();
    
    if (!createResult.success) {
      console.error('❌ [MIDNIGHT] Creation failed:', createResult.message);
      return {
        success: false,
        message: 'Midnight workflow failed at creation step',
        resetResult,
        createResult,
      };
    }
    
    console.log('✅ [MIDNIGHT] Step 2 completed: New auctions created for TODAY');
    
    console.log('🌙 [MIDNIGHT] ========================================');
    console.log('🌙 [MIDNIGHT] Midnight workflow completed successfully!');
    console.log('🌙 [MIDNIGHT] ========================================');
    
    return {
      success: true,
      message: 'Midnight reset and creation workflow completed successfully',
      resetResult,
      createResult,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ [MIDNIGHT] Fatal error in midnight workflow:', error);
    return {
      success: false,
      message: 'Fatal error in midnight workflow',
      error: error.message,
    };
  }
};

/**
 * Manual trigger endpoint for testing daily auction creation
 * POST /scheduler/create-daily-auction
 */
const manualTriggerDailyAuction = async (req, res) => {
  try {
    const result = await createDailyAuction();
    
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in manualTriggerDailyAuction:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Manual trigger endpoint for creating hourly auctions from today's daily auction
 * POST /scheduler/create-hourly-auctions
 */
const manualTriggerHourlyAuctions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyAuctions = await DailyAuction.findByDate(today);
    
    if (dailyAuctions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No daily auction found for today',
      });
    }
    
    const dailyAuction = dailyAuctions[0];
    const result = await createHourlyAuctions(dailyAuction);
    
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in manualTriggerHourlyAuctions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Manual trigger endpoint for testing midnight reset and creation workflow
 * POST /scheduler/midnight-reset
 */
const manualTriggerMidnightReset = async (req, res) => {
  try {
    const result = await midnightResetAndCreate();
    
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Error in manualTriggerMidnightReset:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get daily auction for a specific date
 * GET /scheduler/daily-auction
 */
const getDailyAuction = async (req, res) => {
  try {
    const latestAuction = await DailyAuction
      .find({ isActive: true })
      .sort({ createdAt: -1 })   
      .limit(1);                 

    return res.status(200).json({
      success: true,
      data: latestAuction.length > 0 ? latestAuction[0] : null,
    });

  } catch (error) {
    console.error('Error in getDailyAuction:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get hourly auctions for the latest active daily auction
 * GET /scheduler/hourly-auctions
 */
const getHourlyAuctions = async (req, res) => {
  try {
    // 1) Get the latest active daily auction
    const latestDaily = await DailyAuction
      .findOne({ isActive: true })
      .sort({ createdAt: -1 });

    if (!latestDaily) {
      return res.status(404).json({
        success: false,
        message: 'No active daily auction found'
      });
    }

    // 2) Find ALL hourly auctions (active + inactive) for that dailyAuctionId
    const hourlyAuctions = await HourlyAuction.find({
      dailyAuctionId: latestDaily.dailyAuctionId
    })
    .sort({ createdAt: 1 })   // earliest -> latest; change to -1 for reverse
    .lean();                  // optional: returns plain JS objects (faster for read-only)

    const total = hourlyAuctions.length;
    const activeCount = hourlyAuctions.filter(h => h.isActive).length;
    const inactiveCount = total - activeCount;

    return res.status(200).json({
      success: true,
      data: hourlyAuctions,
      meta: {
        dailyAuctionId: latestDaily.dailyAuctionId,
        dailyAuctionTitle: latestDaily.title || null,
        counts: {
          total,
          active: activeCount,
          inactive: inactiveCount
        }
      },
    });
  } catch (error) {
    console.error('Error in getHourlyAuctions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Update hourly auction status
 * PATCH /scheduler/hourly-auctions/:hourlyAuctionId/status
 * Also syncs status back to dailyAuctionConfig
 */
const updateHourlyAuctionStatus = async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    const { status } = req.body;
    
    if (!status || !['LIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status required (LIVE, UPCOMING, COMPLETED, CANCELLED)',
      });
    }
    
    const auction = await HourlyAuction.findOneAndUpdate(
      { hourlyAuctionId },
      { 
        Status: status,
        ...(status === 'LIVE' && { startedAt: new Date() }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
      { new: true }
    );
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Hourly auction not found',
      });
    }
    
    // Sync status back to dailyAuctionConfig
    const syncResult = await syncHourlyStatusToDailyConfig(hourlyAuctionId, status);
    
    return res.status(200).json({
      success: true,
      data: auction,
      sync: syncResult,
    });
  } catch (error) {
    console.error('Error in updateHourlyAuctionStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get the current live hourly auction
 * GET /scheduler/live-auction
 * Returns only one hourly auction with status LIVE
 */
const getLiveHourlyAuction = async (req, res) => {
  try {
    const liveAuction = await HourlyAuction.findOne({ Status: 'LIVE' })
      .sort({ startedAt: -1 })
      .lean();
    
    if (!liveAuction) {
      return res.status(404).json({
        success: false,
        message: 'No live hourly auction found',
        data: null,
      });
    }
    
    return res.status(200).json({
      success: true,
      data: liveAuction,
    });
  } catch (error) {
    console.error('Error in getLiveHourlyAuction:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Manual trigger for auto-activation logic (for testing)
 * POST /scheduler/trigger-auto-activate
 */
const manualTriggerAutoActivate = async (req, res) => {
  try {
    console.log('🔧 [MANUAL] Triggering auto-activation logic...');
    
    // ✅ FIX: Import scheduler module dynamically to avoid circular dependency
    const { autoActivateAuctions } = require('../config/scheduler');
    await autoActivateAuctions();
    
    return res.status(200).json({
      success: true,
      message: 'Auto-activation logic executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in manualTriggerAutoActivate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get current auction status and schedule for today
 * GET /scheduler/status
 */
const getSchedulerStatus = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's auctions
    const todaysAuctions = await HourlyAuction.findByDate(today);
    
    // Find current live auction
    const liveAuction = await HourlyAuction.findOne({ Status: 'LIVE' })
      .sort({ startedAt: -1 })
      .lean();
    
    // Count by status
    const statusCounts = {
      UPCOMING: todaysAuctions.filter(a => a.Status === 'UPCOMING').length,
      LIVE: todaysAuctions.filter(a => a.Status === 'LIVE').length,
      COMPLETED: todaysAuctions.filter(a => a.Status === 'COMPLETED').length,
      CANCELLED: todaysAuctions.filter(a => a.Status === 'CANCELLED').length,
    };
    
    // Find next upcoming auction
    const nextAuction = todaysAuctions
      .filter(a => a.Status === 'UPCOMING')
      .sort((a, b) => a.TimeSlot.localeCompare(b.TimeSlot))[0];
    
    return res.status(200).json({
      success: true,
      data: {
        serverTime: {
          iso: now.toISOString(),
          time: now.toLocaleTimeString('en-US', { hour12: false }),
          date: now.toLocaleDateString('en-GB'),
          timezone: process.env.TIMEZONE || 'Asia/Kolkata',
        },
        currentLiveAuction: liveAuction || null,
        nextUpcomingAuction: nextAuction ? {
          hourlyAuctionCode: nextAuction.hourlyAuctionCode,
          auctionName: nextAuction.auctionName,
          TimeSlot: nextAuction.TimeSlot,
          prizeValue: nextAuction.prizeValue,
        } : null,
        todayStats: {
          total: todaysAuctions.length,
          ...statusCounts,
        },
        schedule: todaysAuctions.map(a => ({
          hourlyAuctionCode: a.hourlyAuctionCode,
          auctionName: a.auctionName,
          TimeSlot: a.TimeSlot,
          Status: a.Status,
          currentRound: a.currentRound,
          totalRounds: a.roundCount,
          prizeValue: a.prizeValue,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getSchedulerStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Place a bid in the active round
 * POST /scheduler/place-bid
 * Body: { playerId, playerUsername, auctionValue, hourlyAuctionId }
 */
const placeBid = async (req, res) => {
  try {
    const { playerId, playerUsername, auctionValue, hourlyAuctionId } = req.body;
    
    // Validate required fields
    if (!playerId || !playerUsername || !auctionValue || !hourlyAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: playerId, playerUsername, auctionValue, hourlyAuctionId',
      });
    }
    
    // Validate bid amount is positive
    if (auctionValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Auction value must be greater than 0',
      });
    }
    
    // Find the auction
    const auction = await HourlyAuction.findOne({ hourlyAuctionId });
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }
    
    // Check if auction is LIVE
    if (auction.Status !== 'LIVE') {
      return res.status(400).json({
        success: false,
        message: `Auction is not live. Current status: ${auction.Status}`,
      });
    }
    
    // Check if user is a participant (verified if user joined hourly auction)
    const participant = auction.participants.find(p => p.playerId === playerId);
    
    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You must join the auction first. Please pay the entry fee to participate.',
      });
    }
    
    // Check if player is eliminated
    if (participant.isEliminated) {
      return res.status(403).json({
        success: false,
        message: `You have been eliminated in round ${participant.eliminatedInRound}`,
      });
    }
    
    // Get current round number
    const currentRound = auction.currentRound;
    
    // ✅ NEW: Check if player qualified from previous round (for rounds 2, 3, 4)
    if (currentRound > 1) {
      const previousRound = auction.rounds.find(r => r.roundNumber === currentRound - 1);
      
      if (!previousRound) {
        return res.status(400).json({
          success: false,
          message: `Previous round ${currentRound - 1} not found`,
        });
      }
      
      // Check if previous round is completed
      if (previousRound.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: `Previous round ${currentRound - 1} must be completed before you can bid in round ${currentRound}`,
        });
      }
      
      // Check if player is in the qualified players list
      const isQualified = previousRound.qualifiedPlayers.includes(playerId);
      
      if (!isQualified) {
        return res.status(403).json({
          success: false,
          message: `You did not qualify from round ${currentRound - 1}. Only top 3 ranked players can proceed to the next round.`,
        });
      }
      
      console.log(`✅ [BID] Player ${playerUsername} qualified from round ${currentRound - 1}, allowed to bid in round ${currentRound}`);
    }
    
    // Find the current round in rounds array
    const roundIndex = auction.rounds.findIndex(r => r.roundNumber === currentRound);
    
    if (roundIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Round ${currentRound} not found`,
      });
    }
    
    // Check if round is ACTIVE
    if (auction.rounds[roundIndex].status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Round ${currentRound} is not active. Current status: ${auction.rounds[roundIndex].status}`,
      });
    }
    
    // Check if player already placed a bid in this round (user can only bid once per round)
    const existingBidIndex = auction.rounds[roundIndex].playersData.findIndex(
      p => p.playerId === playerId
    );
    
    if (existingBidIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: `You have already placed a bid in round ${currentRound}. You can only bid once per round.`,
      });
    }
    
    // Check if this is the first bid in this round for this user
    const isFirstBidInRound = !auction.rounds.some((round, idx) => 
      idx < roundIndex && round.playersData.some(p => p.playerId === playerId)
    );
    
    // Add new bid
    auction.rounds[roundIndex].playersData.push({
      playerId,
      playerUsername,
      auctionPlacedAmount: auctionValue,
      auctionPlacedTime: new Date(),
      isQualified: false,
      rank: null,
    });
    
    // Update totalParticipants for this round (count of playersData)
    auction.rounds[roundIndex].totalParticipants = auction.rounds[roundIndex].playersData.length;
    
    // Update participant stats
    const participantIndex = auction.participants.findIndex(p => p.playerId === playerId);
    auction.participants[participantIndex].totalBidsPlaced += 1;
    auction.participants[participantIndex].totalAmountBid += auctionValue;
    auction.participants[participantIndex].currentRound = currentRound;
    
    // Increment total bids count
    auction.totalBids += 1;
    
    // Save the auction
    await auction.save();
    
    // ✅ Update auction history with bid information
    await AuctionHistory.updateBidInfo(playerId, hourlyAuctionId, {
      bidAmount: auctionValue,
      isFirstBidInRound,
    });
    
    console.log(`✅ [BID] Player ${playerUsername} placed bid of ₹${auctionValue} in round ${currentRound} for auction ${auction.hourlyAuctionCode}`);
    
    return res.status(200).json({
      success: true,
      message: `Your bid of ₹${auctionValue} has been placed successfully in Round ${currentRound}!`,
      data: {
        playerId,
        playerUsername,
        auctionValue: auctionValue,
        roundNumber: currentRound,
        placedAt: new Date(),
        totalBidsPlaced: auction.participants[participantIndex].totalBidsPlaced,
      },
    });
  } catch (error) {
    console.error('❌ [BID] Error in placeBid:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Mark winners in auction history
 * POST /scheduler/mark-winners/:hourlyAuctionId
 * This should be called when an auction is completed to update auction history
 */
const markAuctionWinners = async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    
    // Find the completed auction
    const auction = await HourlyAuction.findOne({ hourlyAuctionId });
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }
    
    if (auction.Status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Auction is not completed yet. Current status: ${auction.Status}`,
      });
    }
    
    if (!auction.winners || auction.winners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No winners found in this auction',
      });
    }
    
    // ✅ CRITICAL FIX: Calculate total participants count from participants array
    const totalParticipants = auction.participants?.length || auction.totalParticipants || 0;
    
    console.log(`✅ [MARK_WINNERS] Marking winners for auction ${auction.hourlyAuctionCode}`);
    console.log(`   👥 Total participants: ${totalParticipants}`);
    
    // Mark winners in auction history with total participants count
    const winnersUpdated = await AuctionHistory.markWinners(
      hourlyAuctionId, 
      auction.winners,
      totalParticipants // ✅ Pass total participants count
    );
    
    // Mark non-winners as completed with total participants count
    const nonWinnersUpdated = await AuctionHistory.markNonWinners(
      hourlyAuctionId,
      totalParticipants // ✅ Pass total participants count
    );
    
    console.log(`✅ [MARK_WINNERS] Updated auction history for auction ${auction.hourlyAuctionCode}`);
    console.log(`   🏆 Winners marked: ${winnersUpdated.length}`);
    console.log(`   📊 Non-winners marked: ${nonWinnersUpdated.modifiedCount}`);
    console.log(`   👥 Total participants passed: ${totalParticipants}`);
    
    return res.status(200).json({
      success: true,
      message: 'Auction winners marked successfully in history',
      data: {
        hourlyAuctionId,
        hourlyAuctionCode: auction.hourlyAuctionCode,
        winnersMarked: winnersUpdated.length,
        nonWinnersMarked: nonWinnersUpdated.modifiedCount,
        totalParticipants,
        winners: winnersUpdated.map(w => ({
          userId: w.userId,
          username: w.username,
          rank: w.finalRank,
          prizeWon: w.prizeAmountWon,
          lastRoundBid: w.lastRoundBidAmount,
        })),
      },
    });
  } catch (error) {
    console.error('❌ [MARK_WINNERS] Error marking winners:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get user's auction history from AuctionHistory model
 * GET /scheduler/user-auction-history?userId=xxx
 */
const getUserAuctionHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }
    
    // Get user's history
    const history = await AuctionHistory.getUserHistory(userId);
    
    // Get user's statistics
    const stats = await AuctionHistory.getUserStats(userId);
    
    // ✅ Include priority claim fields in response
    const enrichedHistory = history.map(entry => ({
      ...entry,
      // Priority claim system fields
      currentEligibleRank: entry.currentEligibleRank || null,
      claimWindowStartedAt: entry.claimWindowStartedAt || null,
      ranksOffered: entry.ranksOffered || [],
    }));
    
    return res.status(200).json({
      success: true,
      data: enrichedHistory,
      stats,
    });
  } catch (error) {
    console.error('❌ [USER_HISTORY] Error fetching user auction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get detailed auction data for view details page
 * GET /scheduler/auction-details?hourlyAuctionId=xxx&userId=xxx
 */
const getAuctionDetails = async (req, res) => {
  try {
    const { hourlyAuctionId, userId } = req.query;
    
    if (!hourlyAuctionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId and userId are required',
      });
    }
    
    // Find the auction
    const auction = await HourlyAuction.findOne({ hourlyAuctionId }).lean();
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }
    
    // Find user's auction history entry
    const userHistory = await AuctionHistory.findOne({ 
      userId, 
      hourlyAuctionId 
    }).lean();
    
    if (!userHistory) {
      return res.status(404).json({
        success: false,
        message: 'User did not participate in this auction',
      });
    }
    
    // Process round-by-round data
    const roundsData = auction.rounds?.map(round => {
      const userBid = round.playersData?.find(p => p.playerId === userId);
      const sortedPlayers = [...(round.playersData || [])].sort((a, b) => {
        if (b.auctionPlacedAmount !== a.auctionPlacedAmount) {
          return b.auctionPlacedAmount - a.auctionPlacedAmount;
        }
        return new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime();
      });
      
      const highestBid = sortedPlayers[0]?.auctionPlacedAmount || 0;
      const lowestBid = sortedPlayers[sortedPlayers.length - 1]?.auctionPlacedAmount || 0;
      const userRank = userBid ? sortedPlayers.findIndex(p => p.playerId === userId) + 1 : null;
      
      return {
        roundNumber: round.roundNumber,
        status: round.status,
        totalParticipants: round.playersData?.length || 0,
        qualifiedCount: round.qualifiedPlayers?.length || 0,
        highestBid,
        lowestBid,
        userBid: userBid?.auctionPlacedAmount || null,
        userRank,
        userQualified: round.qualifiedPlayers?.includes(userId) || false,
        startedAt: round.startedAt,
        completedAt: round.completedAt,
      };
    }) || [];
    
    // Get winner information with cascading logic
    let winnerInfo = null;
    if (userHistory.isWinner) {
      winnerInfo = {
        rank: userHistory.finalRank,
        prizeAmount: userHistory.prizeAmountWon,
        lastRoundBidAmount: userHistory.lastRoundBidAmount,
        claimStatus: userHistory.prizeClaimStatus,
        claimDeadline: userHistory.claimDeadline,
        claimedAt: userHistory.claimedAt,
        remainingFeesPaid: userHistory.remainingFeesPaid,
      };
    }
    
    return res.status(200).json({
      success: true,
      data: {
        auction: {
          hourlyAuctionId: auction.hourlyAuctionId,
          hourlyAuctionCode: auction.hourlyAuctionCode,
          auctionName: auction.auctionName,
          prizeValue: auction.prizeValue,
          status: auction.Status,
          timeSlot: auction.TimeSlot,
          totalParticipants: auction.participants?.length || 0,
        },
        rounds: roundsData,
        userParticipation: {
          entryFeePaid: userHistory.entryFeePaid,
          totalAmountBid: userHistory.totalAmountBid,
          totalAmountSpent: userHistory.totalAmountSpent,
          roundsParticipated: userHistory.roundsParticipated,
          totalBidsPlaced: userHistory.totalBidsPlaced,
          isWinner: userHistory.isWinner,
          finalRank: userHistory.finalRank,
        },
        winnerInfo,
      },
    });
  } catch (error) {
    console.error('❌ [AUCTION_DETAILS] Error fetching auction details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = {
  createDailyAuction,
  createHourlyAuctions,
  resetDailyAuctions,
  midnightResetAndCreate,
  manualTriggerDailyAuction,
  manualTriggerMidnightReset,
  manualTriggerHourlyAuctions,
  getDailyAuction,
  getHourlyAuctions,
  updateHourlyAuctionStatus,
  getLiveHourlyAuction,
  manualTriggerAutoActivate,
  getSchedulerStatus,
  placeBid,
  syncHourlyStatusToDailyConfig,
  markAuctionWinners,
  getUserAuctionHistory,
  getAuctionDetails,
};