# Scheduler API Quick Reference 

## Endpoints Overview

### 1. Create Daily Auction (Manual Trigger)
**Endpoint**: `POST /scheduler/create-daily-auction`  
**Purpose**: Manually trigger daily auction creation for testing  
**Auth**: Not required (should add in production)

**Response**:
```json
{
  "success": true,
  "message": "Daily auction and hourly auctions created successfully",
  "dailyAuction": { /* DailyAuction object */ },
  "hourlyAuctions": {
    "success": true,
    "created": 24,
    "auctions": [ /* Array of HourlyAuction objects */ ]
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/scheduler/create-daily-auction
```

---

### 2. Create Hourly Auctions (Manual Trigger)
**Endpoint**: `POST /scheduler/create-hourly-auctions`  
**Purpose**: Manually create hourly auctions from today's daily auction  
**Auth**: Not required (should add in production)

**Response**:
```json
{
  "success": true,
  "message": "Hourly auctions created successfully",
  "created": 24,
  "auctions": [ /* Array of HourlyAuction objects */ ]
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/scheduler/create-hourly-auctions
```

---

### 3. Get Daily Auction
**Endpoint**: `GET /scheduler/daily-auction`  
**Query Params**: 
- `date` (optional): Date string (YYYY-MM-DD), defaults to today

**Response**:
```json
{
  "success": true,
  "data": {
    "dailyAuctionId": "uuid-456",
    "masterId": "uuid-123",
    "auctionDate": "2024-01-15T00:00:00.000Z",
    "totalAuctionsPerDay": 24,
    "dailyAuctionConfig": [ /* Array of configs */ ],
    "Status": "ACTIVE"
  },
  "meta": {
    "date": "2024-01-15T00:00:00.000Z"
  }
}
```

**Examples**:
```bash
# Get today's daily auction
curl http://localhost:5000/scheduler/daily-auction

# Get specific date
curl http://localhost:5000/scheduler/daily-auction?date=2024-01-15
```

---

### 4. Get Hourly Auctions
**Endpoint**: `GET /scheduler/hourly-auctions`  
**Query Params**: 
- `date` (optional): Date string (YYYY-MM-DD), defaults to today

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "hourlyAuctionId": "uuid-789",
      "dailyAuctionId": "uuid-456",
      "masterId": "uuid-123",
      "auctionDate": "2024-01-15T00:00:00.000Z",
      "TimeSlot": "09:00",
      "auctionName": "Morning iPhone Auction",
      "prizeValue": 80000,
      "Status": "UPCOMING",
      "totalParticipants": 0,
      "currentRound": 1
    },
    // ... more auctions
  ],
  "meta": {
    "date": "2024-01-15T00:00:00.000Z",
    "count": 24
  }
}
```

**Examples**:
```bash
# Get today's hourly auctions
curl http://localhost:5000/scheduler/hourly-auctions

# Get specific date
curl http://localhost:5000/scheduler/hourly-auctions?date=2024-01-15
```

---

### 5. Update Hourly Auction Status
**Endpoint**: `PATCH /scheduler/hourly-auctions/:hourlyAuctionId/status`  
**Path Params**: 
- `hourlyAuctionId`: UUID of the hourly auction

**Request Body**:
```json
{
  "status": "LIVE"
}
```

**Valid Statuses**: `LIVE`, `UPCOMING`, `COMPLETED`, `CANCELLED`

**Response**:
```json
{
  "success": true,
  "data": {
    "hourlyAuctionId": "uuid-789",
    "Status": "LIVE",
    "startedAt": "2024-01-15T09:00:00.000Z",
    // ... rest of auction data
  }
}
```

**Examples**:
```bash
# Start an auction (set to LIVE)
curl -X PATCH http://localhost:5000/scheduler/hourly-auctions/uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "LIVE"}'

# Complete an auction
curl -X PATCH http://localhost:5000/scheduler/hourly-auctions/uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# Cancel an auction
curl -X PATCH http://localhost:5000/scheduler/hourly-auctions/uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CANCELLED"}'
```

---

## Testing Workflow

### 1. Initial Setup (One Time)
```bash
# Ensure you have an active MasterAuction with dailyAuctionConfig
# This should be done via your MasterAuction creation endpoint
```

### 2. Test Daily Auction Creation
```bash
# Create today's daily auction + all hourly auctions
curl -X POST http://localhost:5000/scheduler/create-daily-auction
```

### 3. View Created Data
```bash
# View the daily auction
curl http://localhost:5000/scheduler/daily-auction

# View all hourly auctions
curl http://localhost:5000/scheduler/hourly-auctions
```

### 4. Manage Hourly Auctions
```bash
# Get the hourlyAuctionId from step 3, then update status
curl -X PATCH http://localhost:5000/scheduler/hourly-auctions/{hourlyAuctionId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "LIVE"}'
```

---

## Production Behavior

### Automatic Scheduling
- **Time**: 11:00 AM daily (Asia/Kolkata timezone)
- **Action**: Creates 1 DailyAuction + N HourlyAuctions
- **Trigger**: Automatic via node-cron

### Environment Configuration
Add to `.env`:
```env
TIMEZONE=Asia/Kolkata
```

### Server Logs
Look for these messages:
```
⏰ [SCHEDULER] Initializing scheduled jobs...
✅ [SCHEDULER] Daily auction creation job scheduled for 11:00 AM
🕐 [SCHEDULER] Running scheduled daily auction creation job...
✅ [SCHEDULER] Daily auction created: uuid-456
📊 [SCHEDULER] Total auctions to create: 24
  ✅ Created hourly auction: Morning iPhone Auction at 09:00
  ✅ Created hourly auction: Mid-Morning Auction at 10:00
  ...
🎉 [SCHEDULER] Hourly auction creation completed. Created: 24
```

---

## Error Handling

### No Active MasterAuction
```json
{
  "success": false,
  "message": "No active master auction found"
}
```
**Solution**: Create a MasterAuction with `isActive: true`

### Daily Auction Already Exists
```json
{
  "success": false,
  "message": "Daily auction already created for today",
  "existing": { /* existing DailyAuction */ }
}
```
**Solution**: This is normal. Scheduler prevents duplicates.

### No Daily Auction Config
```json
{
  "success": false,
  "message": "No auction configurations found"
}
```
**Solution**: Add entries to `dailyAuctionConfig` array in MasterAuction

---

## Model Relationships

```
MasterAuction (1)
    ↓ References: master_id
DailyAuction (1 per day)
    ↓ References: dailyAuctionId, masterId
HourlyAuction (N per day)
    ↓ References: hourlyAuctionId, dailyAuctionId, masterId
```

---

## Common Queries

### Get Current Live Auction
```javascript
// Use HourlyAuction.findCurrentLive() static method
const liveAuction = await HourlyAuction.findCurrentLive();
```

### Get Upcoming Auctions
```javascript
// Use HourlyAuction.findUpcoming() static method
const upcomingAuctions = await HourlyAuction.findUpcoming();
```

### Get Auctions by Daily Auction ID
```javascript
// Use HourlyAuction.findByDailyAuctionId() static method
const auctions = await HourlyAuction.findByDailyAuctionId('uuid-456');
```

---

## Security Recommendations for Production

1. **Add Authentication**: Protect all POST/PATCH endpoints
2. **Rate Limiting**: Prevent abuse of manual triggers
3. **Role-Based Access**: Only admins can trigger/update
4. **Audit Logs**: Log all status changes and creations
5. **Validation**: Add request body validation middleware
