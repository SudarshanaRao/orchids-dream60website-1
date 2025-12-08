// src/config/scheduler.js 
const cron = require('node-cron');
const axios = require('axios');
const { midnightResetAndCreate, syncHourlyStatusToDailyConfig } = require('../controllers/schedulerController');
const HourlyAuction = require('../models/HourlyAuction');
const AuctionHistory = require('../models/AuctionHistory');
const mongoose = require('mongoose');

// External API endpoints
const SERVER_TIME_API = 'https://dev-api.dream60.com/utility/server-time';
const HOURLY_AUCTIONS_API = 'https://dev-api.dream60.com/scheduler/hourly-auctions';

/**
 * ✅ Helper function to get current IST time
 * Returns a Date object representing the current time in IST timezone
 */
const getISTTime = () => {
  // Get current UTC time
  const now = new Date();
  
  // IST is UTC+5:30 (5 hours and 30 minutes ahead)
  const istOffset = 5.5 * 60 * 60 * 1000; // milliseconds
  
  // Create IST time by adding offset to UTC
  const istTime = new Date(now.getTime() + istOffset);
  
  return istTime;
};

/**
 * Helper function to mark winners in AuctionHistory after auction completion
 * AND ensure all participants are recorded in auction history
 * @param {Object} auction - HourlyAuction document with winners populated
 */
const markWinnersInHistory = async (auction) => {
  try {
    console.log(`     📋 [HISTORY] Processing auction history for ${auction.hourlyAuctionCode}`);
    
    // ✅ CRITICAL FIX: Calculate total participants count from participants array
    const totalParticipants = auction.participants?.length || auction.totalParticipants || 0;
    console.log(`     👥 [HISTORY] Total participants in auction: ${totalParticipants}`);
    
    // STEP 1: Ensure ALL participants have auction history entries
    if (Array.isArray(auction.participants) && auction.participants.length > 0) {
      console.log(`     👥 [HISTORY] Ensuring history entries for ${auction.participants.length} participants`);
      
      for (const participant of auction.participants) {
        try {
          // Check if entry already exists
          const existingEntry = await AuctionHistory.findOne({
            userId: participant.playerId,
            hourlyAuctionId: auction.hourlyAuctionId,
          });
          
          if (!existingEntry) {
            // Create new entry for participant
            await AuctionHistory.createEntry({
              userId: participant.playerId,
              username: participant.playerUsername,
              hourlyAuctionId: auction.hourlyAuctionId,
              dailyAuctionId: auction.dailyAuctionId,
              auctionDate: auction.auctionDate,
              auctionName: auction.auctionName,
              prizeValue: auction.prizeValue,
              TimeSlot: auction.TimeSlot,
              entryFeePaid: participant.entryFee || 0,
            });
            console.log(`        ➕ [HISTORY] Created entry for ${participant.playerUsername}`);
          } else {
            // Update existing entry with latest participation data
            existingEntry.totalAmountBid = participant.totalAmountBid || 0;
            existingEntry.totalAmountSpent = (participant.entryFee || 0) + (participant.totalAmountBid || 0);
            existingEntry.roundsParticipated = participant.currentRound || 0;
            existingEntry.totalBidsPlaced = participant.totalBidsPlaced || 0;
            existingEntry.isEliminated = participant.isEliminated || false;
            existingEntry.eliminatedInRound = participant.eliminatedInRound || null;
            existingEntry.auctionStatus = 'IN_PROGRESS';
            await existingEntry.save();
            console.log(`        🔄 [HISTORY] Updated entry for ${participant.playerUsername}`);
          }
        } catch (error) {
          console.error(`        ❌ [HISTORY] Error creating/updating entry for ${participant.playerUsername}:`, error.message);
        }
      }
    }
    
    // STEP 2: Mark winners with prize claim details
    if (!auction.winners || auction.winners.length === 0) {
      console.log(`     ⚠️ [HISTORY] No winners to mark for auction ${auction.hourlyAuctionCode}`);
      
      // ✅ FIX: Pass totalParticipants to markNonWinners
      const nonWinnersResult = await AuctionHistory.markNonWinners(auction.hourlyAuctionId, totalParticipants);
      console.log(`     📊 [HISTORY] All participants marked as non-winners: ${nonWinnersResult.modifiedCount}`);
      console.log(`     👥 [HISTORY] Total participants passed: ${totalParticipants}`);
      
      return;
    }

    // ✅ FIX: Pass totalParticipants to markWinners
    const winnersMarked = await AuctionHistory.markWinners(auction.hourlyAuctionId, auction.winners, totalParticipants);
    
    // ✅ FIX: Pass totalParticipants to markNonWinners
    const nonWinnersResult = await AuctionHistory.markNonWinners(auction.hourlyAuctionId, totalParticipants);
    
    console.log(`     ✅ [HISTORY] Auction history updated for ${auction.hourlyAuctionCode}`);
    console.log(`        🏆 Winners marked: ${winnersMarked.length}`);
    console.log(`        📊 Non-winners marked: ${nonWinnersResult.modifiedCount}`);
    console.log(`        👥 Total participants recorded: ${totalParticipants}`);
  } catch (error) {
    console.error(`     ❌ [HISTORY] Error marking winners in history for ${auction.hourlyAuctionCode}:`, error);
  }
};

/**
 * Calculate ranks for players in a round and determine qualified players
 * @param {Array} playersData - Array of player bid data
 * @returns {Object} - { rankedPlayers, qualifiedPlayerIds }
 */
