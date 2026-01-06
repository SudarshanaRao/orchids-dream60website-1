# Auction History System - Implementation Guide

## Overview
The Auction History system tracks user participation in auctions and accurately marks winners. This guide explains the complete implementation, including the duplicate key error fix.

---

## ✅ What Was Implemented 

### 1. **AuctionHistory Model** (`src/models/AuctionHistory.js`)
A new MongoDB collection that tracks individual user participation in auctions.

**Key Features:**
- Tracks user participation from join to completion
- **ONLY marks actual winners (rank 1-3) with `isWinner: true`**
- Tracks spending, bidding, and prize winnings
- Prevents duplicate entries with compound unique index
- Provides aggregated statistics

**Schema Fields:**
```javascript
{
  userId: String,              // User's UUID
  username: String,            // Username
  hourlyAuctionId: String,     // Auction UUID
  entryFeePaid: Number,        // Entry fee amount
  totalAmountBid: Number,      // Sum of all bids
  totalAmountSpent: Number,    // Entry fee + bids
  isWinner: Boolean,           // ✅ TRUE ONLY for rank 1-3
  finalRank: Number,           // 1-3 for winners, null for others
  prizeAmountWon: Number,      // Prize amount (0 for non-winners)
  auctionStatus: String,       // JOINED, IN_PROGRESS, COMPLETED
  // ... more fields
}
```

---

### 2. **Duplicate Key Error Fix** (Scheduler Controller)

**Problem:** 
When creating daily auctions at midnight, the scheduler was reusing `auctionId` from the master auction config, causing duplicate key errors on subsequent creations.

**Solution:**
```javascript
// ✅ FIXED: Generate NEW unique auctionId for each config
const dailyAuctionConfigForToday = activeMasterAuction.dailyAuctionConfig.map(config => {
  const configObj = config.toObject ? config.toObject() : { ...config };
  return {
    ...configObj,
    auctionId: uuidv4(), // ✅ Generate NEW UUID for each config entry
    Status: 'UPCOMING',
    isAuctionCompleted: false,
    completedAt: null,
    topWinners: [],
    hourlyAuctionId: null,
  };
});
```

**Why This Works:**
- Each daily auction config entry gets a fresh UUID
- No collision with previous day's auction IDs
- Ensures unique identification across all auctions

---

### 3. **Winner Marking API** (`POST /scheduler/mark-winners/:hourlyAuctionId`)

Marks ONLY actual winners in auction history after auction completion.

**Endpoint:**
```
POST /api/v1/scheduler/mark-winners/:hourlyAuctionId
```

**What It Does:**
1. Finds the completed auction
2. Validates auction has winners
3. **Marks ONLY users in winners array (rank 1-3) with `isWinner: true`**
4. Updates their `finalRank` and `prizeAmountWon`
5. Marks all other participants as completed with `isWinner: false`

**Example Request:**
```bash
curl -X POST https://dev-api.dream60.com/scheduler/mark-winners/abc123-def456-...
```

**Example Response:**
```json
{
  "success": true,
  "message": "Auction winners marked successfully in history",
  "data": {
    "hourlyAuctionId": "abc123-def456-...",
    "hourlyAuctionCode": "HA000001",
    "winnersMarked": 3,
    "nonWinnersMarked": 47,
    "winners": [
      {
        "userId": "user-123",
        "username": "john_doe",
        "rank": 1,
        "prizeWon": 10000
      },
      {
        "userId": "user-456",
        "username": "jane_smith",
        "rank": 2,
        "prizeWon": 5000
      },
      {
        "userId": "user-789",
        "username": "bob_wilson",
        "rank": 3,
        "prizeWon": 2500
      }
    ]
  }
}
```

---

## 📊 Usage Flow

### Complete Auction History Workflow

```
1. User Joins Auction (Pay Entry Fee)
   ↓
   [Create AuctionHistory entry with status: JOINED]
   
2. User Places Bids
   ↓
   [Update AuctionHistory: totalAmountBid, totalBidsPlaced, status: IN_PROGRESS]
   
3. Auction Completes
   ↓
   [Scheduler determines winners and updates HourlyAuction.winners array]
   
4. Mark Winners API Called
   ↓
   [Update AuctionHistory: isWinner=true for rank 1-3, isWinner=false for others]
   
5. User Views History
   ↓
   [Frontend fetches /scheduler/user-auction-history?userId=xxx]
```

---

## 🔌 API Endpoints

### 1. Mark Winners (After Auction Completion)

**Endpoint:**
```
POST /api/v1/scheduler/mark-winners/:hourlyAuctionId
```

**When to Call:**
- After auction status is set to COMPLETED
- After HourlyAuction.winners array is populated
- Can be triggered automatically by scheduler or manually

**Requirements:**
- Auction must have status COMPLETED
- Auction must have winners array with rank 1-3

---

### 2. Get User Auction History

**Endpoint:**
```
GET /api/v1/scheduler/user-auction-history?userId={userId}
```

**Query Parameters:**
- `userId` (required): User's UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user-123",
      "username": "john_doe",
      "hourlyAuctionId": "auction-abc",
      "auctionName": "Dream Auction 1",
      "prizeValue": 10000,
      "isWinner": true,           // ✅ TRUE only if user won
      "finalRank": 1,              // 1-3 for winners, null for others
      "prizeAmountWon": 10000,     // 0 for non-winners
      "totalAmountSpent": 2500,
      "totalBidsPlaced": 4,
      "auctionDate": "2025-12-01T00:00:00.000Z"
    }
    // ... more entries
  ],
  "stats": {
    "totalAuctions": 50,
    "totalWins": 5,
    "totalLosses": 45,
    "totalSpent": 25000,
    "totalWon": 50000,
    "winRate": 10,                // Win percentage
    "netGain": 25000              // Total won - total spent
  }
}
```

---

## 🔄 Integration Steps

### Step 1: Create History Entry on Auction Join

When user pays entry fee and joins an auction, create an auction history entry:

```javascript
const AuctionHistory = require('../models/AuctionHistory');

