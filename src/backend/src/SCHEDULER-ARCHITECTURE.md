# Auction Scheduler Architecture 

## Overview

This document describes the complete auction scheduling system with three levels of auctions: **MasterAuction**, **DailyAuction**, and **HourlyAuction**.

## Architecture

```
MasterAuction (1)
    ↓ (Every day at 11:00 AM)
DailyAuction (1 per day)
    ↓ (Immediately after DailyAuction creation)
HourlyAuction (N per day, based on dailyAuctionConfig array length)
```

## Models

### 1. MasterAuction
**Purpose**: Template configuration for all auctions
**Created**: Manually by admin
**Count**: 1 active at a time
**Location**: `src/models/masterAuction.js`

**Key Fields**:
- `master_id`: Unique UUID
- `isActive`: Boolean (only 1 should be active)
- `totalAuctionsPerDay`: Number of auctions per day
- `dailyAuctionConfig`: Array of auction configurations

**Example**:
```javascript
{
  master_id: "uuid-123",
  isActive: true,
  totalAuctionsPerDay: 24,
  dailyAuctionConfig: [
    {
      auctionNumber: 1,
      TimeSlot: "09:00",
      auctionName: "Morning iPhone Auction",
      prizeValue: 80000,
      // ... all other fields
    },
    {
      auctionNumber: 2,
      TimeSlot: "10:00",
      // ... config for second auction
    },
    // ... 22 more configs
  ]
}
```

### 2. DailyAuction
**Purpose**: Complete replica of MasterAuction for a specific day
**Created**: Automatically at 11:00 AM daily by scheduler
**Count**: 1 per day
**Location**: `src/models/DailyAuction.js`

**Key Fields**:
- `dailyAuctionId`: Unique UUID
- `masterId`: Reference to MasterAuction
- `auctionDate`: Date (start of day)
- `dailyAuctionConfig`: Complete copy from MasterAuction
- `totalAuctionsPerDay`: Copied from MasterAuction
- `Status`: ACTIVE, COMPLETED, CANCELLED

**Example**:
```javascript
{
  dailyAuctionId: "uuid-456",
  masterId: "uuid-123",
  auctionDate: "2024-01-15T00:00:00.000Z",
  totalAuctionsPerDay: 24,
  dailyAuctionConfig: [ /* full copy from master */ ],
  Status: "ACTIVE"
}
```

### 3. HourlyAuction
**Purpose**: Individual auction instance at a specific time
**Created**: Automatically after DailyAuction creation
**Count**: N per day (based on dailyAuctionConfig array length)
**Location**: `src/models/HourlyAuction.js`

**Key Fields**:
- `hourlyAuctionId`: Unique UUID
- `dailyAuctionId`: Reference to DailyAuction
- `masterId`: Reference to MasterAuction
- `auctionDate`: Date of auction
- `TimeSlot`: Specific time (e.g., "09:00")
- `Status`: LIVE, UPCOMING, COMPLETED, CANCELLED
- Runtime fields: `totalParticipants`, `currentRound`, `winnerId`, etc.

**Example**:
```javascript
{
  hourlyAuctionId: "uuid-789",
  dailyAuctionId: "uuid-456",
  masterId: "uuid-123",
  auctionDate: "2024-01-15T00:00:00.000Z",
  TimeSlot: "09:00",
  auctionName: "Morning iPhone Auction",
  Status: "UPCOMING",
  totalParticipants: 0,
  currentRound: 1
}
```

## Scheduler Flow

### Daily Execution (11:00 AM)

```
1. Scheduler triggers at 11:00 AM
   ↓
2. Find active MasterAuction
   ↓
3. Check if DailyAuction for today exists
   ↓ (if not exists)
4. Create 1 DailyAuction
   - Copy ALL fields from MasterAuction
   - Set auctionDate to today
   ↓
5. Create N HourlyAuctions
   - Loop through dailyAuctionConfig array
   - Create 1 HourlyAuction per config
   - Each gets unique TimeSlot and settings
   ↓
6. System ready for the day
```

### Code Flow

**File**: `src/controllers/schedulerController.js`

```javascript
// Main scheduler function (called at 11:00 AM)
createDailyAuction() {
  1. Find active MasterAuction
  2. Check if today's DailyAuction exists
  3. If not, create DailyAuction (full replica)
  4. Call createHourlyAuctions()
}

// Creates individual hourly auctions
createHourlyAuctions(dailyAuction) {
  1. Loop through dailyAuction.dailyAuctionConfig
  2. For each config:
     - Create HourlyAuction
     - Copy all fields (TimeSlot, prize, fees, rounds, etc.)
  3. Return created auctions
}
```

## API Endpoints