const calculateRanksAndQualified = (playersData) => {
  if (!playersData || playersData.length === 0) {
    return { rankedPlayers: [], qualifiedPlayerIds: [] };
  }

  // Sort players by auctionPlacedAmount (descending) and auctionPlacedTime (ascending for ties)
  const sortedPlayers = [...playersData].sort((a, b) => {
    if (b.auctionPlacedAmount !== a.auctionPlacedAmount) {
      return b.auctionPlacedAmount - a.auctionPlacedAmount;
    }
    // If amounts are equal, earlier timestamp gets priority
    return new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime();
  });

  // Assign ranks (handling ties without skipping ranks)
  const rankedPlayers = [];
  let currentRank = 1;
  let previousAmount = null;
  let playersWithSameRank = 0;

  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    
    // Convert to plain object if it's a Mongoose document
    const plainPlayer = player.toObject ? player.toObject() : { ...player };
    
    if (previousAmount !== null && plainPlayer.auctionPlacedAmount !== previousAmount) {
      // New bid amount, increment rank by 1 (not by playersWithSameRank)
      currentRank += 1;
      playersWithSameRank = 0;
    }
    
    playersWithSameRank++;
    previousAmount = plainPlayer.auctionPlacedAmount;
    
    rankedPlayers.push({
      ...plainPlayer,
      rank: currentRank,
      isQualified: currentRank <= 3, // Top 3 ranks are qualified
    });
  }

  // Extract qualified player IDs (top 3 ranks) - ensure we only get valid IDs
  const qualifiedPlayerIds = rankedPlayers
    .filter(p => p.rank <= 3 && p.playerId)
    .map(p => String(p.playerId));

  console.log(`     🔍 [RANK-DEBUG] Total players: ${rankedPlayers.length}, Qualified: ${qualifiedPlayerIds.length}`);
  console.log(`     🔍 [RANK-DEBUG] Qualified IDs:`, qualifiedPlayerIds);

  return { rankedPlayers, qualifiedPlayerIds };
};

/**
 * Eliminate participants who didn't place a bid in a round
 * @param {Object} auction - HourlyAuction document
 * @param {Number} roundNumber - The round that just completed
 * @param {Array} qualifiedFromPreviousRound - Player IDs who qualified for this round
 */
const eliminateNonBidders = (auction, roundNumber, qualifiedFromPreviousRound) => {
  // Get current round data
  const currentRound = auction.rounds.find(r => r.roundNumber === roundNumber);
  if (!currentRound) {
    console.log(`     ⚠️ [NO-BID-CHECK] Round ${roundNumber} not found`);
    return;
  }

  // Get player IDs who actually placed bids in this round
  const playerIdsWhoBid = new Set(
    (currentRound.playersData || []).map(p => String(p.playerId))
  );

  if (roundNumber === 1) {
    // ✅ FIXED: Round 1 - Eliminate ALL participants who joined (paid entry) but didn't place any bid
    if (!Array.isArray(auction.participants)) {
      console.log(`     ⚠️ [NO-BID-CHECK] No participants array found`);
      return;
    }

    // All participants in the array have paid entry fee (joining requires payment)
    const allParticipants = auction.participants;
    
    console.log(`     🔍 [NO-BID-CHECK] Round ${roundNumber}: ${allParticipants.length} participants joined, ${playerIdsWhoBid.size} actually bid`);

    // Find participants who joined but didn't bid
    const playersWhoDidNotBid = allParticipants.filter(
      participant => !playerIdsWhoBid.has(String(participant.playerId))
    );

    if (playersWhoDidNotBid.length === 0) {
      console.log(`     ✅ [NO-BID-CHECK] All participants placed bids in Round ${roundNumber}`);
      return;
    }

    // Eliminate these participants
    playersWhoDidNotBid.forEach(participant => {
      const participantIndex = auction.participants.findIndex(
        p => String(p.playerId) === String(participant.playerId)
      );
      
      if (participantIndex !== -1 && !auction.participants[participantIndex].isEliminated) {
        auction.participants[participantIndex].isEliminated = true;
        auction.participants[participantIndex].eliminatedInRound = roundNumber;
        
        console.log(`     ❌ [NO-BID-ELIMINATE] Player ${participant.playerUsername} (${participant.playerId}) eliminated in Round ${roundNumber} - Paid entry fee but no bid placed`);
      }
    });

    auction.markModified('participants');
    return;
  }

  // Rounds 2, 3, 4: Eliminate qualified players who didn't bid
  if (!Array.isArray(qualifiedFromPreviousRound) || qualifiedFromPreviousRound.length === 0) {
    console.log(`     ⚠️ [NO-BID-CHECK] No qualified players from previous round for Round ${roundNumber}`);
    return;
  }

  console.log(`     🔍 [NO-BID-CHECK] Round ${roundNumber}: ${qualifiedFromPreviousRound.length} qualified, ${playerIdsWhoBid.size} actually bid`);

  // Find players who qualified but didn't bid
  const playersWhoDidNotBid = qualifiedFromPreviousRound.filter(
    playerId => !playerIdsWhoBid.has(String(playerId))
  );

  if (playersWhoDidNotBid.length === 0) {
    console.log(`     ✅ [NO-BID-CHECK] All qualified players placed bids in Round ${roundNumber}`);
    return;
  }

  // Eliminate these players
  if (!Array.isArray(auction.participants)) {
    console.log(`     ⚠️ [NO-BID-CHECK] No participants array found`);
    return;
  }

  playersWhoDidNotBid.forEach(playerId => {
    const participantIndex = auction.participants.findIndex(
      p => String(p.playerId) === String(playerId)
    );
    
    if (participantIndex !== -1) {
      const participant = auction.participants[participantIndex];
      
      // Only eliminate if not already eliminated
      if (!participant.isEliminated) {
        auction.participants[participantIndex].isEliminated = true;
        auction.participants[participantIndex].eliminatedInRound = roundNumber;
        
        console.log(`     ❌ [NO-BID-ELIMINATE] Player ${participant.playerUsername} (${participant.playerId}) eliminated in Round ${roundNumber} - No bid placed`);
      }
    }
  });

  auction.markModified('participants');
};

/**
 * Calculate winners based on current qualified players (for early completion)
 * @param {Object} auction - HourlyAuction document
 * @param {Array} qualifiedPlayerIds - Array of qualified player IDs
 * @param {Number} completedRound - The round that was just completed
 * @returns {Array} - Winners with proper ranking
 */