// After successful entry fee payment
await AuctionHistory.createEntry({
  userId: user.userId,
  username: user.username,
  hourlyAuctionId: auction.hourlyAuctionId,
  dailyAuctionId: auction.dailyAuctionId,
  auctionDate: auction.auctionDate,
  auctionName: auction.auctionName,
  prizeValue: auction.prizeValue,
  TimeSlot: auction.TimeSlot,
  entryFeePaid: entryFeeAmount,
});
```

### Step 2: Update History on Bid Placement

The `placeBid` endpoint now automatically updates auction history:

```javascript
// Already integrated in placeBid controller
await AuctionHistory.updateBidInfo(playerId, hourlyAuctionId, {
  bidAmount: auctionValue,
  isFirstBidInRound: true, // or false
});
```

### Step 3: Mark Winners After Auction Completion

Call the mark-winners endpoint after auction completes:

**Option A: Manual Trigger**
```bash
curl -X POST https://dev-api.dream60.com/scheduler/mark-winners/{hourlyAuctionId}
```

**Option B: Automated (in scheduler)**
```javascript
// After auction completion and winner calculation
if (auction.Status === 'COMPLETED' && auction.winners.length > 0) {
  await markAuctionWinnersInternal(auction.hourlyAuctionId);
}
```

### Step 4: Display User History in Frontend

Fetch and display user's auction history:

```javascript
// Fetch history
const response = await fetch(
  `https://dev-api.dream60.com/scheduler/user-auction-history?userId=${userId}`
);
const { data, stats } = await response.json();

// Display in UI
data.forEach(auction => {
  if (auction.isWinner) {
    // Show winner badge, rank, prize won
  } else {
    // Show participation info
  }
});
```

---

## 🔍 Testing the Implementation

### Test 1: Duplicate Key Error Fix

```bash
# Run midnight reset twice in a row
curl -X POST https://dev-api.dream60.com/scheduler/midnight-reset

# Wait a few seconds, then run again
curl -X POST https://dev-api.dream60.com/scheduler/midnight-reset

# ✅ Should succeed both times without duplicate key error
```

### Test 2: Winner Marking

```bash
# 1. Complete an auction (manually set status)
curl -X PATCH https://dev-api.dream60.com/scheduler/hourly-auctions/{auctionId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# 2. Mark winners
curl -X POST https://dev-api.dream60.com/scheduler/mark-winners/{auctionId}

# 3. Check user history
curl https://dev-api.dream60.com/scheduler/user-auction-history?userId={userId}

# ✅ Verify isWinner is true only for actual winners (rank 1-3)
```

### Test 3: User History

```bash
# Get user's complete auction history
curl https://dev-api.dream60.com/scheduler/user-auction-history?userId={userId}

# ✅ Verify:
# - Only actual winners have isWinner: true
# - Non-winners have isWinner: false
# - Statistics are calculated correctly
# - All auctions are sorted by date (newest first)
```

---

## 📝 Database Indexes

The AuctionHistory model includes these indexes:

```javascript
// Prevent duplicate entries
{ userId: 1, hourlyAuctionId: 1 } - unique

// Query user's history efficiently
{ userId: 1, auctionDate: -1 }

// Query winners efficiently
{ isWinner: 1, finalRank: 1 }
```

---

## 🚨 Important Notes

### Critical Rules:
1. **✅ `isWinner: true` is set ONLY for users with rank 1, 2, or 3**
2. **✅ All other participants get `isWinner: false`**
3. **✅ Always generate new UUIDs when creating daily auctions**
4. **✅ Call mark-winners endpoint only after auction is COMPLETED**
5. **✅ Auction history is immutable once auction is completed**

### Data Consistency:
- AuctionHistory entries should match HourlyAuction.participants
- Winner information should match HourlyAuction.winners array
- Ensure history is updated when bids are placed
- Always check auction status before marking winners

---

## 🎯 Summary

### Problems Solved:
1. ✅ **Duplicate Key Error**: Fixed by generating new UUIDs for each daily auction config
2. ✅ **Winner Tracking**: Only actual winners (rank 1-3) marked with isWinner: true
3. ✅ **Auction History**: Complete participation tracking from join to completion

### New Features:
1. ✅ AuctionHistory model for tracking user participation
2. ✅ `/scheduler/mark-winners/:hourlyAuctionId` - Mark actual winners
3. ✅ `/scheduler/user-auction-history?userId=xxx` - Get user's history
4. ✅ Automatic bid tracking integration
5. ✅ Aggregated user statistics (wins, losses, spending, etc.)

### Next Steps:
1. Integrate AuctionHistory.createEntry() when users join auctions
2. Test the duplicate key fix during midnight resets
3. Automate winner marking in scheduler after auction completion
4. Update frontend to display user auction history from new endpoint
5. Add monitoring for auction history creation and updates

---

## 📞 Support

For questions or issues:
- Check server logs for detailed error messages
- Verify auction status before marking winners
- Ensure all required fields are present in API requests
- Test with small datasets before production deployment