### 1. Create Daily Auction (Manual Testing)
```bash
POST /scheduler/create-daily-auction
```
**Purpose**: Manually trigger daily auction creation (for testing)
**Returns**: Created DailyAuction + all HourlyAuctions

### 2. Create Hourly Auctions (Manual Testing)
```bash
POST /scheduler/create-hourly-auctions
```
**Purpose**: Manually create hourly auctions from today's DailyAuction
**Returns**: Created HourlyAuctions

### 3. Get Daily Auction
```bash
GET /scheduler/daily-auction?date=2024-01-15
```
**Purpose**: Get the DailyAuction for a specific date
**Returns**: Single DailyAuction document

### 4. Get Hourly Auctions
```bash
GET /scheduler/hourly-auctions?date=2024-01-15
```
**Purpose**: Get all HourlyAuctions for a specific date
**Returns**: Array of HourlyAuction documents

### 5. Update Hourly Auction Status
```bash
PATCH /scheduler/hourly-auctions/:hourlyAuctionId/status
Body: { "status": "LIVE" }
```
**Purpose**: Update status of specific hourly auction
**Returns**: Updated HourlyAuction

## Usage Examples

### Testing the Scheduler

```bash
# 1. Create daily auction and all hourly auctions
curl -X POST http://localhost:5000/scheduler/create-daily-auction

# 2. View today's daily auction
curl http://localhost:5000/scheduler/daily-auction

# 3. View all hourly auctions for today
curl http://localhost:5000/scheduler/hourly-auctions

# 4. Start a specific hourly auction
curl -X PATCH http://localhost:5000/scheduler/hourly-auctions/uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "LIVE"}'

# 5. View specific date
curl http://localhost:5000/scheduler/hourly-auctions?date=2024-01-15
```

### Production Usage

1. **Setup** (One time):
   - Create MasterAuction with `isActive: true`
   - Configure `dailyAuctionConfig` array with all time slots

2. **Daily** (Automatic):
   - Scheduler runs at 11:00 AM
   - Creates today's DailyAuction
   - Creates all HourlyAuctions

3. **Runtime**:
   - Update HourlyAuction status to LIVE when auction starts
   - Track participants, bids, rounds
   - Update to COMPLETED when done

## Configuration

### Environment Variables

Add to `.env`:
```env
TIMEZONE=Asia/Kolkata
```

### Cron Schedule

Current: `0 11 * * *` (11:00 AM daily)

To change timing, edit `src/config/scheduler.js`:
```javascript
cron.schedule('0 11 * * *', ...) // minute hour day month day-of-week
```

## Database Indexes

### DailyAuction
- `{ masterId: 1, auctionDate: 1 }` - Unique
- `{ dailyAuctionId: 1 }` - Unique

### HourlyAuction
- `{ dailyAuctionId: 1, TimeSlot: 1 }` - Unique
- `{ masterId: 1, auctionDate: 1, TimeSlot: 1 }`
- `{ auctionDate: 1, Status: 1 }`

## Data Flow Example

**Day 1 (Jan 15, 2024)**:
```
11:00 AM - Scheduler runs
├── Finds MasterAuction (master_id: "MA000001")
├── Creates DailyAuction (date: 2024-01-15)
│   └── Copies all 24 configs from master
└── Creates 24 HourlyAuctions
    ├── HourlyAuction #1 (09:00)
    ├── HourlyAuction #2 (10:00)
    ├── ...
    └── HourlyAuction #24 (08:00 next day)
```

**Runtime**:
```
09:00 AM - HourlyAuction #1 status → LIVE
09:45 AM - HourlyAuction #1 status → COMPLETED
10:00 AM - HourlyAuction #2 status → LIVE
...
```

## Key Points

1. **DailyAuction is a complete replica** of MasterAuction
2. **Only 1 DailyAuction** is created per day
3. **HourlyAuctions are created from DailyAuction's config array**
4. **Number of HourlyAuctions** = length of `dailyAuctionConfig` array
5. **Scheduler runs once** at 11:00 AM to create everything for the day
6. **Each HourlyAuction** represents an individual auction at a specific time

## Troubleshooting

### Scheduler not running?
- Check backend logs for "⏰ [SCHEDULER] Initializing..."
- Verify TIMEZONE environment variable
- Ensure backend server is running continuously

### No auctions created?
- Verify active MasterAuction exists (`isActive: true`)
- Check `dailyAuctionConfig` array is not empty
- Look for errors in backend logs

### Duplicate auctions?
- Scheduler checks for existing DailyAuction before creating
- Unique indexes prevent duplicate HourlyAuctions

## Future Enhancements

1. **Auto-status updates**: Automatically change HourlyAuction status based on TimeSlot
2. **Cleanup job**: Archive old auctions after N days
3. **Multiple timezones**: Support for different regions
4. **Dynamic pricing**: Adjust prizes based on demand