const calculateEarlyWinners = (auction, qualifiedPlayerIds, completedRound) => {
  console.log(`🏆 [EARLY-WINNERS] Calculating winners after Round ${completedRound} (${qualifiedPlayerIds.length} qualified players)`);
  
  if (!qualifiedPlayerIds || qualifiedPlayerIds.length === 0) {
    console.log('⚠️ [EARLY-WINNERS] No qualified players found');
    return [];
  }

  // Get the completed round data
  const completedRoundData = auction.rounds.find(r => r.roundNumber === completedRound);
  if (!completedRoundData) {
    console.log('⚠️ [EARLY-WINNERS] Completed round data not found');
    return [];
  }

  // Calculate total bid amounts from all completed rounds for each qualified player
  const playerTotals = {};
  
  for (let roundNum = 1; roundNum <= completedRound; roundNum++) {
    const round = auction.rounds.find(r => r.roundNumber === roundNum);
    if (round && round.playersData) {
      round.playersData.forEach(player => {
        const playerId = String(player.playerId);
        // Only track qualified players
        if (qualifiedPlayerIds.includes(playerId)) {
          if (!playerTotals[playerId]) {
            playerTotals[playerId] = {
              playerId: player.playerId,
              playerUsername: player.playerUsername,
              totalAllRounds: 0,
              latestRank: null,
              latestBid: 0,
              latestTimestamp: null
            };
          }
          playerTotals[playerId].totalAllRounds += player.auctionPlacedAmount || 0;
          
          // Track latest round data
          if (roundNum === completedRound) {
            playerTotals[playerId].latestRank = player.rank;
            playerTotals[playerId].latestBid = player.auctionPlacedAmount || 0;
            playerTotals[playerId].latestTimestamp = player.auctionPlacedTime;
          }
        }
      });
    }
  }

  console.log(`     📊 [EARLY-WINNERS] Player totals calculated for ${Object.keys(playerTotals).length} qualified players`);

  // Convert to array and sort by: latest rank (ascending), then total bids (descending), then timestamp (ascending)
  const sortedPlayers = Object.values(playerTotals).sort((a, b) => {
    // Primary: Latest rank (lower rank number is better)
    if (a.latestRank !== b.latestRank) {
      return a.latestRank - b.latestRank;
    }
    // Secondary: Total bid amount (higher is better)
    if (b.totalAllRounds !== a.totalAllRounds) {
      return b.totalAllRounds - a.totalAllRounds;
    }
    // Tertiary: Timestamp (earlier is better)
    if (a.latestTimestamp && b.latestTimestamp) {
      return new Date(a.latestTimestamp).getTime() - new Date(b.latestTimestamp).getTime();
    }
    return 0;
  });
  
  // Create winners array (maximum 3)
  const winners = [];
  const maxWinners = Math.min(sortedPlayers.length, 3);
  
  for (let i = 0; i < maxWinners; i++) {
    const player = sortedPlayers[i];
    const participant = auction.participants.find(p => p.playerId === player.playerId);
    
    winners.push({
      rank: i + 1,
      playerId: player.playerId,
      playerUsername: player.playerUsername,
      finalAuctionAmount: player.latestBid,
      totalAmountPaid: participant ? participant.totalAmountBid : player.totalAllRounds,
      prizeAmount: auction.prizeValue || 0,
      isPrizeClaimed: false,
      prizeClaimedAt: null
    });
    
    console.log(`     🏅 [EARLY-WINNERS] Winner ${i + 1}: ${player.playerUsername} (Rank ${player.latestRank} in R${completedRound}) - Latest Bid: ₹${player.latestBid}, Total All Rounds: ₹${player.totalAllRounds}`);
  }

  console.log(`✅ [EARLY-WINNERS] Final winners: ${winners.length} winners after Round ${completedRound}`);
  
  return winners;
};

/**
 * Calculate winners for round 4 with tie-breaking logic
 * Priority: Round 4 rank first, then total bids from rounds 1-3
 * @param {Object} auction - HourlyAuction document
 * @returns {Array} - Top 3 winners with proper ranking
 */
