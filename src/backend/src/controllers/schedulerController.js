// src/controllers/schedulerController.js
const { v4: uuidv4 } = require('uuid');
const MasterAuction = require('../models/masterAuction');
const DailyAuction = require('../models/DailyAuction');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');
const { syncUserStats } = require('./userController');

/**
 * ✅ Helper function to get current IST time
 * Returns a Date object where UTC components match IST components
 * (e.g. if it's 3 PM IST, result.getUTCHours() will be 15)
 */
const getISTTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  
  const result = new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate(),
    istDate.getUTCHours(),
    istDate.getUTCMinutes(),
    istDate.getUTCSeconds(),
    istDate.getUTCMilliseconds()
  ));
  
  console.log(`🕐 [IST-TIME] Current IST: ${istDate.getUTCHours()}:${istDate.getUTCMinutes()}, Stored as UTC: ${result.toISOString()}`);
  
  return result;
};

/**
 * ✅ Helper function to get IST date at start of day (00:00:00)
 * Used for comparing auction dates
 */
const getISTDateStart = () => {
  const now = new Date();
  
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTimestamp = now.getTime() + istOffset;
  const istDate = new Date(istTimestamp);
  
  // Extract IST date components
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  
  // Create start of day in IST (stored as UTC for MongoDB comparison)
  const result = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  console.log(`📅 [IST-DATE-START] IST Date: ${year}-${month+1}-${day}, Start of day: ${result.toISOString()}`);
  
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
 * Sync rounds and bid data from HourlyAuction to DailyAuction after a bid is placed
 * This keeps the dailyAuctionConfig.rounds array in sync with hourlyAuction.rounds
 */
const syncBidDataToDailyAuction = async (hourlyAuction, roundNumber, bidData, participantStats) => {
  try {
    // Find the daily auction
    const dailyAuction = await DailyAuction.findOne({ 
      dailyAuctionId: hourlyAuction.dailyAuctionId 
    });
    
    if (!dailyAuction) {
      console.warn(`⚠️ [SYNC_BID] Daily auction not found: ${hourlyAuction.dailyAuctionId}`);
      return { success: false, message: 'Daily auction not found' };
    }
    
    // Find the matching config entry by hourlyAuctionId
    const configIndex = dailyAuction.dailyAuctionConfig.findIndex(
      config => config.hourlyAuctionId === hourlyAuction.hourlyAuctionId
    );
    
    if (configIndex === -1) {
      console.warn(`⚠️ [SYNC_BID] Config entry not found for hourlyAuctionId: ${hourlyAuction.hourlyAuctionId}`);
      return { success: false, message: 'Config entry not found' };
    }
    
    // Initialize rounds array if not present
    if (!dailyAuction.dailyAuctionConfig[configIndex].rounds) {
      dailyAuction.dailyAuctionConfig[configIndex].rounds = [];
    }
    
    // Find or create the round entry
    let roundIndex = dailyAuction.dailyAuctionConfig[configIndex].rounds.findIndex(
      r => r.roundNumber === roundNumber
    );
    
    if (roundIndex === -1) {
      // Create new round entry
      dailyAuction.dailyAuctionConfig[configIndex].rounds.push({
        roundNumber,
        startedAt: bidData.placedAt,
        completedAt: null,
        totalParticipants: 1,
        playersData: [{
          playerId: bidData.playerId,
          playerUsername: bidData.playerUsername,
          auctionPlacedAmount: bidData.auctionValue,
          auctionPlacedTime: bidData.placedAt,
          isQualified: false,
          rank: null,
        }],
        qualifiedPlayers: [],
        status: 'ACTIVE',
      });
    } else {
      // Add bid to existing round
      const existingBid = dailyAuction.dailyAuctionConfig[configIndex].rounds[roundIndex].playersData.find(
        p => p.playerId === bidData.playerId
      );
      
      if (!existingBid) {
        dailyAuction.dailyAuctionConfig[configIndex].rounds[roundIndex].playersData.push({
          playerId: bidData.playerId,
          playerUsername: bidData.playerUsername,
          auctionPlacedAmount: bidData.auctionValue,
          auctionPlacedTime: bidData.placedAt,
          isQualified: false,
          rank: null,
        });
        dailyAuction.dailyAuctionConfig[configIndex].rounds[roundIndex].totalParticipants += 1;
      }
    }
    
    // Update participant stats in dailyAuctionConfig
    if (dailyAuction.dailyAuctionConfig[configIndex].participants) {
      const participantIndex = dailyAuction.dailyAuctionConfig[configIndex].participants.findIndex(
        p => p.playerId === bidData.playerId
      );
      
      if (participantIndex !== -1 && participantStats) {
        dailyAuction.dailyAuctionConfig[configIndex].participants[participantIndex].totalBidsPlaced = participantStats.totalBidsPlaced;
        dailyAuction.dailyAuctionConfig[configIndex].participants[participantIndex].totalAmountBid = participantStats.totalAmountBid;
        dailyAuction.dailyAuctionConfig[configIndex].participants[participantIndex].currentRound = roundNumber;
      }
    }
    
    // Update total bids count
    dailyAuction.dailyAuctionConfig[configIndex].totalBids = (dailyAuction.dailyAuctionConfig[configIndex].totalBids || 0) + 1;
    dailyAuction.dailyAuctionConfig[configIndex].currentRound = roundNumber;
    
    dailyAuction.markModified('dailyAuctionConfig');
    await dailyAuction.save();
    
    console.log(`✅ [SYNC_BID] Bid synced to DailyAuction for ${bidData.playerUsername} in round ${roundNumber}`);
    return { success: true, message: 'Bid synced to DailyAuction' };
  } catch (error) {
    console.error(`❌ [SYNC_BID] Error syncing bid data:`, error);
    return { success: false, message: error.message };
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
            prizeClaimStatus: winner.prizeClaimStatus || 'PENDING',
            prizeClaimedAt: winner.prizeClaimedAt || null,
            prizeClaimedBy: winner.prizeClaimedBy || null,
            claimNotes: winner.claimNotes || null,
          }));

        
        console.log(`     🏆 [SYNC-WINNERS] Synced ${hourlyAuction.winners.length} winners to daily auction config for ${hourlyAuction.TimeSlot}`);
        console.log(`     🏆 [SYNC-WINNERS] Winners: ${hourlyAuction.winners.map(w => `${w.rank}. ${w.playerUsername}`).join(', ')}`);
      }

      // ✅ Sync participants and rounds data to DailyAuction
      dailyAuction.dailyAuctionConfig[configIndex].participants = hourlyAuction.participants || [];
      dailyAuction.dailyAuctionConfig[configIndex].rounds = hourlyAuction.rounds || [];
      dailyAuction.dailyAuctionConfig[configIndex].totalParticipants = hourlyAuction.totalParticipants || 0;
      dailyAuction.dailyAuctionConfig[configIndex].currentRound = hourlyAuction.currentRound || 1;
      dailyAuction.dailyAuctionConfig[configIndex].totalBids = hourlyAuction.totalBids || 0;
      
      console.log(`     📊 [SYNC-DATA] Synced ${hourlyAuction.participants?.length || 0} participants and ${hourlyAuction.rounds?.length || 0} rounds to DailyAuction`);
      
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
 * ✅ FIXED: Reset all daily and hourly auctions by setting isActive to false
 * This runs at 00:00 AM (midnight) before creating new auctions
 * ✅ CRITICAL FIX: Does NOT delete old auctions - only marks them as inactive/completed
 * ✅ CRITICAL FIX: Uses IST date for proper comparison
 * This preserves all historical data including participants, bids, winners, etc.
 */
