# Separate Admin Authentication System with Session Management

## Overview
This plan implements a completely separate admin authentication system with its own database collection, distinct from the user collection. It includes admin types with different privileges, session timeout for regular admins, and OTP-based signup approval via info@dream60.com.

## Requirements

### 1. Separate Admin Collection
- Create a new `Admin` collection in MongoDB completely separate from the `User` collection
- No foreign key links between Admin and User collections
- Admin data stored independently for security isolation

### 2. Admin Types
Three admin types with different privilege levels:
- **ADMIN**: Regular admin with restricted access and 15-minute session timeout
- **SUPER_ADMIN**: Full admin access without session timeout
- **DEVELOPER**: Full unrestricted access to all admin panel features without any restrictions

### 3. Admin Signup Flow
- Admin signup page accessible from admin login page
- When signing up, OTP is sent to **info@dream60.com** (not the registering user's email)
- Approval required via OTP verification by existing admin
- New admin account created only after OTP verification

### 4. Session Timeout for ADMIN Type
- 15-minute session timeout for `adminType === 'ADMIN'` only
- Visual countdown timer displayed in header beside the Refresh button
- Auto-logout when timer expires
- Timer resets on user activity (optional enhancement)
- Super Admin and Developer types have no session timeout

### 5. Session Timer UI
- Display countdown timer (MM:SS format) beside the Refresh button in admin header
- Timer only visible for ADMIN type users
- Visual warning when time is running low (e.g., last 2 minutes changes color to red)
- Toast notification before auto-logout

---

## Technical Implementation

### Phase 1: Backend - Create Admin Model and Collection

**File: `src/backend/src/models/Admin.js` (NEW FILE)**

Create a new Mongoose schema for the Admin collection:
```javascript
// Fields:
- admin_id: UUID (unique, immutable)
- adminCode: String (auto-generated, format: #A000001)
- username: String (required, unique)
- email: String (required, unique)
- mobile: String (required, unique)
- password: String (hashed with bcrypt)
- adminType: Enum ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'] (required)
- isActive: Boolean (default: true)
- createdAt: Date
- updatedAt: Date
- lastLoginAt: Date
- createdBy: admin_id (reference to approving admin)
```

### Phase 2: Backend - Update Admin Controller

**File: `src/backend/src/controllers/adminController.js`**

Modify existing functions and add new ones:

1. **Update `adminLogin`**:
   - Query the new `Admin` collection instead of `User` collection
   - Return `adminType` in response for frontend session handling
   - Record `lastLoginAt` timestamp

2. **Update `sendAdminSignupOtp`**:
   - Change OTP recipient to `info@dream60.com` instead of registrant's email
   - Include registrant details in OTP email for context
   - Store pending signup details temporarily

3. **Update `adminSignup`**:
   - Verify OTP against `info@dream60.com`
   - Create admin in new `Admin` collection
   - Set `adminType` based on signup selection

4. **Add `getAdminProfile`**:
   - Fetch admin details from Admin collection
   - Used for session validation

### Phase 3: Backend - Update Admin Routes

**File: `src/backend/src/routes/adminRoutes.js`**

- Ensure all admin routes query the new `Admin` collection for authentication
- Update middleware to check `Admin` collection instead of `User` collection

### Phase 4: Frontend - Update Admin Login Component

**File: `src/components/AdminLogin.tsx`**

Modifications:
- Store `adminType` in localStorage on successful login
- Store `loginTimestamp` for session management
- Pass adminType to dashboard component

### Phase 5: Frontend - Update Admin Signup Component

**File: `src/components/AdminSignup.tsx`**

Modifications:
- Update OTP message to indicate OTP is sent to info@dream60.com
- Clarify that admin approval is required
- Ensure `adminType` selection works with new enum values

### Phase 6: Frontend - Create Session Timer Component

**File: `src/components/AdminSessionTimer.tsx` (NEW FILE)**

New component for session countdown:
```typescript
interface AdminSessionTimerProps {
  adminType: string;
  loginTimestamp: number;
  onSessionExpired: () => void;
}

// Features:
- 15-minute countdown from login timestamp
- Displays MM:SS format
- Warning color change at 2 minutes remaining
- Toast notification at 1 minute remaining
- Auto-logout callback when expired
- Only renders for adminType === 'ADMIN'
```

### Phase 7: Frontend - Update Admin Dashboard

**File: `src/components/AdminDashboard.tsx`**

Modifications:
1. **Update AdminUser interface**:
   ```typescript
   interface AdminUser {
     user_id: string; // becomes admin_id
     username: string;
     email: string;
     adminType: 'ADMIN' | 'SUPER_ADMIN' | 'DEVELOPER';
     adminCode: string;
   }
   ```

2. **Add session timer to header**:
   - Import and render `AdminSessionTimer` component
   - Position between Refresh button and user profile
   - Pass adminType and onLogout callback

3. **Implement session check on mount**:
   - Check if session has expired when component mounts
   - Auto-logout if already expired

4. **Update header section** (around line 884):
   ```tsx
   <div className="flex items-center gap-4">
     {/* Session Timer - Only for ADMIN type */}
     {adminUser.adminType === 'ADMIN' && (
       <AdminSessionTimer
         adminType={adminUser.adminType}
         loginTimestamp={/* from localStorage */}
         onSessionExpired={handleLogout}
       />
     )}
     <button onClick={handleRefresh}>...</button>
     ...
   </div>
   ```

### Phase 8: Frontend - Update API Config

**File: `src/lib/api-config.ts`**

Add new endpoints:
```typescript
admin: {
  login: `${API_BASE_URL}/admin/login`,
  signup: `${API_BASE_URL}/admin/signup`,
  sendSignupOtp: `${API_BASE_URL}/admin/send-signup-otp`,
  profile: `${API_BASE_URL}/admin/profile`, // NEW
  validateSession: `${API_BASE_URL}/admin/validate-session`, // NEW
}
```

---

## Implementation Order

1. **Create Admin Model** - New MongoDB collection schema
2. **Update Admin Controller** - Modify login/signup to use new collection
3. **Update Admin Routes** - Ensure proper authentication checks
4. **Update AdminLogin.tsx** - Store session data and adminType
5. **Update AdminSignup.tsx** - Update OTP messaging
6. **Create AdminSessionTimer.tsx** - New countdown timer component
7. **Update AdminDashboard.tsx** - Integrate timer and session management
8. **Testing** - Verify all admin types work correctly

---

## Database Migration Considerations

Since existing admin users are in the `User` collection, a migration strategy is needed:

1. **Option A: Manual Migration**
   - Manually create admin accounts in new Admin collection
   - Update credentials as needed

2. **Option B: Script Migration**
   - Create migration script to copy admin users from User to Admin collection
   - Map `isSuperAdmin` to appropriate `adminType`

Recommended: **Option A** for initial deployment since there are likely few admin accounts.

---

## Security Considerations

1. **Session Storage**: Use localStorage for session data (acceptable for admin panel)
2. **Token-based Auth**: Consider adding JWT tokens for enhanced security (future enhancement)
3. **Activity-based Reset**: Option to reset timer on user activity (future enhancement)
4. **Concurrent Sessions**: Consider limiting to single session per admin (future enhancement)

---

## Files to Create
1. `src/backend/src/models/Admin.js` - New admin schema
2. `src/components/AdminSessionTimer.tsx` - Session timer component

## Files to Modify
1. `src/backend/src/controllers/adminController.js` - Update auth logic
2. `src/backend/src/routes/adminRoutes.js` - Update route handlers
3. `src/components/AdminLogin.tsx` - Store session data
4. `src/components/AdminSignup.tsx` - Update OTP messaging
5. `src/components/AdminDashboard.tsx` - Add timer to header
6. `src/lib/api-config.ts` - Add new endpoints

---

## Testing Checklist

- [ ] Admin signup sends OTP to info@dream60.com
- [ ] Admin login works with new Admin collection
- [ ] ADMIN type shows 15-minute timer
- [ ] Timer counts down correctly
- [ ] Auto-logout when timer expires
- [ ] SUPER_ADMIN has no timer
- [ ] DEVELOPER has no timer and full access
- [ ] Session persists on page refresh (until timeout)
- [ ] Timer warning color change at 2 minutes
- [ ] Toast notification before logout