const calculateRound4Winners = (auction) => {
  console.log('🏆 [WINNERS] Starting Round 4 winner calculation...');
  
  // Get round 4 data
  const round4 = auction.rounds.find(r => r.roundNumber === 4);
  if (!round4 || !round4.playersData || round4.playersData.length === 0) {
    console.log('⚠️ [WINNERS] No players found in Round 4');
    return [];
  }

  // Calculate total bid amounts from rounds 1-3 for each player
  const playerTotals = {};
  
  for (let roundNum = 1; roundNum <= 3; roundNum++) {
    const round = auction.rounds.find(r => r.roundNumber === roundNum);
    if (round && round.playersData) {
      round.playersData.forEach(player => {
        const playerId = player.playerId;
        if (!playerTotals[playerId]) {
          playerTotals[playerId] = {
            playerId: player.playerId,
            playerUsername: player.playerUsername,
            totalRounds1to3: 0,
            round4Bid: 0,
            round4Rank: null,
            round4Timestamp: null
          };
        }
        playerTotals[playerId].totalRounds1to3 += player.auctionPlacedAmount || 0;
      });
    }
  }

  // Add Round 4 data
  round4.playersData.forEach(player => {
    const playerId = player.playerId;
    if (!playerTotals[playerId]) {
      playerTotals[playerId] = {
        playerId: player.playerId,
        playerUsername: player.playerUsername,
        totalRounds1to3: 0,
        round4Bid: 0,
        round4Rank: null,
        round4Timestamp: null
      };
    }
    playerTotals[playerId].round4Bid = player.auctionPlacedAmount || 0;
    playerTotals[playerId].round4Rank = player.rank;
    playerTotals[playerId].round4Timestamp = player.auctionPlacedTime;
  });

  console.log(`     📊 [WINNERS] Player totals calculated for ${Object.keys(playerTotals).length} players`);

  // Group players by Round 4 rank
  const rankGroups = {
    1: [],
    2: [],
    3: []
  };

  Object.values(playerTotals).forEach(player => {
    if (player.round4Rank && player.round4Rank <= 3) {
      rankGroups[player.round4Rank].push(player);
    }
  });

  // Sort each rank group by totalRounds1to3 (descending) for tie-breaking
  Object.keys(rankGroups).forEach(rank => {
    rankGroups[rank].sort((a, b) => {
      if (b.totalRounds1to3 !== a.totalRounds1to3) {
        return b.totalRounds1to3 - a.totalRounds1to3;
      }
      // If still tied on total, use round 4 timestamp (earlier is better)
      if (a.round4Timestamp && b.round4Timestamp) {
        return new Date(a.round4Timestamp).getTime() - new Date(b.round4Timestamp).getTime();
      }
      return 0;
    });
  });

  console.log(`     🎯 [WINNERS] Rank 1: ${rankGroups[1].length} players, Rank 2: ${rankGroups[2].length} players, Rank 3: ${rankGroups[3].length} players`);

  // Build final top 3 winners with NEW LOGIC
  const winners = [];
  let winnersNeeded = 3;
  let currentWinnerRank = 1;

  // PRIORITY 1: Fill from Rank 1 (up to 3 winners)
  const rank1Count = Math.min(rankGroups[1].length, winnersNeeded);
  for (let i = 0; i < rank1Count; i++) {
    const winner = rankGroups[1][i];
    const participant = auction.participants.find(p => p.playerId === winner.playerId);
    
    winners.push({
      rank: currentWinnerRank++,
      playerId: winner.playerId,
      playerUsername: winner.playerUsername,
      finalAuctionAmount: winner.round4Bid,
      totalAmountPaid: participant ? participant.totalAmountBid : winner.totalRounds1to3 + winner.round4Bid,
      prizeAmount: auction.prizeValue || 0,
      isPrizeClaimed: false,
      prizeClaimedAt: null
    });
    
    console.log(`     🥇 [WINNERS] Winner ${winners.length}: ${winner.playerUsername} (Rank 1 in R4) - Round 4 Bid: ₹${winner.round4Bid}, Total R1-R3: ₹${winner.totalRounds1to3}`);
  }
  winnersNeeded -= rank1Count;

  // PRIORITY 2: If still need winners, fill from Rank 2
  if (winnersNeeded > 0 && rankGroups[2].length > 0) {
    const rank2Count = Math.min(rankGroups[2].length, winnersNeeded);
    for (let i = 0; i < rank2Count; i++) {
      const winner = rankGroups[2][i];
      const participant = auction.participants.find(p => p.playerId === winner.playerId);
      
      winners.push({
        rank: currentWinnerRank++,
        playerId: winner.playerId,
        playerUsername: winner.playerUsername,
        finalAuctionAmount: winner.round4Bid,
        totalAmountPaid: participant ? participant.totalAmountBid : winner.totalRounds1to3 + winner.round4Bid,
        prizeAmount: auction.prizeValue || 0,
        isPrizeClaimed: false,
        prizeClaimedAt: null
      });
      
      console.log(`     🥈 [WINNERS] Winner ${winners.length}: ${winner.playerUsername} (Rank 2 in R4) - Round 4 Bid: ₹${winner.round4Bid}, Total R1-R3: ₹${winner.totalRounds1to3}`);
    }
    winnersNeeded -= rank2Count;
  }

  // PRIORITY 3: If still need winners, fill from Rank 3
  if (winnersNeeded > 0 && rankGroups[3].length > 0) {
    const rank3Count = Math.min(rankGroups[3].length, winnersNeeded);
    for (let i = 0; i < rank3Count; i++) {
      const winner = rankGroups[3][i];
      const participant = auction.participants.find(p => p.playerId === winner.playerId);
      
      winners.push({
        rank: currentWinnerRank++,
        playerId: winner.playerId,
        playerUsername: winner.playerUsername,
        finalAuctionAmount: winner.round4Bid,
        totalAmountPaid: participant ? participant.totalAmountBid : winner.totalRounds1to3 + winner.round4Bid,
        prizeAmount: auction.prizeValue || 0,
        isPrizeClaimed: false,
        prizeClaimedAt: null
      });
      
      console.log(`     🥉 [WINNERS] Winner ${winners.length}: ${winner.playerUsername} (Rank 3 in R4) - Round 4 Bid: ₹${winner.round4Bid}, Total R1-R3: ₹${winner.totalRounds1to3}`);
    }
    winnersNeeded -= rank3Count;
  }

  console.log(`✅ [WINNERS] Final winners calculated: ${winners.length} winners`);
  console.log(`     📋 [WINNERS] Distribution: Rank 1=${rank1Count}, Rank 2=${Math.min(rankGroups[2].length, 3 - rank1Count)}, Rank 3=${Math.min(rankGroups[3].length, Math.max(0, 3 - rank1Count - Math.min(rankGroups[2].length, 3 - rank1Count)))}`);
  
  return winners;
};

/**
 * Fetch current server time from external API (preferred)
 * Returns: { hour, minute, second, timestamp, iso, date, time, timezone, utcOffset }
 */
const fetchServerTime = async () => {
  try {
    const response = await axios.get(SERVER_TIME_API, { timeout: 3000 });
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Invalid server time response');
  } catch (error) {
    console.error('❌ [SERVER-TIME] Failed to fetch server time:', error.message);
    // Fallback to local server time (converted to Asia/Kolkata if possible)
    const now = new Date();
    const hour = now.getUTCHours() + 5; // rough fallback if timezone not available
    const minute = now.getUTCMinutes();
    return {
      hour: (hour + 24) % 24,
      minute,
      second: now.getUTCSeconds(),
      timestamp: now.getTime(),
      iso: now.toISOString(),
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('en-GB', { hour12: false }),
      timezone: process.env.TIMEZONE || 'IST',
      utcOffset: '+05:30',
    };
  }
};

/**
 * Fetch hourly auctions from external API
 * Returns: Array of hourly auction objects
 */
const fetchHourlyAuctions = async () => {
  try {
    const response = await axios.get(HOURLY_AUCTIONS_API, { timeout: 4000 });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('❌ [HOURLY-AUCTIONS] Failed to fetch hourly auctions:', error.message);
    return [];
  }
};

/**
 * Helper: Parse "HH:MM" -> { hour: Number, minute: Number } or null
 */
const parseTimeSlot = (timeSlot) => {
  if (!timeSlot || typeof timeSlot !== 'string') return null;
  const parts = timeSlot.trim().split(':');
  if (parts.length !== 2) return null;
  const hh = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return { hour: hh, minute: mm };
};

/**
 * Core logic: Auto-activate auctions based on server time and external hourly-auctions list.
 */