const resetDailyAuctions = async () => {
  try {
    console.log('🔄 [RESET] Starting daily auction reset at', new Date().toISOString());
    
    // ✅ FIX: Ensure MongoDB connection before operations
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [RESET] MongoDB not connected. Connection state:', mongoose.connection.readyState);
      return {
        success: false,
        message: 'Database connection not established',
        error: 'MongoDB connection state: ' + mongoose.connection.readyState
      };
    }
    
    // ✅ CRITICAL FIX: Use IST date for comparison, not local server time
    const todayIST = getISTDateStart();
    
    console.log(`🔄 [RESET] Today's IST date (start): ${todayIST.toISOString()}`);
    
    // ✅ CRITICAL FIX: Only mark PAST daily auctions as inactive - DO NOT touch today's
    // This preserves all participant data, bids, winners, etc.
    const dailyResult = await DailyAuction.updateMany(
      { 
        isActive: true,
        auctionDate: { $lt: todayIST } // Only update auctions BEFORE today (IST)
      },
      { 
        $set: { 
          isActive: false,
          Status: 'COMPLETED'
        } 
      }
    );
    
    console.log(`✅ [RESET] Marked ${dailyResult.modifiedCount} past daily auctions as inactive (preserved data)`);
    
    // ✅ CRITICAL FIX: Only update PAST hourly auctions - DO NOT touch today's
    // Also exclude already COMPLETED auctions to preserve their state
    const hourlyResult = await HourlyAuction.updateMany(
      { 
        Status: { $in: ['LIVE', 'UPCOMING'] }, // Only update non-completed auctions
        auctionDate: { $lt: todayIST } // Only update auctions BEFORE today (IST)
      },
      { 
        $set: { 
          Status: 'COMPLETED',
          completedAt: getISTTime() // Use IST time for completion timestamp
        } 
      }
    );
    
    console.log(`✅ [RESET] Marked ${hourlyResult.modifiedCount} past hourly auctions as COMPLETED (preserved data)`);
    
    // ✅ NEW: Log what auctions were NOT modified (today's auctions)
    const todaysDaily = await DailyAuction.countDocuments({ auctionDate: { $gte: todayIST }, isActive: true });
    const todaysHourly = await HourlyAuction.countDocuments({ auctionDate: { $gte: todayIST }, Status: { $in: ['LIVE', 'UPCOMING', 'COMPLETED'] } });
    
    console.log(`📊 [RESET] Today's auctions preserved: ${todaysDaily} daily, ${todaysHourly} hourly`);
    
    return {
      success: true,
      message: 'All past daily and hourly auctions marked as completed (data preserved)',
      dailyAuctionsUpdated: dailyResult.modifiedCount,
      hourlyAuctionsUpdated: hourlyResult.modifiedCount,
      todaysAuctionsPreserved: {
        daily: todaysDaily,
        hourly: todaysHourly
      }
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
 * ✅ FIXED: Create daily auction from active master auction for TODAY
 * This runs automatically at 12:00 AM (midnight) every day AFTER resetting old auctions
 * Creates 1 DailyAuction for TODAY with all statuses set to UPCOMING
 * ✅ CRITICAL FIX: Uses IST date for proper date handling
 * ✅ CRITICAL FIX: Does NOT delete existing auctions - creates new ones only if not exist
 */
const createDailyAuction = async () => {
  try {
    console.log('🕐 [SCHEDULER] Starting daily auction creation at', new Date().toISOString());
    
    // ✅ FIX: Ensure MongoDB connection before operations
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [SCHEDULER] MongoDB not connected. Connection state:', mongoose.connection.readyState);
      return {
        success: false,
        message: 'Database connection not established',
        error: 'MongoDB connection state: ' + mongoose.connection.readyState
      };
    }
    
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
    
    // ✅ CRITICAL FIX: Update ALL active daily auctions (not just today's)
    const activeDailyAuctions = await DailyAuction.find({
      isActive: true
    });
    
    const results = [];
    
    // If no active daily auction exists for today, we'll create it later
    // But first, update any existing active ones
    for (const existingDailyAuction of activeDailyAuctions) {
      console.log(`🔄 [SCHEDULER] Syncing daily auction: ${existingDailyAuction.dailyAuctionId} (${existingDailyAuction.auctionDate.toISOString()})`);
      
      // Update basic fields from master
      existingDailyAuction.totalAuctionsPerDay = activeMasterAuction.totalAuctionsPerDay;
      
      // Merge configs: Update existing upcoming ones and add new ones
      const masterConfigs = activeMasterAuction.dailyAuctionConfig.map(c => c.toObject ? c.toObject() : { ...c });
      const existingConfigs = existingDailyAuction.dailyAuctionConfig;
      
      const updatedConfigs = [...existingConfigs];
      
      for (const masterConfig of masterConfigs) {
        // Find existing config by TimeSlot or auctionNumber
        const existingIndex = updatedConfigs.findIndex(ec => 
          ec.auctionNumber === masterConfig.auctionNumber || ec.TimeSlot === masterConfig.TimeSlot
        );
        
          if (existingIndex !== -1) {
            // Always update product details from master, even if LIVE (requested: "update all")
            const hourlyAuctionId = updatedConfigs[existingIndex].hourlyAuctionId;
            const currentStatus = updatedConfigs[existingIndex].Status;
            
            // Only update fields if it's UPCOMING or LIVE. COMPLETED auctions should remain as is for history.
            if (currentStatus === 'UPCOMING' || currentStatus === 'LIVE') {
              updatedConfigs[existingIndex] = {
                ...masterConfig,
                auctionId: updatedConfigs[existingIndex].auctionId, // Keep original auctionId
                hourlyAuctionId: hourlyAuctionId, // Keep original hourlyAuctionId
                Status: currentStatus, // Keep current status
                isAuctionCompleted: updatedConfigs[existingIndex].isAuctionCompleted,
                completedAt: updatedConfigs[existingIndex].completedAt,
                topWinners: updatedConfigs[existingIndex].topWinners || [],
                productImages: masterConfig.productImages || [],
                productDescription: masterConfig.productDescription || {},
              };
              console.log(`  📝 Updated existing ${currentStatus} slot: ${masterConfig.TimeSlot}`);
            } else {
              console.log(`  ⏭️ Skipping core update for slot ${masterConfig.TimeSlot} as it is already ${currentStatus}`);
            }
          } else {
          // New slot from master that doesn't exist in this daily auction
          const newHourlyAuctionId = uuidv4();
          updatedConfigs.push({
            ...masterConfig,
            auctionId: uuidv4(),
            Status: 'UPCOMING',
            isAuctionCompleted: false,
            completedAt: null,
            topWinners: [],
            hourlyAuctionId: newHourlyAuctionId,
            productImages: masterConfig.productImages || [],
            productDescription: masterConfig.productDescription || {},
          });
          console.log(`  ➕ Added new slot from master: ${masterConfig.TimeSlot}`);
        }
      }
      
      existingDailyAuction.dailyAuctionConfig = updatedConfigs;
      existingDailyAuction.markModified('dailyAuctionConfig');
      await existingDailyAuction.save();
      
      // Now create/update hourly auctions for this daily auction
      const hourlyResult = await createHourlyAuctions(existingDailyAuction);
      results.push({
        dailyAuctionId: existingDailyAuction.dailyAuctionId,
        date: existingDailyAuction.auctionDate,
        hourlyResult
      });
    }

    // ✅ CRITICAL FIX: Check if daily auction for today was among those updated
    const todayIST = getISTDateStart();
    const hasToday = activeDailyAuctions.some(da => da.auctionDate.getTime() === todayIST.getTime());

    if (hasToday) {
      return {
        success: true,
        message: 'All active daily auctions re-synced with master configuration',
        results,
        wasExisting: true,
      };
    }

    // If today's auction wasn't found, create it
    console.log(`📅 [SCHEDULER] Today's daily auction not found. Creating for TODAY (IST): ${todayIST.toISOString()}`);

    
    // ✅ Generate NEW unique dailyAuctionId
    const newDailyAuctionId = uuidv4();
    
    // ✅ Generate NEW unique hourlyAuctionId for each config UPFRONT
    // This ensures consistency across all models from the start
    const dailyAuctionConfigForToday = activeMasterAuction.dailyAuctionConfig.map(config => {
      const configObj = config.toObject ? config.toObject() : { ...config };
      const newHourlyAuctionId = uuidv4(); // Generate hourlyAuctionId upfront
      return {
        ...configObj,
        auctionId: uuidv4(), // Generate NEW UUID for each config entry
        Status: 'UPCOMING', // Force all to UPCOMING
        isAuctionCompleted: false,
        completedAt: null,
            topWinners: [],
            hourlyAuctionId: newHourlyAuctionId, // ✅ Store hourlyAuctionId upfront in dailyAuctionConfig
            productImages: configObj.productImages || [], // ✅ Explicitly copy productImages from master
            productDescription: configObj.productDescription || {}, // ✅ Explicitly copy productDescription from master
          };
      });
    
    // Create daily auction as complete replica of master auction for TODAY
    const dailyAuctionData = {
      masterId: activeMasterAuction.master_id,
      dailyAuctionId: newDailyAuctionId, 
      auctionDate: todayIST, // ✅ Use IST date
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
    // ✅ Pass the pre-generated hourlyAuctionIds
    const hourlyAuctionResult = await createHourlyAuctions(dailyAuction);
    
    console.log(`🎉 [SCHEDULER] Daily auction creation completed for TODAY.`);
    
    return {
      success: true,
      message: `Daily auction and hourly auctions created successfully for today`,
      dailyAuction: dailyAuction,
      hourlyAuctions: hourlyAuctionResult,
      date: todayIST.toISOString(),
      wasExisting: false,
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
 * ✅ FIXED: Create hourly auctions from daily auction config (all set to UPCOMING)
 * Creates individual HourlyAuction documents for each config in DailyAuction
 * ✅ CRITICAL FIX: Uses pre-generated hourlyAuctionId from dailyAuctionConfig
 * ✅ Does NOT overwrite existing hourly auctions - creates only if not exist
 */
const createHourlyAuctions = async (dailyAuction) => {
  try {
    console.log(`🕐 [SCHEDULER] Creating hourly auctions for daily auction: ${dailyAuction.dailyAuctionId}`);
    
    const configs = (dailyAuction.dailyAuctionConfig || []).map(c => c.toObject ? c.toObject() : { ...c });
    
    if (configs.length === 0) {
      console.log('⚠️ [SCHEDULER] No auction configs found in daily auction.');
      return {
        success: false,
        message: 'No auction configurations found',
        created: 0,
      };
    }
    
    const createdAuctions = [];
    const skippedAuctions = [];
    const errors = [];
    
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      try {
        // ✅ CRITICAL FIX: Check if hourly auction already exists with this hourlyAuctionId
        // This prevents duplicate creation and data loss
        const existingHourlyAuction = await HourlyAuction.findOne({
          hourlyAuctionId: config.hourlyAuctionId
        });
        
          if (existingHourlyAuction) {
            const currentStatus = existingHourlyAuction.Status;
            if (currentStatus === 'UPCOMING' || currentStatus === 'LIVE') {
              console.log(`  🔄 Updating existing ${currentStatus} hourly auction: ${existingHourlyAuction.hourlyAuctionCode} (${config.TimeSlot})`);
              
              // Update product fields from config
              existingHourlyAuction.auctionName = config.auctionName;
              existingHourlyAuction.prizeValue = config.prizeValue;
              existingHourlyAuction.maxDiscount = config.maxDiscount || 0;
              existingHourlyAuction.imageUrl = config.imageUrl || null;
              existingHourlyAuction.productImages = config.productImages || [];
              existingHourlyAuction.productDescription = config.productDescription || {};
              
              // Only update core config fields if it's UPCOMING
              if (currentStatus === 'UPCOMING') {
                existingHourlyAuction.TimeSlot = config.TimeSlot;
                existingHourlyAuction.EntryFee = config.EntryFee;
                existingHourlyAuction.minEntryFee = config.minEntryFee;
                existingHourlyAuction.maxEntryFee = config.maxEntryFee;
                existingHourlyAuction.FeeSplits = config.FeeSplits;
                existingHourlyAuction.roundCount = config.roundCount || 4;
                existingHourlyAuction.roundConfig = config.roundConfig || [];
                
                // Recalculate round times
                const roundTimes = calculateRoundTimes(
                  dailyAuction.auctionDate,
                  config.TimeSlot,
                  config.roundConfig || []
                );
                existingHourlyAuction.rounds = roundTimes;
              }
              
              await existingHourlyAuction.save();
              createdAuctions.push(existingHourlyAuction);
              continue;
            }
            console.log(`  ⏭️ Hourly auction already exists and is ${existingHourlyAuction.Status}: ${existingHourlyAuction.hourlyAuctionCode} (${config.TimeSlot})`);
            skippedAuctions.push(existingHourlyAuction);
            continue;
          }
        
        // ✅ Also check by dailyAuctionId + TimeSlot to prevent duplicates
        const existingByTimeSlot = await HourlyAuction.findOne({
          dailyAuctionId: dailyAuction.dailyAuctionId,
          TimeSlot: config.TimeSlot
        });
        
        if (existingByTimeSlot) {
          if (existingByTimeSlot.Status === 'UPCOMING') {
            console.log(`  🔄 Updating existing UPCOMING hourly auction (by TimeSlot): ${existingByTimeSlot.hourlyAuctionCode} (${config.TimeSlot})`);
            
            // Sync IDs if they differ
            if (config.hourlyAuctionId !== existingByTimeSlot.hourlyAuctionId) {
              dailyAuction.dailyAuctionConfig[i].hourlyAuctionId = existingByTimeSlot.hourlyAuctionId;
            }
            
            // Update fields
            existingByTimeSlot.auctionName = config.auctionName;
            existingByTimeSlot.prizeValue = config.prizeValue;
            existingByTimeSlot.maxDiscount = config.maxDiscount || 0;
            existingByTimeSlot.EntryFee = config.EntryFee;
            existingByTimeSlot.minEntryFee = config.minEntryFee;
            existingByTimeSlot.maxEntryFee = config.maxEntryFee;
            existingByTimeSlot.FeeSplits = config.FeeSplits;
            existingByTimeSlot.roundCount = config.roundCount || 4;
            existingByTimeSlot.roundConfig = config.roundConfig || [];
            existingByTimeSlot.imageUrl = config.imageUrl || null;
            existingByTimeSlot.productImages = config.productImages || [];
            existingByTimeSlot.productDescription = config.productDescription || {};
            
            const roundTimes = calculateRoundTimes(
              dailyAuction.auctionDate,
              config.TimeSlot,
              config.roundConfig || []
            );
            existingByTimeSlot.rounds = roundTimes;
            
            await existingByTimeSlot.save();
            createdAuctions.push(existingByTimeSlot);
            continue;
          }
          
          console.log(`  ⏭️ Hourly auction for this time slot already exists and is ${existingByTimeSlot.Status}: ${existingByTimeSlot.hourlyAuctionCode} (${config.TimeSlot})`);
          
          // ✅ Update the dailyAuctionConfig with the existing hourlyAuctionId
          if (config.hourlyAuctionId !== existingByTimeSlot.hourlyAuctionId) {
            dailyAuction.dailyAuctionConfig[i].hourlyAuctionId = existingByTimeSlot.hourlyAuctionId;
            console.log(`  📝 Updated config ${config.TimeSlot} with existing hourlyAuctionId: ${existingByTimeSlot.hourlyAuctionId}`);
          }
          
          skippedAuctions.push(existingByTimeSlot);
          continue;
        }
        
        // ✅ Calculate pre-scheduled round times based on TimeSlot
        const roundTimes = calculateRoundTimes(
          dailyAuction.auctionDate,
          config.TimeSlot,
          config.roundConfig || []
        );
        
        // ✅ Prepare hourly auction data with pre-generated hourlyAuctionId
        const hourlyAuctionData = {
          hourlyAuctionId: config.hourlyAuctionId, // ✅ Use pre-generated ID from dailyAuctionConfig
          dailyAuctionId: dailyAuction.dailyAuctionId,
          masterId: dailyAuction.masterId,
          auctionDate: dailyAuction.auctionDate,
          auctionNumber: config.auctionNumber,
          auctionId: config.auctionId,
          TimeSlot: config.TimeSlot,
          auctionName: config.auctionName,
          prizeValue: config.prizeValue,
          Status: 'UPCOMING', // Force UPCOMING for new day
          maxDiscount: config.maxDiscount || 0,
          EntryFee: config.EntryFee,
          minEntryFee: config.minEntryFee,
          maxEntryFee: config.maxEntryFee,
          FeeSplits: config.FeeSplits,
          roundCount: config.roundCount || 4,
            roundConfig: config.roundConfig || [],
            imageUrl: config.imageUrl || null,
            productImages: config.productImages || [],
            productDescription: config.productDescription || {},
            rounds: roundTimes, // ✅ Use pre-calculated round times
          participants: [], // ✅ Start with empty participants
          winners: [], // ✅ Start with empty winners
          totalParticipants: 0,
          totalBids: 0,
          currentRound: 1,
        };
        
        // ✅ CRITICAL FIX: Use create() instead of findOneAndUpdate to avoid overwriting
        const hourlyAuction = await HourlyAuction.create(hourlyAuctionData);
        
        createdAuctions.push(hourlyAuction);
        console.log(`  ✅ Created hourly auction (UPCOMING): ${hourlyAuction.auctionName} at ${hourlyAuction.TimeSlot} (${hourlyAuction.hourlyAuctionCode}) - ID: ${hourlyAuction.hourlyAuctionId}`);
        
      } catch (error) {
        // Handle duplicate key error gracefully
        if (error.code === 11000) {
          console.log(`  ⚠️ Duplicate key for ${config.auctionName} at ${config.TimeSlot} - already exists (skipping)`);
          
          // Try to find the existing one
          const existing = await HourlyAuction.findOne({
            dailyAuctionId: dailyAuction.dailyAuctionId,
            TimeSlot: config.TimeSlot
          });
          
          if (existing) {
            // ✅ Update the dailyAuctionConfig with the existing hourlyAuctionId
            dailyAuction.dailyAuctionConfig[i].hourlyAuctionId = existing.hourlyAuctionId;
            skippedAuctions.push(existing);
          }
        } else {
          console.error(`  ❌ Error creating hourly auction for ${config.auctionName}:`, error.message);
          errors.push({
            auctionName: config.auctionName,
            error: error.message,
          });
        }
      }
    }
    
    // Save the updated dailyAuction with hourlyAuctionId references (if any were updated)
    dailyAuction.markModified('dailyAuctionConfig');
    await dailyAuction.save();
    
    console.log(`🎉 [SCHEDULER] Hourly auction creation completed.`);
    console.log(`   📊 Created: ${createdAuctions.length}, Skipped (existing): ${skippedAuctions.length}, Errors: ${errors.length}`);
    
    return {
      success: true,
      message: 'Hourly auctions created successfully (all UPCOMING with pre-calculated round times)',
      created: createdAuctions.length,
      skipped: skippedAuctions.length,
      errors: errors.length > 0 ? errors : undefined,
      createdAuctions,
      skippedAuctions,
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
 * ✅ FIXED: Complete midnight reset and creation workflow
 * This is the main function called by the cron job at 00:00 AM
 * 1. Marks all OLD daily and hourly auctions as completed (preserves data)
 * 2. Creates new daily auction for TODAY (only if not exists)
 * 3. Creates hourly auctions for TODAY (only if not exists)
 */
const midnightResetAndCreate = async () => {
  try {
    console.log('🌙 [MIDNIGHT] ========================================');
    console.log('🌙 [MIDNIGHT] Starting midnight reset and creation workflow');
    console.log('🌙 [MIDNIGHT] Time:', new Date().toISOString());
    console.log('🌙 [MIDNIGHT] ========================================');
    
    // Step 1: Mark all old auctions as completed (DO NOT DELETE - preserves data)
    console.log('🌙 [MIDNIGHT] Step 1: Marking old auctions as completed (preserving data)...');
    const resetResult = await resetDailyAuctions();
    
    if (!resetResult.success) {
      console.error('❌ [MIDNIGHT] Reset failed:', resetResult.message);
      return {
        success: false,
        message: 'Midnight workflow failed at reset step',
        resetResult,
      };
    }
    
    console.log('✅ [MIDNIGHT] Step 1 completed: Old auctions marked as completed (data preserved)');
    
    // Step 2: Create new daily auction for TODAY (only if not exists)
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
    const today = getISTDateStart();
    
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
    const todayIST = getISTDateStart();
    
    // 1) Try to find an active auction for today first
    const todayAuction = await DailyAuction
      .findOne({ 
        isActive: true,
        auctionDate: { $gte: todayIST } 
      })
      .sort({ auctionDate: 1, createdAt: -1 });

    if (todayAuction) {
      return res.status(200).json({
        success: true,
        data: todayAuction,
      });
    }

    // 2) Fallback to the absolute latest active auction if no today/future auction found
    const latestAuction = await DailyAuction
      .findOne({ isActive: true })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: latestAuction || null,
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
    const { userId } = req.query;

    // 1. Find the currently LIVE auction with projection for speed
    // Use lean() for faster read-only access
    const commonProjection = {
      hourlyAuctionId: 1,
      hourlyAuctionCode: 1,
      auctionName: 1,
      prizeValue: 1,
      Status: 1,
      currentRound: 1,
      totalParticipants: 1,
      totalBids: 1,
      rounds: 1,
      participants: 1,
      winnersAnnounced: 1,
      roundConfig: 1,
      completedAt: 1,
      TimeSlot: 1,
      imageUrl: 1,
      productImages: 1,
      EntryFee: 1,
      minEntryFee: 1,
      maxEntryFee: 1,
      auctionDate: 1,
      roundCount: 1,
      maxDiscount: 1,
      FeeSplits: 1,
      winners: 1,
      totalPrizePool: 1,
      winnerId: 1,
      winnerUsername: 1,
      winningBid: 1,
      startedAt: 1,
      dailyAuctionId: 1,
      masterId: 1,
      auctionNumber: 1,
      auctionId: 1,
      currentEligibleRank: 1,
      claimWindowStartedAt: 1,
      productDescription: 1
    };

    let liveAuction = await HourlyAuction.findOne({ Status: 'LIVE' })
      .sort({ startedAt: -1 })
      .select(commonProjection)
      .lean();

    // 1b. PROACTIVE SEARCH: If no LIVE auction found, look for an UPCOMING one that SHOULD be live now
    if (!liveAuction) {
      console.log('🔍 [LIVE-AUCTION] No LIVE HourlyAuction found, checking for UPCOMING ones that should be live...');
      const todayIST = getISTDateStart();
      const nowIST = getISTTime();
      const currentHour = nowIST.getUTCHours();
      const currentMinute = nowIST.getUTCMinutes();
      
      // Look for an auction whose TimeSlot matches the current hour
      const timeSlotStr = `${String(currentHour).padStart(2, '0')}:00`;
      
      liveAuction = await HourlyAuction.findOne({
        Status: 'UPCOMING',
        TimeSlot: timeSlotStr,
        auctionDate: todayIST
      }).select(commonProjection).lean();
      
      if (liveAuction) {
        console.log(`✅ [LIVE-AUCTION] Found UPCOMING auction ${liveAuction.hourlyAuctionCode} for current hour ${timeSlotStr}. Returning as live.`);
        // We return it but don't modify DB status here (background scheduler will do that)
        // However, we set the status to LIVE in the returned object so frontend handles it correctly
        liveAuction.Status = 'LIVE';
      }
    }

    // 1c. FALLBACK: If still no auction, check DailyAuction fallback...
    if (!liveAuction) {
      console.log('🔍 [LIVE-AUCTION] No suitable HourlyAuction found, checking DailyAuction fallback...');
      const todayIST = getISTDateStart();
      
      // Look for today's active daily auctions
      const activeDailies = await DailyAuction.find({ 
        isActive: true,
        auctionDate: todayIST
      }).sort({ createdAt: -1 }).lean();
      
      for (const daily of activeDailies) {
        if (daily.dailyAuctionConfig) {
          const liveInConfig = daily.dailyAuctionConfig.find(c => c.Status === 'LIVE');
          if (liveInConfig && liveInConfig.hourlyAuctionId) {
            console.log(`🔍 [LIVE-AUCTION] Found LIVE status in DailyAuction ${daily.dailyAuctionId} config for slot ${liveInConfig.TimeSlot}. Fetching HourlyAuction ${liveInConfig.hourlyAuctionId}...`);
            liveAuction = await HourlyAuction.findOne({ hourlyAuctionId: liveInConfig.hourlyAuctionId })
              .select(commonProjection)
              .lean();
            
            if (liveAuction) {
              console.log(`✅ [LIVE-AUCTION] Fallback successful: Found ${liveAuction.hourlyAuctionCode}`);
              break; // Found it, stop searching other dailies
            }
          }
        }
      }
    }

    let bannerData = null;

    if (userId) {
      // ✅ OPTIMIZED BANNER LOGIC: Only check if user actually participated recently
      const fortyFiveMinsAgo = new Date(Date.now() - 45 * 60 * 1000);

      // Fetch relevant auctions (Live or recently Completed) in one batch
      const relevantAuctions = await HourlyAuction.find({
        $or: [
          { Status: 'LIVE' },
          { Status: 'COMPLETED', completedAt: { $gte: fortyFiveMinsAgo } }
        ]
      })
      .select({
        hourlyAuctionId: 1,
        hourlyAuctionCode: 1,
        auctionName: 1,
        Status: 1,
        completedAt: 1,
        rounds: 1,
        participants: 1,
        currentEligibleRank: 1
      })
      .sort({ completedAt: -1, startedAt: -1 })
      .lean();

      if (relevantAuctions.length > 0) {
        const auctionIds = relevantAuctions.map(a => a.hourlyAuctionId);

        // Fetch user histories for these auctions in ONE query
        const userHistories = await AuctionHistory.find({
          userId,
          hourlyAuctionId: { $in: auctionIds }
        })
        .select({
          hourlyAuctionId: 1,
          isWinner: 1,
          finalRank: 1,
          prizeClaimStatus: 1,
          completedAt: 1
        })
        .lean();

        if (userHistories.length > 0) {
          const historyMap = new Map(userHistories.map(h => [h.hourlyAuctionId, h]));

          for (const auction of relevantAuctions) {
            const userHistory = historyMap.get(auction.hourlyAuctionId);
            if (!userHistory) continue;

            let announcedAt = auction.completedAt || userHistory.completedAt;
            
            // If auction is LIVE, check for recently completed rounds
            if (auction.Status === 'LIVE') {
              const lastCompletedRound = (auction.rounds || [])
                .filter(r => r.status === 'COMPLETED')
                .sort((a, b) => b.roundNumber - a.roundNumber)[0];

              if (lastCompletedRound) {
                announcedAt = lastCompletedRound.completedAt;
              }
            }

            if (!announcedAt) continue;

            const announcedTime = new Date(announcedAt).getTime();
            const diffMs = Date.now() - announcedTime;

            // Only show banner for 45 minutes after result
            if (diffMs < 0 || diffMs > 45 * 60 * 1000) continue;

            let resultStatus = 'NOT_QUALIFIED';
            let queuePosition = 0;

            if (userHistory.isWinner) {
              const currentEligibleRank = auction.currentEligibleRank || 1;
              if (userHistory.finalRank === currentEligibleRank) {
                resultStatus = 'WIN';
              } else if (userHistory.finalRank > currentEligibleRank) {
                resultStatus = 'WAITING';
                queuePosition = userHistory.finalRank - currentEligibleRank;
              }
            } else if (auction.Status === 'LIVE') {
              const participant = auction.participants?.find(p => p.playerId === userId);
              if (participant && !participant.isEliminated) {
                resultStatus = 'QUALIFIED';
              }
            }

            // Prioritize WIN/WAITING statuses
            if (resultStatus === 'WIN' || resultStatus === 'WAITING') {
              bannerData = {
                roundId: auction.hourlyAuctionId,
                auctionId: auction.hourlyAuctionCode,
                auctionName: auction.auctionName,
                resultAnnouncedAt: announcedAt,
                userParticipated: true,
                resultStatus: resultStatus,
                queuePosition: queuePosition
              };
              break; 
            }

            // Fallback to QUALIFIED/NOT_QUALIFIED if nothing else found
            if (!bannerData) {
              bannerData = {
                roundId: auction.hourlyAuctionId,
                auctionId: auction.hourlyAuctionCode,
                auctionName: auction.auctionName,
                resultAnnouncedAt: announcedAt,
                userParticipated: true,
                resultStatus: resultStatus,
                queuePosition: queuePosition
              };
            }
          }
        }
      }
    }

    if (!liveAuction && !bannerData) {
      return res.status(404).json({
        success: false,
        message: 'No live hourly auction found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: liveAuction,
      bannerData: bannerData
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
    
    // Dynamically require to avoid circular dependency
    const { autoActivateAuctions } = require('../config/scheduler');
    
    // Execute the auto-activation logic
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
    const today = getISTDateStart();
    
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

    // ✅ NEW: Validate minimum bid for Round 1 must be at least the entry fee the user actually paid
    if (currentRound === 1) {
      const userPaidFee = participant.entryFee || auction.EntryFee || 10;
      if (auctionValue < userPaidFee) {
        return res.status(400).json({
          success: false,
          message: `Minimum bid for Round 1 is your entry fee (₹${userPaidFee})`,
        });
      }
    }
    
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
    
    // ✅ Sync bid data to DailyAuction
    const bidPlacedAt = new Date();
    try {
      await syncBidDataToDailyAuction(auction, currentRound, {
        playerId,
        playerUsername,
        auctionValue,
        placedAt: bidPlacedAt,
      }, {
        totalBidsPlaced: auction.participants[participantIndex].totalBidsPlaced,
        totalAmountBid: auction.participants[participantIndex].totalAmountBid,
      });
    } catch (syncError) {
      console.error('❌ [SYNC_BID] Error syncing bid to DailyAuction:', syncError);
    }
    
    console.log(`✅ [BID] Player ${playerUsername} placed bid of ₹${auctionValue} in round ${currentRound} for auction ${auction.hourlyAuctionCode}`);
    
    return res.status(200).json({
      success: true,
      message: `Your bid of ₹${auctionValue} has been placed successfully in Round ${currentRound}!`,
      data: {
        playerId,
        playerUsername,
        auctionValue: auctionValue,
        roundNumber: currentRound,
        placedAt: bidPlacedAt,
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
    
    // ✅ Sync user stats for all participants after auction completion
    console.log(`🔄 [SYNC_STATS] Syncing user stats for all participants...`);
    const participantIds = auction.participants?.map(p => p.playerId) || [];
    let syncCount = 0;
    for (const participantId of participantIds) {
      try {
        await syncUserStats(participantId);
        syncCount++;
      } catch (syncError) {
        console.error(`⚠️ [SYNC_STATS] Failed to sync stats for user ${participantId}:`, syncError.message);
      }
    }
    console.log(`✅ [SYNC_STATS] Synced stats for ${syncCount}/${participantIds.length} participants`);
    
    return res.status(200).json({
      success: true,
      message: 'Auction winners marked successfully in history',
      data: {
        hourlyAuctionId,
        hourlyAuctionCode: auction.hourlyAuctionCode,
        winnersMarked: winnersUpdated.length,
        nonWinnersMarked: nonWinnersUpdated.modifiedCount,
        totalParticipants,
        statsSynced: syncCount,
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
 * 
 * ✅ UPDATED: totalAmountSpent per auction is now calculated as:
 * - If NOT won: entryFee only
 * - If won but NOT claimed: entryFee only
 * - If won AND claimed: entryFee + lastRoundBidAmount (final round bid only)
 */
const getUserAuctionHistory = async (req, res) => {
  try {
    const { userId, limit } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    // ✅ Ensure priority claim queue is up to date before returning history
    await AuctionHistory.processClaimQueues();
    
    // Get user's history
    let history = await AuctionHistory.getUserHistory(userId);
    
    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        history = history.slice(0, limitNum);
      }
    }

    // Get user's statistics
    const stats = await AuctionHistory.getUserStats(userId);
    
    // ✅ OPTIMIZED: Fetch all relevant HourlyAuctions in ONE batch query (Fixes N+1 issue)
    const auctionIds = [...new Set(history.map(entry => entry.hourlyAuctionId))];
    const auctions = await HourlyAuction.find({ 
      hourlyAuctionId: { $in: auctionIds } 
    }).select({
      hourlyAuctionId: 1,
      winners: 1,
      Status: 1
    }).lean();

    const auctionMap = new Map(auctions.map(a => [a.hourlyAuctionId, a]));

    // ✅ UPDATED: Calculate correct totalAmountSpent for each auction entry
    // Logic: If won AND claimed, totalSpent = entryFee + lastRoundBidAmount
    //        Otherwise, totalSpent = entryFee only
    const enrichedHistory = history.map((entry) => {
      // Calculate correct totalSpent for this auction
      let calculatedTotalSpent = entry.entryFeePaid || 0;
      
      // Only add lastRoundBidAmount if user won AND claimed the prize
      if (entry.isWinner && entry.prizeClaimStatus === 'CLAIMED') {
        calculatedTotalSpent += (entry.lastRoundBidAmount || 0);
      }
      
      // ✅ NEW: Check if the auction is "Settled" (completely closed)
      let isSettled = false;
      const auction = auctionMap.get(entry.hourlyAuctionId);
      if (auction) {
        if (auction.winners && auction.winners.length > 0) {
          const hasClaimed = auction.winners.some(w => w.prizeClaimStatus === 'CLAIMED');
          const allExpired = auction.winners.every(w => w.prizeClaimStatus === 'EXPIRED');
          isSettled = hasClaimed || allExpired;
        } else if (auction.Status === 'COMPLETED') {
          // No winners found at all
          isSettled = true;
        }
      }
      
      return {
        ...entry,
        // Override totalAmountSpent with correct calculation
        totalAmountSpent: calculatedTotalSpent,
        isSettled,
        // Priority claim system fields
        currentEligibleRank: entry.currentEligibleRank || null,
        claimWindowStartedAt: entry.claimWindowStartedAt || null,
        ranksOffered: entry.ranksOffered || [],
      };
    });
    
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
 * 
 * ✅ UPDATED: totalAmountSpent is now calculated as:
 * - If NOT won: entryFee only
 * - If won but NOT claimed: entryFee only
 * - If won AND claimed: entryFee + lastRoundBidAmount (final round bid only)
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

    // ✅ Ensure claim queue advances instantly when a window expires
    await AuctionHistory.processClaimQueues();
    
    // Find the auction
    const auctionDoc = await HourlyAuction.findOne({ hourlyAuctionId }).lean();
    
    if (!auctionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }

    // ✅ Ensure winnersAnnounced flag is consistent with winners array
    const auction = {
      ...auctionDoc,
      winnersAnnounced: auctionDoc.winnersAnnounced || (auctionDoc.winners && auctionDoc.winners.length > 0)
    };
    
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
    
    // ✅ UPDATED: Calculate correct totalAmountSpent
    // Logic: If won AND claimed, totalSpent = entryFee + lastRoundBidAmount
    //        Otherwise, totalSpent = entryFee only
    let calculatedTotalSpent = userHistory.entryFeePaid || 0;
    if (userHistory.isWinner && userHistory.prizeClaimStatus === 'CLAIMED') {
      calculatedTotalSpent += (userHistory.lastRoundBidAmount || 0);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        hourlyAuction: auction, // Include full auction data for prize claim status checking
        auction: {
          hourlyAuctionId: auction.hourlyAuctionId,
          hourlyAuctionCode: auction.hourlyAuctionCode,
          auctionName: auction.auctionName,
          prizeValue: auction.prizeValue,
          status: auction.Status,
          timeSlot: auction.TimeSlot,
          totalParticipants: auction.participants?.length || 0,
          winnersAnnounced: auction.winnersAnnounced,
          winners: auction.winners || []
        },
        rounds: roundsData,
        userParticipation: {
          entryFeePaid: userHistory.entryFeePaid,
          totalAmountBid: userHistory.totalAmountBid,
          totalAmountSpent: calculatedTotalSpent, // ✅ Use correct calculation
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

/**
 * Get total data of a particular hourly auction by ID
 * GET /scheduler/hourly-auction/:hourlyAuctionId
 * Returns complete hourly auction data including participants, rounds, winners, etc.
 */
const getHourlyAuctionById = async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    
    if (!hourlyAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId is required',
      });
    }
    
    // Find the hourly auction by ID
    const auction = await HourlyAuction.findOne({ hourlyAuctionId }).lean();
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Hourly auction not found',
      });
    }
    
    // Calculate summary statistics
    const totalParticipants = auction.participants?.length || 0;
    const totalBids = auction.totalBids || 0;
    const totalWinners = auction.winners?.length || 0;
    
    // Calculate round statistics
    const roundStats = auction.rounds?.map(round => ({
      roundNumber: round.roundNumber,
      status: round.status,
      totalParticipants: round.playersData?.length || 0,
      qualifiedCount: round.qualifiedPlayers?.length || 0,
      highestBid: round.playersData?.length > 0 
        ? Math.max(...round.playersData.map(p => p.auctionPlacedAmount || 0)) 
        : 0,
      lowestBid: round.playersData?.length > 0 
        ? Math.min(...round.playersData.map(p => p.auctionPlacedAmount || 0)) 
        : 0,
      startedAt: round.startedAt,
      completedAt: round.completedAt,
    })) || [];
    
    // Calculate total revenue from entry fees
    const totalRevenue = totalParticipants * (auction.EntryFee || 0);
    
    // Calculate total prize amount distributed
    const totalPrizeDistributed = auction.winners?.reduce((sum, w) => sum + (w.prizeAmount || 0), 0) || 0;
    
    return res.status(200).json({
      success: true,
      data: auction,
      summary: {
        hourlyAuctionId: auction.hourlyAuctionId,
        hourlyAuctionCode: auction.hourlyAuctionCode,
        auctionName: auction.auctionName,
        status: auction.Status,
        timeSlot: auction.TimeSlot,
        auctionDate: auction.auctionDate,
        prizeValue: auction.prizeValue,
        entryFee: auction.EntryFee,
        totalParticipants,
        totalBids,
        totalWinners,
        totalRevenue,
        totalPrizeDistributed,
        currentRound: auction.currentRound,
        totalRounds: auction.roundCount,
        roundStats,
        winners: auction.winners || [],
        productDescription: auction.productDescription || {},
        startedAt: auction.startedAt,
        completedAt: auction.completedAt,
      },
    });
  } catch (error) {
    console.error('❌ [GET_HOURLY_AUCTION] Error fetching hourly auction:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get auction leaderboard for participants
 * GET /scheduler/auction-leaderboard
 * Returns leaderboard data for each round of an auction
 * Only accessible by users who participated in the auction
 */
const getAuctionLeaderboard = async (req, res) => {
  try {
    const { hourlyAuctionId, userId } = req.query;
    
    if (!hourlyAuctionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId and userId are required',
      });
    }
    
    // Find the hourly auction
    const auction = await HourlyAuction.findOne({ hourlyAuctionId }).lean();
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
      });
    }
    
    // Check if user participated in this auction (admins can bypass)
    const userParticipated = auction.participants?.some(p => p.playerId === userId);
    
    if (!userParticipated) {
      // Check if user is an admin
      const User = require('../models/user');
      const requestingUser = await User.findOne({ user_id: userId }).select('userType isSuperAdmin').lean();
      const isAdmin = requestingUser?.userType === 'ADMIN' || requestingUser?.isSuperAdmin;
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only participants can view the leaderboard.',
          isParticipant: false,
        });
      }
    }
    
    // Build leaderboard data for each round
    const roundLeaderboards = auction.rounds?.map(round => {
      // Sort players by bid amount (highest first) and then by time (earliest first for same amount)
      const sortedPlayers = [...(round.playersData || [])].sort((a, b) => {
        // First sort by auction amount (descending - highest first)
        if (b.auctionPlacedAmount !== a.auctionPlacedAmount) {
          return b.auctionPlacedAmount - a.auctionPlacedAmount;
        }
        // If same amount, sort by time (ascending - earliest first)
        return new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime();
      });
      
      // Assign ranks - same bid amount = same rank
      let currentRank = 1;
      const leaderboard = sortedPlayers.map((player, index) => {
        // If this player has same bid as previous, use same rank
        if (index > 0 && sortedPlayers[index - 1].auctionPlacedAmount === player.auctionPlacedAmount) {
          // Keep the same rank as previous player
        } else {
          // New rank = current position + 1
          currentRank = index + 1;
        }
        
        return {
          rank: currentRank,
          playerId: player.playerId,
          playerUsername: player.playerUsername,
          bidAmount: player.auctionPlacedAmount,
          bidTime: player.auctionPlacedTime,
          isQualified: player.isQualified,
          isCurrentUser: player.playerId === userId,
        };
      });
      
      return {
        roundNumber: round.roundNumber,
        status: round.status,
        totalParticipants: round.playersData?.length || 0,
        qualifiedCount: round.qualifiedPlayers?.length || 0,
        startedAt: round.startedAt,
        completedAt: round.completedAt,
        leaderboard,
      };
    }) || [];
    
    // Build winners list from AuctionHistory (source of truth) and merge prize amounts from hourly auction
    const historyWinners = await AuctionHistory.find({ hourlyAuctionId, isWinner: true }).lean();
    const hourlyWinnerByRank = new Map((auction.winners || []).map(w => [w.rank, w]));

    const winnersFromHistory = historyWinners
      .sort((a, b) => (a.finalRank || 0) - (b.finalRank || 0))
      .map(hw => {
        const hourlyWinner = hourlyWinnerByRank.get(hw.finalRank);
        const prizeAmount = hw.prizeAmountWon ?? hourlyWinner?.prizeAmount ?? 0;
        return {
          rank: hw.finalRank,
          playerId: hw.userId,
          playerUsername: hw.username,
          prizeAmount,
          prizeClaimStatus: hw.prizeClaimStatus || 'PENDING',
          isPrizeClaimed: hw.prizeClaimStatus === 'CLAIMED',
          prizeClaimedAt: hw.claimedAt || null,
          prizeClaimedBy: hw.claimedBy || null,
          claimNotes: hw.claimNotes || null,
          isCurrentUser: hw.userId === userId,
        };
      });

    // Get auction summary with prize claim info for winners
    const auctionSummary = {
      hourlyAuctionId: auction.hourlyAuctionId,
      hourlyAuctionCode: auction.hourlyAuctionCode,
      auctionName: auction.auctionName,
      auctionDate: auction.auctionDate,
      timeSlot: auction.TimeSlot,
      prizeValue: auction.prizeValue,
      imageUrl: auction.imageUrl,
      status: auction.Status,
      totalParticipants: auction.participants?.length || 0,
      totalRounds: auction.roundCount || 4,
      winners: winnersFromHistory.length > 0
        ? winnersFromHistory
        : (auction.winners || []).map(w => ({
            rank: w.rank,
            playerId: w.playerId,
            playerUsername: w.playerUsername,
            prizeAmount: w.prizeAmount,
            prizeClaimStatus: w.prizeClaimStatus || 'PENDING',
            isPrizeClaimed: w.prizeClaimStatus === 'CLAIMED' || w.isPrizeClaimed === true,
            prizeClaimedAt: w.prizeClaimedAt || null,
            prizeClaimedBy: w.prizeClaimedBy || w.claimedBy || null,
            claimNotes: w.claimNotes || null,
            isCurrentUser: w.playerId === userId,
          })),

    };
    
    return res.status(200).json({
      success: true,
      isParticipant: true,
      auction: auctionSummary,
      rounds: roundLeaderboards,
    });
  } catch (error) {
    console.error('❌ [GET_AUCTION_LEADERBOARD] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Check if user participated in a specific auction
 * GET /scheduler/check-participation
 * Quick check endpoint for frontend to determine if leaderboard button should be shown
 */
const checkAuctionParticipation = async (req, res) => {
  try {
    const { hourlyAuctionId, userId } = req.query;
    
    if (!hourlyAuctionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId and userId are required',
      });
    }
    
    // Find the hourly auction - only fetch participants array
    const auction = await HourlyAuction.findOne(
      { hourlyAuctionId },
      { participants: 1, hourlyAuctionId: 1 }
    ).lean();
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found',
        isParticipant: false,
      });
    }
    
    // Check if user participated
    const isParticipant = auction.participants?.some(p => p.playerId === userId);
    
    return res.status(200).json({
      success: true,
      isParticipant,
      hourlyAuctionId,
    });
  } catch (error) {
    console.error('❌ [CHECK_PARTICIPATION] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Force complete an auction with all its rounds
 * POST /scheduler/force-complete/:hourlyAuctionId
 * Used to manually complete an auction that should have finished
 */
const forceCompleteAuction = async (req, res) => {
  try {
    const { hourlyAuctionId } = req.params;
    
    if (!hourlyAuctionId) {
      return res.status(400).json({
        success: false,
        message: 'hourlyAuctionId is required',
      });
    }
    
    // Find the auction
    const auction = await HourlyAuction.findOne({ hourlyAuctionId });
    
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Hourly auction not found',
      });
    }
    
    console.log(`🔧 [FORCE-COMPLETE] Starting force completion for auction ${auction.hourlyAuctionCode} (${auction.TimeSlot})`);
    console.log(`   Current Status: ${auction.Status}, Current Round: ${auction.currentRound}`);
    
    const now = getISTTime();
    
    // Helper function to calculate ranks
    const calculateRanksAndQualified = (playersData) => {
      if (!playersData || playersData.length === 0) {
        return { rankedPlayers: [], qualifiedPlayerIds: [] };
      }
      
      const sortedPlayers = [...playersData].sort((a, b) => {
        if (b.auctionPlacedAmount !== a.auctionPlacedAmount) {
          return b.auctionPlacedAmount - a.auctionPlacedAmount;
        }
        return new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime();
      });
      
      const rankedPlayers = [];
      let currentRank = 1;
      let previousAmount = null;
      
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const plainPlayer = player.toObject ? player.toObject() : { ...player };
        
        if (previousAmount !== null && plainPlayer.auctionPlacedAmount !== previousAmount) {
          currentRank += 1;
        }
        
        previousAmount = plainPlayer.auctionPlacedAmount;
        
        rankedPlayers.push({
          ...plainPlayer,
          rank: currentRank,
          isQualified: currentRank <= 3,
        });
      }
      
      const qualifiedPlayerIds = rankedPlayers
        .filter(p => p.rank <= 3 && p.playerId)
        .map(p => String(p.playerId));
      
      return { rankedPlayers, qualifiedPlayerIds };
    };
    
    // Complete all rounds
    for (let i = 0; i < auction.rounds.length; i++) {
      const round = auction.rounds[i];
      
      if (round.status !== 'COMPLETED') {
        const { rankedPlayers, qualifiedPlayerIds } = calculateRanksAndQualified(round.playersData);
        
        auction.rounds[i].status = 'COMPLETED';
        auction.rounds[i].completedAt = auction.rounds[i].completedAt || now;
        auction.rounds[i].playersData = rankedPlayers;
        auction.rounds[i].qualifiedPlayers = qualifiedPlayerIds;
        auction.rounds[i].totalParticipants = rankedPlayers.length;
        
        console.log(`   ✓ Round ${round.roundNumber} completed: ${rankedPlayers.length} participants, ${qualifiedPlayerIds.length} qualified`);
      }
    }
    
    auction.markModified('rounds');
    
    // Calculate winners from round 4 (or last round with participants)
    let winners = [];
    const lastRoundWithPlayers = [...auction.rounds].reverse().find(r => r.playersData && r.playersData.length > 0);
    
    if (lastRoundWithPlayers) {
      // Get qualified players from the last round
      const qualifiedPlayers = lastRoundWithPlayers.qualifiedPlayers || [];
      
      // Build winners from qualified players
      for (let i = 0; i < Math.min(qualifiedPlayers.length, 3); i++) {
        const playerId = qualifiedPlayers[i];
        const playerData = lastRoundWithPlayers.playersData.find(p => String(p.playerId) === String(playerId));
        const participant = auction.participants?.find(p => String(p.playerId) === String(playerId));
        
        if (playerData) {
          winners.push({
            rank: i + 1,
            playerId: playerData.playerId,
            playerUsername: playerData.playerUsername,
            finalAuctionAmount: playerData.auctionPlacedAmount,
            totalAmountPaid: participant?.totalAmountBid || playerData.auctionPlacedAmount,
            prizeAmount: auction.prizeValue || 0,
            isPrizeClaimed: false,
            prizeClaimStatus: 'PENDING',
            prizeClaimedAt: null,
          });
          
          console.log(`   🏆 Winner ${i + 1}: ${playerData.playerUsername} - ₹${playerData.auctionPlacedAmount}`);
        }
      }
    }
    
    // Update auction
    auction.Status = 'COMPLETED';
    auction.completedAt = now;
    auction.currentRound = auction.roundCount || 4;
    
    if (winners.length > 0) {
      auction.winners = winners;
      auction.winnerId = winners[0].playerId;
      auction.winnerUsername = winners[0].playerUsername;
      auction.winningBid = winners[0].finalAuctionAmount;
      auction.winnersAnnounced = true;
      auction.markModified('winners');
    }
    
    await auction.save();
    
    // Sync status to dailyAuctionConfig
    const syncResult = await syncHourlyStatusToDailyConfig(hourlyAuctionId, 'COMPLETED');
    
    // Mark winners in auction history
    if (winners.length > 0) {
      const totalParticipants = auction.participants?.length || 0;
      await AuctionHistory.markWinners(hourlyAuctionId, winners, totalParticipants);
      await AuctionHistory.markNonWinners(hourlyAuctionId, totalParticipants);
    }
    
    console.log(`✅ [FORCE-COMPLETE] Auction ${auction.hourlyAuctionCode} completed successfully`);
    
    return res.status(200).json({
      success: true,
      message: `Auction ${auction.hourlyAuctionCode} force completed successfully`,
      data: {
        hourlyAuctionId: auction.hourlyAuctionId,
        hourlyAuctionCode: auction.hourlyAuctionCode,
        status: auction.Status,
        completedAt: auction.completedAt,
        winnersCount: winners.length,
        winners: winners.map(w => ({
          rank: w.rank,
          username: w.playerUsername,
          amount: w.finalAuctionAmount,
        })),
      },
      sync: syncResult,
    });
  } catch (error) {
    console.error('❌ [FORCE-COMPLETE] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Sync master auction config changes to daily and hourly auctions
 * POST /scheduler/sync-master-to-auctions
 * Syncs productImages, imageUrl, auctionName, prizeValue, etc. from master to existing daily/hourly auctions
 */
const syncMasterToAuctions = async (req, res) => {
  try {
    const { masterId } = req.body;
    
    if (!masterId) {
      return res.status(400).json({
        success: false,
        message: 'masterId is required',
      });
    }
    
    const masterAuction = await MasterAuction.findOne({ master_id: masterId });
    
    if (!masterAuction) {
      return res.status(404).json({
        success: false,
        message: 'Master auction not found',
      });
    }
    
    const todayIST = getISTDateStart();
    
    const dailyAuction = await DailyAuction.findOne({
      masterId,
      auctionDate: { $gte: todayIST },
      isActive: true,
    });
    
    if (!dailyAuction) {
      return res.status(404).json({
        success: false,
        message: 'No active daily auction found for this master auction',
      });
    }
    
    const syncResults = {
      dailyAuctionUpdated: false,
      hourlyAuctionsUpdated: 0,
      configsUpdated: [],
    };
    
    for (const masterConfig of masterAuction.dailyAuctionConfig) {
      const dailyConfigIndex = dailyAuction.dailyAuctionConfig.findIndex(
        dc => dc.auctionNumber === masterConfig.auctionNumber
      );
      
        if (dailyConfigIndex !== -1) {
          const dailyConfig = dailyAuction.dailyAuctionConfig[dailyConfigIndex];
          
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].productImages = masterConfig.productImages || [];
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].productDescription = masterConfig.productDescription || {};
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].imageUrl = masterConfig.imageUrl || dailyConfig.imageUrl;
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].auctionName = masterConfig.auctionName || dailyConfig.auctionName;
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].prizeValue = masterConfig.prizeValue ?? dailyConfig.prizeValue;
          dailyAuction.dailyAuctionConfig[dailyConfigIndex].maxDiscount = masterConfig.maxDiscount ?? dailyConfig.maxDiscount;
          
          const hourlyAuctionId = dailyConfig.hourlyAuctionId;
          
          if (hourlyAuctionId) {
            const hourlyAuction = await HourlyAuction.findOne({ hourlyAuctionId });
            
            if (hourlyAuction) {
              hourlyAuction.productImages = masterConfig.productImages || [];
              hourlyAuction.productDescription = masterConfig.productDescription || {};
              hourlyAuction.imageUrl = masterConfig.imageUrl || hourlyAuction.imageUrl;
              hourlyAuction.auctionName = masterConfig.auctionName || hourlyAuction.auctionName;
              hourlyAuction.prizeValue = masterConfig.prizeValue ?? hourlyAuction.prizeValue;
              hourlyAuction.maxDiscount = masterConfig.maxDiscount ?? hourlyAuction.maxDiscount;
              
              await hourlyAuction.save();
              syncResults.hourlyAuctionsUpdated++;
            }
          }
        
        syncResults.configsUpdated.push({
          auctionNumber: masterConfig.auctionNumber,
          auctionName: masterConfig.auctionName,
          productImagesCount: (masterConfig.productImages || []).length,
        });
      }
    }
    
    dailyAuction.markModified('dailyAuctionConfig');
    await dailyAuction.save();
    syncResults.dailyAuctionUpdated = true;
    
    console.log(`✅ [SYNC-MASTER] Synced master ${masterId} to daily/hourly auctions:`, syncResults);
    
    return res.status(200).json({
      success: true,
      message: 'Master auction changes synced to daily and hourly auctions successfully',
      data: {
        masterId,
        dailyAuctionId: dailyAuction.dailyAuctionId,
        ...syncResults,
      },
    });
  } catch (error) {
    console.error('❌ [SYNC-MASTER] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Get upcoming product with all images and descriptions
 * GET /scheduler/first-upcoming-product?hourlyAuctionId=xxx
 * If hourlyAuctionId is provided, returns that specific upcoming auction
 * If no parameter is provided, returns message indicating no upcoming auctions
 */
  const getFirstUpcomingProduct = async (req, res) => {
    try {
      const { hourlyAuctionId } = req.query;
      const todayIST = getISTDateStart();
      
      let upcomingAuction;

      if (hourlyAuctionId) {
        upcomingAuction = await HourlyAuction.findOne({
          hourlyAuctionId: hourlyAuctionId,
          Status: 'UPCOMING',
          auctionDate: { $gte: todayIST }
        }).lean();
      } else {
        // ✅ NEW: Follow logic of getHourlyAuctions to find the latest active daily auction first
        const latestDaily = await DailyAuction
          .findOne({ isActive: true })
          .sort({ createdAt: -1 });

        if (!latestDaily) {
          return res.status(200).json({
            success: false,
            message: 'No active daily auction found',
            data: null,
          });
        }

        // Find the first upcoming auction for this latest daily auction
        upcomingAuction = await HourlyAuction.findOne({
          dailyAuctionId: latestDaily.dailyAuctionId,
          Status: 'UPCOMING'
        })
        .sort({ TimeSlot: 1 })
        .lean();
      }
      
      if (!upcomingAuction) {
        return res.status(200).json({
          success: false,
          message: 'No upcoming auctions currently',
          data: null,
        });
      }


    // ✅ FETCH FRESH DATA FROM DAILY AUCTION SOURCE OF TRUTH
    // This ensures updates to Master/Daily auctions are reflected immediately
    try {
      const dailyAuction = await DailyAuction.findOne({ dailyAuctionId: upcomingAuction.dailyAuctionId }).lean();
      if (dailyAuction && dailyAuction.dailyAuctionConfig) {
        const freshConfig = dailyAuction.dailyAuctionConfig.find(
          c => c.auctionNumber === upcomingAuction.auctionNumber || c.hourlyAuctionId === upcomingAuction.hourlyAuctionId
        );
        
        if (freshConfig) {
          // Merge fresh config over the hourly auction data
          // Prioritize fields from dailyAuctionConfig which is the source of truth for product info
          upcomingAuction = {
            ...upcomingAuction,
            auctionName: freshConfig.auctionName || upcomingAuction.auctionName,
            prizeValue: freshConfig.prizeValue || upcomingAuction.prizeValue,
            imageUrl: freshConfig.imageUrl || upcomingAuction.imageUrl,
            productImages: freshConfig.productImages || upcomingAuction.productImages,
            productDescription: freshConfig.productDescription || upcomingAuction.productDescription,
            minSlotsCriteria: freshConfig.minSlotsCriteria || upcomingAuction.minSlotsCriteria,
            minSlotsValue: freshConfig.minSlotsValue || upcomingAuction.minSlotsValue,
            EntryFee: freshConfig.EntryFee || upcomingAuction.EntryFee,
            minEntryFee: freshConfig.minEntryFee || upcomingAuction.minEntryFee,
            maxEntryFee: freshConfig.maxEntryFee || upcomingAuction.maxEntryFee,
            FeeSplits: freshConfig.FeeSplits || upcomingAuction.FeeSplits,
            roundConfig: freshConfig.roundConfig || upcomingAuction.roundConfig,
            roundCount: freshConfig.roundCount || upcomingAuction.roundCount,
          };
        }
      }
    } catch (mergeError) {
      console.error('Error merging fresh daily auction data:', mergeError);
      // Continue with whatever we have in upcomingAuction if merge fails
    }
    
    return res.status(200).json({
      success: true,
      data: upcomingAuction,
    });
  } catch (error) {
    console.error('Error in getFirstUpcomingProduct:', error);
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
  getHourlyAuctionById,
  getAuctionLeaderboard,
  checkAuctionParticipation,
  forceCompleteAuction,
  getFirstUpcomingProduct,
  syncMasterToAuctions,
};