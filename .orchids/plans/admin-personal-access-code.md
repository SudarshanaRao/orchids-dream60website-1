# Admin Personal Access Code System

## Requirements

Replace the 15-minute session timeout for ADMIN type users with a personal access code system:

1. **Remove 15-minute session timeout** for ADMIN type users
2. **Personal Access Code System**: After admin credentials login, prompt for personal 6-digit access code
3. **Access Code Management**: Allow admin to:
   - View current access code from dashboard header
   - Change access code from dashboard header
   - Reset access code via OTP if forgotten
4. **OTP-based Reset**: Send OTP to admin's registered email/mobile for access code recovery

## Current Architecture Analysis

### Frontend Components
- `src/components/AdminLogin.tsx` - Current login flow with hardcoded access code `841941`
- `src/components/AdminDashboard.tsx` - Dashboard with 15-min session timer (lines 517-555)
- `src/components/AdminSignup.tsx` - Admin registration

### Backend Components
- `src/backend/src/controllers/adminController.js` - Admin authentication logic
- `src/backend/src/routes/adminRoutes.js` - Admin API routes
- `src/backend/src/models/Admin.js` - Admin schema (no personal access code field)
- `src/backend/src/utils/emailService.js` - Email OTP service

### Current Session Timeout Logic (AdminDashboard.tsx)
```typescript
// Lines 517-555
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const isSessionLimited = adminUser.adminType === 'ADMIN';
// Timer countdown logic that logs out ADMIN users after 15 minutes
```

## Implementation Phases

### Phase 1: Backend - Admin Schema Update
**File: `src/backend/src/models/Admin.js`**
- Add `personalAccessCode` field (hashed, 6 digits)
- Add `accessCodeCreatedAt` field for tracking
- Add method `compareAccessCode()` for verification
- Add method `setAccessCode()` for hashing and saving

### Phase 2: Backend - Access Code API Endpoints
**File: `src/backend/src/controllers/adminController.js`**
- Add `verifyAccessCode` - Verify admin's personal access code
- Add `setAccessCode` - Set or update personal access code
- Add `sendAccessCodeResetOtp` - Send OTP for access code reset
- Add `resetAccessCodeWithOtp` - Reset access code after OTP verification
- Add `getAccessCodeStatus` - Check if admin has set access code

**File: `src/backend/src/routes/adminRoutes.js`**
- POST `/admin/verify-access-code` - Verify access code
- POST `/admin/set-access-code` - Set/update access code
- POST `/admin/send-access-code-otp` - Send reset OTP
- POST `/admin/reset-access-code` - Reset with OTP
- GET `/admin/access-code-status` - Check access code status

### Phase 3: Frontend - AdminLogin Component Update
**File: `src/components/AdminLogin.tsx`**
- Remove hardcoded `SECRET_ACCESS_CODE`
- Add two-step flow:
  1. Step 1: Credentials verification (existing)
  2. Step 2: Personal access code verification (new)
- Add "Forgot Access Code?" link for OTP reset flow
- Add first-time setup flow for admins without access code

### Phase 4: Frontend - AdminDashboard Header Update
**File: `src/components/AdminDashboard.tsx`**
- Remove 15-minute session timeout logic for ADMIN type
- Add access code management dropdown in header:
  - "View Access Code" option (masked, with reveal button)
  - "Change Access Code" option (opens modal)
- Add `AccessCodeManagementModal` component

### Phase 5: Frontend - New Components
**File: `src/components/AccessCodeSetupModal.tsx`** (new)
- Modal for first-time access code setup
- 6-digit code input with confirmation

**File: `src/components/AccessCodeResetModal.tsx`** (new)
- Modal for OTP-based access code reset
- OTP request, verification, and new code setup

**File: `src/components/AccessCodeChangeModal.tsx`** (new)
- Modal for changing access code
- Current code verification + new code input

### Phase 6: Frontend - API Configuration
**File: `src/lib/api-config.ts`**
- Add new admin access code endpoints to `API_ENDPOINTS.admin`

## Technical Implementation Details

### Database Schema Change
```javascript
// Admin.js additions
personalAccessCode: {
  type: String,
  select: false, // Don't return in queries by default
},
accessCodeCreatedAt: {
  type: Date,
},
```

### Access Code Hashing
- Use bcrypt for hashing (same as password)
- Store only hashed version, never plain text

### Security Considerations
- Rate limit access code verification attempts (5 attempts per 15 mins)
- OTP expiry: 10 minutes
- Access code must be 6 digits
- Cannot reuse last 3 access codes (optional enhancement)

### Flow Diagrams

**Login Flow:**
```
Admin enters credentials
    ↓
Backend validates credentials
    ↓
Check if admin has access code set
    ↓
[Yes] → Prompt for access code → Verify → Grant dashboard access
[No]  → Show access code setup modal → Set code → Grant dashboard access
```

**Access Code Reset Flow:**
```
Admin clicks "Forgot Access Code?"
    ↓
Backend sends OTP to admin's email/mobile
    ↓
Admin enters OTP
    ↓
Backend verifies OTP
    ↓
Admin sets new access code
    ↓
Return to login with access code step
```

## File Changes Summary

### Modified Files
1. `src/backend/src/models/Admin.js` - Add access code fields and methods
2. `src/backend/src/controllers/adminController.js` - Add access code endpoints
3. `src/backend/src/routes/adminRoutes.js` - Add routes
4. `src/components/AdminLogin.tsx` - Two-step login flow
5. `src/components/AdminDashboard.tsx` - Remove session timeout, add header management
6. `src/lib/api-config.ts` - Add new endpoints

### New Files
1. `src/components/AccessCodeSetupModal.tsx` - First-time setup
2. `src/components/AccessCodeResetModal.tsx` - OTP reset flow
3. `src/components/AccessCodeChangeModal.tsx` - Change code flow

## Testing Checklist
- [ ] Admin with no access code can set one on first login
- [ ] Admin with access code can login with valid code
- [ ] Invalid access code shows error
- [ ] "Forgot Access Code" sends OTP
- [ ] OTP verification works within 10 minutes
- [ ] New access code can be set after OTP verification
- [ ] Dashboard header shows access code management
- [ ] Access code can be viewed (masked/revealed)
- [ ] Access code can be changed from dashboard
- [ ] ADMIN type no longer has 15-minute session timeout
- [ ] SUPER_ADMIN and DEVELOPER types unchanged (no access code required)

## Dependencies
- Existing OTP system (already in place)
- Existing email service (already in place)
- bcrypt for hashing (already installed)