const autoActivateAuctions = async () => {
  try {
    // 1) Get server time
    const serverTime = await fetchServerTime();
    const currentHour = Number(serverTime.hour);
    const currentMinute = Number(serverTime.minute);
    console.log(`⏰ [AUTO-ACTIVATE] Server Time: ${serverTime.time} (${serverTime.date}) - Hour: ${currentHour}, Minute: ${currentMinute}`);

    // Only operate between 9..20 (inclusive). 20 (8 PM slot) ends at 21:00.
    if (currentHour < 9 || currentHour >= 21) {
      console.log(`⏸️ [AUTO-ACTIVATE] Outside operating hours (9 AM - 9 PM). Current hour: ${currentHour}`);
      return;
    }

    // 2) Fetch external hourly auctions list
    const externalAuctions = await fetchHourlyAuctions();
    if (!externalAuctions || externalAuctions.length === 0) {
      console.log('⚠️ [AUTO-ACTIVATE] No hourly auctions returned by external API.');
      return;
    }
    console.log(`📋 [AUTO-ACTIVATE] External hourly auctions: ${externalAuctions.length}`);

    // Process each external auction sequentially (safe and predictable)
    for (const ext of externalAuctions) {
      try {
        if (!ext.hourlyAuctionId || !ext.TimeSlot) {
          console.log('  ⚠️ [AUTO-ACTIVATE] External auction missing hourlyAuctionId or TimeSlot, skipping:', ext);
          continue;
        }

        // parse TimeSlot
        const slot = parseTimeSlot(ext.TimeSlot);
        if (!slot) {
          console.log(`  ⚠️ [AUTO-ACTIVATE] Invalid TimeSlot format for auction ${ext.hourlyAuctionId}: "${ext.TimeSlot}"`);
          continue;
        }
        const slotHour = slot.hour;
        // We only support hourly slots (minute in timeslot expected 00), skip others
        if (slot.minute !== 0) {
          console.log(`  ⚠️ [AUTO-ACTIVATE] TimeSlot minute != 0 for ${ext.hourlyAuctionId} (${ext.TimeSlot}) — skipping automation for this item.`);
          continue;
        }

        // Only consider slots between 9 and 20 inclusive
        if (slotHour < 9 || slotHour > 20) {
          continue;
        }

        // Load or create local HourlyAuction
        let local = await HourlyAuction.findOne({ hourlyAuctionId: ext.hourlyAuctionId });
        if (!local) {
          // Create a minimal local representation so automation can manage it.
          const newDoc = {
            dailyAuctionId: ext.dailyAuctionId || null,
            masterId: ext.masterId || null,
            auctionDate: ext.auctionDate ? new Date(ext.auctionDate) : new Date(),
            auctionNumber: ext.auctionNumber || 0,
            hourlyAuctionId: ext.hourlyAuctionId,
            TimeSlot: ext.TimeSlot,
            auctionName: ext.auctionName || `Hourly ${ext.hourlyAuctionId}`,
            prizeValue: ext.prizeValue || 0,
            Status: 'UPCOMING',
            roundCount: ext.roundCount || 4,
            rounds: [],
            currentRound: 0,
            totalParticipants: 0,
            createdAt: getISTTime(), // ✅ Use IST time
            updatedAt: getISTTime(), // ✅ Use IST time
          };

          local = await HourlyAuction.create(newDoc);
          console.log(`  ➕ [AUTO-ACTIVATE] Created missing local auction doc for ${ext.hourlyAuctionId} (TimeSlot ${ext.TimeSlot})`);
        }

        // ✅ CRITICAL FIX: Skip auctions that are already COMPLETED
        // This prevents re-activating auctions that completed early (≤3 qualified players)
        if (local.Status === 'COMPLETED') {
          console.log(`  ⏭️ [AUTO-ACTIVATE] Skipping ${local.hourlyAuctionCode || local.hourlyAuctionId} - Already COMPLETED`);
          continue;
        }

        // ✅ Use IST timestamp for all updates
        const now = getISTTime(); // ✅ Use IST time consistently
        const previousStatus = local.Status;

        // CASE: server hour less than slot hour -> UPCOMING
        if (currentHour < slotHour) {
          if (local.Status !== 'UPCOMING') {
            local.Status = 'UPCOMING';
            local.currentRound = 0;
            // Ensure rounds exist (pending)
            if (!Array.isArray(local.rounds) || local.rounds.length === 0) {
              local.rounds = [];
              const rc = local.roundCount || 4;
              for (let r = 1; r <= rc; r++) {
                local.rounds.push({ roundNumber: r, status: 'PENDING', startedAt: null, completedAt: null });
              }
            } else {
              // mark future rounds as PENDING
              local.rounds = local.rounds.map(r => ({ ...r, status: 'PENDING' }));
            }
            local.updatedAt = now; // ✅ Use IST time
            await local.save();
            
            // Sync status to dailyAuctionConfig
            if (previousStatus !== 'UPCOMING') {
              await syncHourlyStatusToDailyConfig(local.hourlyAuctionId, 'UPCOMING');
            }
            
            console.log(`  ⏳ [AUTO-ACTIVATE] ${local.hourlyAuctionCode || local.hourlyAuctionId} -> UPCOMING (server ${currentHour} < slot ${slotHour})`);
          }
          continue;
        }

        // CASE: server hour greater than slot hour -> COMPLETED
        if (currentHour > slotHour) {
          if (local.Status !== 'COMPLETED') {
            local.Status = 'COMPLETED';
            local.completedAt = now; // ✅ Use IST time
            // mark all rounds completed with ranks
            local.rounds = (local.rounds && local.rounds.length > 0)
              ? local.rounds.map((r, idx) => {
                  if (r.status !== 'COMPLETED') {
                    // Calculate ranks and qualified players for this round
                    const { rankedPlayers, qualifiedPlayerIds } = calculateRanksAndQualified(r.playersData);
                    
                    // CRITICAL: Eliminate players who didn't bid AFTER EACH ROUND
                    if (r.roundNumber === 1) {
                      // Round 1: Check all paid participants
                      eliminateNonBidders(local, r.roundNumber, []);
                    } else if (idx > 0) {
                      // Rounds 2-4: Check qualified players from previous round
                      const previousRound = local.rounds[idx - 1];
                      const qualifiedFromPrevious = previousRound?.qualifiedPlayers || [];
                      eliminateNonBidders(local, r.roundNumber, qualifiedFromPrevious);
                    }
                    
                    // Update participants array - set isEliminated=true for non-qualified players
                    if (Array.isArray(local.participants)) {
                      rankedPlayers.forEach(playerData => {
                        if (playerData.isQualified === false) {
                          const participantIndex = local.participants.findIndex(p => p.playerId === playerData.playerId);
                          if (participantIndex !== -1) {
                            local.participants[participantIndex].isEliminated = true;
                            local.participants[participantIndex].eliminatedInRound = r.roundNumber;
                            console.log(`     ❌ [ELIMINATE] Player ${playerData.playerUsername} (${playerData.playerId}) eliminated in Round ${r.roundNumber}`);
                          }
                        }
                      });
                      local.markModified('participants');
                    }
                    
                    return {
                      ...r,
                      status: 'COMPLETED',
                      completedAt: r.completedAt || now, // ✅ Use IST time
                      playersData: rankedPlayers,
                      qualifiedPlayers: qualifiedPlayerIds,
                      totalParticipants: rankedPlayers.length,
                    };
                  }
                  return r;
                })
              : (() => {
                  const rc = local.roundCount || 4;
                  const arr = [];
                  for (let r = 1; r <= rc; r++) arr.push({ 
                    roundNumber: r, 
                    status: 'COMPLETED', 
                    startedAt: null, 
                    completedAt: now, // ✅ Use IST time
                    totalParticipants: 0,
                    qualifiedPlayers: [],
                    playersData: [],
                  });
                  return arr;
                })();
            local.currentRound = local.roundCount || local.rounds.length;
            
            // Calculate and add winners when auction is completed
            const winners = calculateRound4Winners(local);
            if (winners.length > 0) {
              local.winners = winners;
              // Set primary winner info
              local.winnerId = winners[0].playerId;
              local.winnerUsername = winners[0].playerUsername;
              local.winningBid = winners[0].finalAuctionAmount;
              local.markModified('winners');
              console.log(`     🏆 [WINNERS] Added ${winners.length} winners to auction ${local.hourlyAuctionCode}`);
              
              // ✅ NEW: Automatically mark winners in AuctionHistory
              await markWinnersInHistory(local);
            }
            
            local.updatedAt = now; // ✅ Use IST time
            await local.save();

            // Sync status to dailyAuctionConfig
            if (previousStatus !== 'COMPLETED') {
              await syncHourlyStatusToDailyConfig(local.hourlyAuctionId, 'COMPLETED');
            }
            
            console.log(`  ✅ [AUTO-ACTIVATE] ${local.hourlyAuctionCode || local.hourlyAuctionId} -> COMPLETED (server ${currentHour} > slot ${slotHour})`);
          }
          continue;
        }

        // CASE: server hour equals slot hour -> LIVE & manage rounds
        if (currentHour === slotHour) {
          // If auction not LIVE, mark LIVE and initialize rounds if needed
          let changed = false;
          if (local.Status !== 'LIVE') {
            local.Status = 'LIVE';
            local.startedAt = now; // ✅ Use IST time
            changed = true;

            // Ensure round entries exist
            if (!Array.isArray(local.rounds) || local.rounds.length === 0) {
              local.rounds = [];
              const rc = local.roundCount || 4;
              for (let r = 1; r <= rc; r++) {
                local.rounds.push({
                  roundNumber: r,
                  status: 'PENDING',
                  startedAt: null,
                  completedAt: null,
                  totalParticipants: 0,
                  playersData: [],
                  qualifiedPlayers: [],
                });
              }
            }
            
            // Sync status to dailyAuctionConfig
            if (previousStatus !== 'LIVE') {
              await syncHourlyStatusToDailyConfig(local.hourlyAuctionId, 'LIVE');
            }
            
            console.log(`  🎯 [AUTO-ACTIVATE] ${local.hourlyAuctionCode || local.hourlyAuctionId} -> LIVE (server ${currentHour} == slot ${slotHour})`);
          }

          // Determine which round should be active by minute
          let targetRound = 1;
          if (currentMinute >= 0 && currentMinute < 15) targetRound = 1;
          else if (currentMinute >= 15 && currentMinute < 30) targetRound = 2;
          else if (currentMinute >= 30 && currentMinute < 45) targetRound = 3;
          else if (currentMinute >= 45 && currentMinute < 60) targetRound = 4;
          else {
            // minute >= 60 (shouldn't happen) -> complete
            targetRound = local.roundCount || 4;
          }

          // Update rounds statuses
          const rc = local.roundCount || 4;
          let roundsUpdated = false;
          let round4JustCompleted = false;
          let shouldCompleteAuction = false;
          let earlyCompletionRound = null;
          
          for (let i = 0; i < rc; i++) {
            const rn = i + 1;
            // ensure array index exists
            if (!local.rounds[i]) {
              local.rounds[i] = { 
                roundNumber: rn, 
                status: 'PENDING', 
                startedAt: null, 
                completedAt: null,
                totalParticipants: 0,
                playersData: [],
                qualifiedPlayers: [],
              };
            }

            if (rn < targetRound) {
              // past rounds -> COMPLETED (with ranks calculation)
              if (local.rounds[i].status !== 'COMPLETED') {
                // Calculate ranks and qualified players when completing round
                const { rankedPlayers, qualifiedPlayerIds } = calculateRanksAndQualified(local.rounds[i].playersData);
                
                // CRITICAL: Eliminate players who didn't bid AFTER EACH ROUND
                if (rn === 1) {
                  // Round 1: Check all paid participants
                  eliminateNonBidders(local, rn, []);
                } else if (i > 0) {
                  // Rounds 2-4: Check qualified players from previous round
                  const previousRound = local.rounds[i - 1];
                  const qualifiedFromPrevious = previousRound?.qualifiedPlayers || [];
                  eliminateNonBidders(local, rn, qualifiedFromPrevious);
                }
                
                // Update round data directly on array element
                local.rounds[i].status = 'COMPLETED';
                local.rounds[i].completedAt = local.rounds[i].completedAt || now; // ✅ Use IST time
                local.rounds[i].playersData = rankedPlayers;
                local.rounds[i].qualifiedPlayers = qualifiedPlayerIds;
                local.rounds[i].totalParticipants = rankedPlayers.length;
                
                // Check if this is round 4 being completed
                if (rn === 4) {
                  round4JustCompleted = true;
                }
                
                // ✅ NEW: Check if qualified players <= 3 after round completion
                if (qualifiedPlayerIds.length > 0 && qualifiedPlayerIds.length <= 3) {
                  console.log(`     🎯 [EARLY-COMPLETE] Round ${rn} completed with ${qualifiedPlayerIds.length} qualified players (≤3) - Auction will be completed!`);
                  shouldCompleteAuction = true;
                  earlyCompletionRound = rn;
                }
                
                // Update participants array - set isEliminated=true for non-qualified players
                if (Array.isArray(local.participants)) {
                  rankedPlayers.forEach(playerData => {
                    if (playerData.isQualified === false) {
                      const participantIndex = local.participants.findIndex(p => p.playerId === playerData.playerId);
                      if (participantIndex !== -1) {
                        local.participants[participantIndex].isEliminated = true;
                        local.participants[participantIndex].eliminatedInRound = rn;
                        console.log(`     ❌ [ELIMINATE] Player ${playerData.playerUsername} (${playerData.playerId}) eliminated in Round ${rn}`);
                      }
                    }
                  });
                  local.markModified('participants');
                }
                
                // CRITICAL: Mark the rounds array as modified for Mongoose
                local.markModified('rounds');
                
                roundsUpdated = true;
                console.log(`     ✓ Round ${rn} marked COMPLETED for ${local.hourlyAuctionId} - ${rankedPlayers.length} participants, ${qualifiedPlayerIds.length} qualified`);
                console.log(`     ✓ Qualified player IDs:`, qualifiedPlayerIds);
              }
            } else if (rn === targetRound) {
              // current round -> ACTIVE
              if (local.rounds[i].status !== 'ACTIVE') {
                local.rounds[i].status = 'ACTIVE';
                local.rounds[i].startedAt = local.rounds[i].startedAt || now; // ✅ Use IST time
                local.markModified('rounds');
                roundsUpdated = true;
                if (rn === 1) {
                  console.log(`     🔔 Round ${rn} ACTIVE (joining allowed) for ${local.hourlyAuctionId} — minute ${currentMinute}`);
                } else {
                  console.log(`     🔔 Round ${rn} ACTIVE (joining closed) for ${local.hourlyAuctionId} — minute ${currentMinute}`);
                }
              }
            } else {
              // future rounds -> PENDING
              if (local.rounds[i].status !== 'PENDING') {
                local.rounds[i].status = 'PENDING';
                local.rounds[i].startedAt = null;
                local.rounds[i].completedAt = null;
                local.markModified('rounds');
                roundsUpdated = true;
              }
            }
          }

          // ✅ NEW: If qualified players <= 3, complete auction immediately
          if (shouldCompleteAuction && local.Status === 'LIVE') {
            console.log(`     🎯 [EARLY-COMPLETE] Announcing winners after Round ${earlyCompletionRound} with ${local.rounds[earlyCompletionRound - 1].qualifiedPlayers.length} qualified players`);
            
            // ✅ CRITICAL: Set winnersAnnounced flag instead of completing auction
            local.winnersAnnounced = true;
            local.markModified('winnersAnnounced');
            
            // Complete all remaining rounds (mark as COMPLETED but keep auction LIVE)
            for (let i = earlyCompletionRound; i < local.rounds.length; i++) {
              if (local.rounds[i].status !== 'COMPLETED') {
                local.rounds[i].status = 'COMPLETED';
                local.rounds[i].completedAt = now; // ✅ Use IST time
                local.markModified('rounds');
              }
            }
            
            local.currentRound = earlyCompletionRound;
            
            // Calculate winners from early completion
            const qualifiedPlayers = local.rounds[earlyCompletionRound - 1].qualifiedPlayers;
            const winners = calculateEarlyWinners(local, qualifiedPlayers, earlyCompletionRound);
            
            if (winners.length > 0) {
              local.winners = winners;
              local.winnerId = winners[0].playerId;
              local.winnerUsername = winners[0].playerUsername;
              local.winningBid = winners[0].finalAuctionAmount;
              local.markModified('winners');
              console.log(`     🏆 [EARLY-COMPLETE] Added ${winners.length} winners after Round ${earlyCompletionRound} early completion`);
              
              // ✅ NEW: Automatically mark winners in AuctionHistory
              await markWinnersInHistory(local);
            }
            
            roundsUpdated = true;
            
            // ✅ CRITICAL: Do NOT set status to COMPLETED - keep as LIVE
            // ✅ CRITICAL: Do NOT sync status to dailyAuctionConfig yet
            console.log(`     ✅ [EARLY-COMPLETE] Winners announced but auction remains LIVE until hour ends`);
          }
          // If round 4 just completed normally, calculate winners
          else if (round4JustCompleted && local.winners.length === 0) {
            const winners = calculateRound4Winners(local);
            if (winners.length > 0) {
              local.winners = winners;
              // Set primary winner info
              local.winnerId = winners[0].playerId;
              local.winnerUsername = winners[0].playerUsername;
              local.winningBid = winners[0].finalAuctionAmount;
              local.markModified('winners');
              roundsUpdated = true;
              console.log(`     🏆 [WINNERS] Added ${winners.length} winners after Round 4 completion`);
              
              // ✅ NEW: Automatically mark winners in AuctionHistory
              await markWinnersInHistory(local);
            }
          }

          // If minute >= 60 (or edge case after 59) treat as auction COMPLETED
          if (currentMinute >= 60) {
            if (local.Status !== 'COMPLETED') {
              local.Status = 'COMPLETED';
              local.completedAt = now; // ✅ Use IST time
              // Complete all remaining rounds
              for (let i = 0; i < local.rounds.length; i++) {
                if (local.rounds[i].status !== 'COMPLETED') {
                  const { rankedPlayers, qualifiedPlayerIds } = calculateRanksAndQualified(local.rounds[i].playersData);
                  
                  // CRITICAL: Eliminate players who didn't bid AFTER EACH ROUND
                  if (local.rounds[i].roundNumber === 1) {
                    // Round 1: Check all paid participants
                    eliminateNonBidders(local, local.rounds[i].roundNumber, []);
                  } else if (i > 0) {
                    // Rounds 2-4: Check qualified players from previous round
                    const previousRound = local.rounds[i - 1];
                    const qualifiedFromPrevious = previousRound?.qualifiedPlayers || [];
                    eliminateNonBidders(local, local.rounds[i].roundNumber, qualifiedFromPrevious);
                  }
                  
                  // Update participants array - set isEliminated=true for non-qualified players
                  if (Array.isArray(local.participants)) {
                    rankedPlayers.forEach(playerData => {
                      if (playerData.isQualified === false) {
                        const participantIndex = local.participants.findIndex(p => p.playerId === playerData.playerId);
                        if (participantIndex !== -1) {
                          local.participants[participantIndex].isEliminated = true;
                          local.participants[participantIndex].eliminatedInRound = local.rounds[i].roundNumber;
                          console.log(`     ❌ [ELIMINATE] Player ${playerData.playerUsername} (${playerData.playerId}) eliminated in Round ${local.rounds[i].roundNumber}`);
                        }
                      }
                    });
                    local.markModified('participants');
                  }
                  
                  local.rounds[i].status = 'COMPLETED';
                  local.rounds[i].completedAt = local.rounds[i].completedAt || now; // ✅ Use IST time
                  local.rounds[i].playersData = rankedPlayers;
                  local.rounds[i].qualifiedPlayers = qualifiedPlayerIds;
                  local.rounds[i].totalParticipants = rankedPlayers.length;
                }
              }
              local.markModified('rounds');
              local.currentRound = local.roundCount || local.rounds.length;
              
              // Calculate winners when auction completes
              if (local.winners.length === 0) {
                const winners = calculateRound4Winners(local);
                if (winners.length > 0) {
                  local.winners = winners;
                  // Set primary winner info
                  local.winnerId = winners[0].playerId;
                  local.winnerUsername = winners[0].playerUsername;
                  local.winningBid = winners[0].finalAuctionAmount;
                  local.markModified('winners');
                  console.log(`     🏆 [WINNERS] Added ${winners.length} winners on auction completion`);
                  
                  // ✅ NEW: Automatically mark winners in AuctionHistory
                  await markWinnersInHistory(local);
                }
              }
              
              roundsUpdated = true;
              
              // Sync status to dailyAuctionConfig
              await syncHourlyStatusToDailyConfig(local.hourlyAuctionId, 'COMPLETED');
              
              console.log(`  ✅ Auction ${local.hourlyAuctionId} completed (minute >= 60 edge case)`);
            }
          } else {
            // update currentRound (only if not completing early)
            if (!shouldCompleteAuction && local.currentRound !== targetRound) {
              local.currentRound = targetRound;
              roundsUpdated = true;
            }
          }

          if (changed || roundsUpdated) {
            local.updatedAt = now; // ✅ Use IST time
            await local.save();
          }
        }
      } catch (innerErr) {
        console.error('❌ [AUTO-ACTIVATE] Error processing external auction item:', innerErr.message, innerErr.stack);
      }
    }

    console.log(`✅ [AUTO-ACTIVATE] Processing completed at ${serverTime.time}`);
  } catch (err) {
    console.error('❌ [AUTO-ACTIVATE] Fatal error:', err.message, err.stack);
  }
};

