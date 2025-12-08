# 🚀 Deployment Configuration Guide

## ✅ Domain Configuration Complete

Your application is now configured to work seamlessly with **both** domains:
- Current domain: `localhost:3000` (development)
- New domain: `www.test.dream60.com` (production)

---

## 📋 What Was Fixed

### 1. **Centralized API Configuration** (`src/lib/api-config.ts`)
✅ Created a centralized configuration file that automatically detects the API base URL from environment variables.

**Features:**
- Reads from `VITE_BACKEND_API_URL` environment variable
- Falls back to `https://dev-api.dream60.com` if not set
- Single source of truth for all API endpoints
- Easy to update for different environments

### 2. **Updated Frontend Components**
✅ All components now use the centralized API configuration:

**Files Updated:**
- `src/components/AccountSettings.tsx` - Account management API calls
- `src/components/AdminLogin.tsx` - Admin authentication
- `src/components/AuctionSchedule.tsx` - Daily auction schedule
- `src/components/ForgotPasswordPage.tsx` - Password reset flow
- `src/components/OTPVerificationModal.tsx` - OTP verification
- `src/components/Leaderboard.tsx` - Leaderboard data
- `src/components/AuctionBox.tsx` - Live auction data
- `src/components/AuctionHistory.tsx` - Historical auction data
- `src/components/AdminDashboard.tsx` - Admin panel
- `src/components/PrizeShowcase.tsx` - Prize information
- And many more...

### 3. **Backend CORS Whitelisting**
✅ Backend `.env` file already includes both domains in `CLIENT_URL`:

```env
CLIENT_URL=http://localhost:3000,http://localhost:2003,http://192.168.3.16:2003/,https://dev-api.dream60.com,https://dream60.com,https://www.test.dream60.com,https://test.dream60.com,https://3000-56ff7733-6dff-4925-94ae-398e98380fc8.orchids.page/
```

### 4. **Environment Variables**
✅ Frontend `.env` configured with backend API URL:

```env
VITE_BACKEND_API_URL=https://dev-api.dream60.com
```

---

## 🔧 How It Works

### Frontend API Calls
All API calls now use the centralized configuration:

```typescript
import { API_ENDPOINTS } from '../lib/api-config';

// Example: Login API call
const response = await fetch(API_ENDPOINTS.auth.login, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

### Automatic Domain Detection
The configuration automatically detects the correct API URL:
1. Checks `VITE_BACKEND_API_URL` environment variable
2. Falls back to `https://dev-api.dream60.com`
3. Works seamlessly across all environments

---

## 🌐 Deployment Instructions

### For `www.test.dream60.com` Deployment:

1. **No Code Changes Needed** ✅
   - All hardcoded URLs have been removed
   - Application uses environment-based configuration

2. **Environment Variables** (if different API)
   - If you need a different API URL for this domain, update `.env`:
   ```env
   VITE_BACKEND_API_URL=https://your-api-domain.com
   ```

3. **Build Application**
   ```bash
   npm run build
   # or
   bun run build
   ```

4. **Deploy**
   - Deploy the `dist` folder to your hosting provider
   - Ensure DNS is configured for `www.test.dream60.com`

### Backend Configuration:
✅ **Already configured!** The backend `.env` includes:
- `www.test.dream60.com` in CORS whitelist
- `test.dream60.com` in CORS whitelist
- All necessary production URLs

---

## 🧪 Testing Checklist

### Test on Current Domain (localhost:3000):
- [ ] User login/registration
- [ ] Live auction participation
- [ ] Bid placement
- [ ] Prize claims
- [ ] Account settings
- [ ] Admin panel access

### Test on New Domain (www.test.dream60.com):
- [ ] User login/registration
- [ ] Live auction participation
- [ ] Bid placement
- [ ] Prize claims
- [ ] Account settings
- [ ] Admin panel access
- [ ] Cross-origin API calls work

---

## 📊 API Endpoints Configuration

All endpoints are now centrally managed in `src/lib/api-config.ts`:

**Authentication:**
- `/auth/login` - User login
- `/auth/signup` - User registration
- `/auth/send-otp` - Send OTP
- `/auth/verify-otp` - Verify OTP
- `/auth/reset-password` - Password reset
- `/admin/login` - Admin login

**Auctions:**
- `/scheduler/live-auction` - Live auction data
- `/scheduler/place-bid` - Place bid
- `/scheduler/daily-auction` - Daily schedule
- `/scheduler/leaderboard` - Leaderboard
- `/scheduler/user-auction-history` - User history

**User Management:**
- `/auth/me` - User profile
- `/auth/updateUserDetails` - Update details
- `/auth/me/preferences` - Update preferences

**Payments:**
- `/api/razorpay/hourly/create-order` - Create payment order
- `/api/razorpay/hourly/verify-payment` - Verify payment
- `/api/razorpay/prize-claim/create-order` - Prize claim order

---

## 🔐 Security Notes

1. **CORS Configuration** ✅
   - Backend properly whitelists both domains
   - Prevents unauthorized cross-origin requests

2. **Environment Variables** ✅
   - API URLs stored in environment variables
   - Easy to change per environment

3. **No Hardcoded URLs** ✅
   - All API calls use centralized configuration
   - Prevents deployment issues

---

## 🚨 Important Notes

### IST Timezone Handling:
✅ Application correctly handles IST (Indian Standard Time):
- All timestamps stored in IST format
- No timezone conversions on display
- Times from API displayed as-is

### Backend Environment:
✅ Backend `.env` already configured with:
- MongoDB connection
- Razorpay keys
- JWT secret
- CORS whitelist with both domains

---

## 📞 Support

If you encounter any issues:
1. Check browser console for API errors
2. Verify network requests point to correct API URL
3. Ensure backend CORS includes your domain
4. Check environment variables are loaded correctly

---

## ✅ Configuration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend API Config | ✅ Complete | Centralized in `api-config.ts` |
| Backend CORS | ✅ Complete | Both domains whitelisted |
| Environment Variables | ✅ Complete | Properly configured |
| Component Updates | ✅ Complete | All API calls updated |
| IST Timezone | ✅ Complete | No conversion issues |

---

## 🎉 Ready for Deployment!

Your application is now fully configured to work seamlessly on:
- **Development:** `localhost:3000`
- **Production:** `www.test.dream60.com`

Both domains will use the same backend API (`https://dev-api.dream60.com`) without any code changes needed!