/**
 * Initialize scheduled jobs
 */
const initializeScheduler = () => {
  console.log('⏰ [SCHEDULER] Initializing scheduled jobs...');
  console.log(`⏰ [SCHEDULER] Timezone: ${process.env.TIMEZONE || 'Asia/Kolkata'}`);

  // Job 1: Midnight reset and creation at 00:00 AM every day
  const midnightJob = cron.schedule('0 0 * * *', async () => {
    console.log('🌙 [SCHEDULER] Running midnight reset and creation job...');
    try {
      await midnightResetAndCreate();
    } catch (err) {
      console.error('❌ [SCHEDULER] midnightResetAndCreate failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  // Job 2: Auto-activate auctions every minute
  const statusUpdateJob = cron.schedule('* * * * *', async () => {
    await autoActivateAuctions();
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  // Job 3: Expire unclaimed prizes and process claim queues every minute
  const prizeExpirationJob = cron.schedule('* * * * *', async () => {
    try {
      // First, expire any prizes past their 30-minute deadline
      await AuctionHistory.expireUnclaimedPrizes();
      
      // Then, process claim queues to advance to next rank if needed
      await AuctionHistory.processClaimQueues();
    } catch (err) {
      console.error('❌ [SCHEDULER] Prize expiration/queue processing failed:', err.message);
    }
  }, {
    scheduled: true,
    timezone: process.env.TIMEZONE || 'Asia/Kolkata',
  });

  console.log('✅ [SCHEDULER] Jobs scheduled:');
  console.log('   - midnightJob: Runs at 00:00 AM daily (reset old auctions + create new ones)');
  console.log('   - statusUpdateJob: Runs every minute (auto-activate auctions)');
  console.log('   - prizeExpirationJob: Runs every minute (expire unclaimed prizes + advance claim queue)');
  
  return {
    midnightJob,
    statusUpdateJob,
    prizeExpirationJob,
  };
};

/**
 * Stop scheduled jobs
 */
const stopScheduler = (jobs) => {
  console.log('🛑 [SCHEDULER] Stopping all scheduled jobs...');
  if (jobs.midnightJob) jobs.midnightJob.stop();
  if (jobs.statusUpdateJob) jobs.statusUpdateJob.stop();
  if (jobs.prizeExpirationJob) jobs.prizeExpirationJob.stop();
  console.log('✅ [SCHEDULER] All scheduled jobs stopped');
};

module.exports = {
  initializeScheduler,
  stopScheduler,
  autoActivateAuctions,
};