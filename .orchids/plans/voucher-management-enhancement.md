# Voucher Management Enhancement Plan

## Requirements Summary

Implement a complete manual voucher management system with OTP-protected voucher code reveal functionality:

1. **Admin Panel - Send Voucher Manually**: After sending a voucher, update status to "Sent" and save voucher data to:
   - Issued Vouchers tab in admin panel
   - Vouchers collection in MongoDB database
   - User's transaction history under Amazon Voucher tab

2. **User Profile - Voucher Display**: Show masked voucher codes (first 4 characters visible) with an eye icon

3. **OTP-Protected Reveal**: When user clicks the eye icon:
   - Send OTP via SMS using template ID `1207176898558880888` (FINPGS sender)
   - Message: `Dear {name}, use this OTP {otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech`
   - OTP valid for 10 minutes
   - After correct OTP entry, reveal the full gift card code
   - Limit: 3 reveals per day per user

---

## Current System Analysis

### Existing Components

1. **AdminVoucherManagement.tsx** (src/components/AdminVoucherManagement.tsx):
   - Has manual voucher form (`showManualVoucherModal`) with fields: voucherAmount, GiftCardCode, paymentAmount, redeem_link
   - Currently sends email via email templates but does NOT save to Vouchers collection
   - Missing: Backend API call to persist manual voucher

2. **Voucher Model** (`src/backend/src/models/Voucher.js`):
   - Schema supports both `woohoo` and `manual` sources
   - Fields: userId, claimId, auctionId, transactionId, source, amount, status, cardNumber, cardPin, expiry, emailHistory
   - Auto-generates transactionId with format `D60-AV-{timestamp}-{random}`

3. **adminVoucherController.js**:
   - `sendVoucher()` - Woohoo API only
   - `getIssuedVouchers()` - Returns all vouchers with masked data
   - `getUserVoucherTransactions()` - Returns user's voucher history (masked)
   - Missing: `sendManualVoucher()` endpoint for manual vouchers

4. **TransactionHistoryPage.tsx** (src/components/TransactionHistoryPage.tsx):
   - Has Amazon Voucher tab showing `voucherDetails` from `/user/voucher-transactions`
   - Displays masked card numbers via `cardNumberMasked`
   - Missing: Eye icon for reveal, OTP verification modal

5. **OTP System**:
   - Model: `src/backend/src/models/OTP.js` - 5 min TTL (expires: 300)
   - SMS Controller: `src/backend/src/controllers/smsController.js` - sendOtp, verifyOtp
   - SMS Template ID for login: `1207176898558880888`
   - SMS Sender: `FINPGS`

6. **API Config** (`src/lib/api-config.ts`):
   - Has `voucherTransactions: ${API_BASE_URL}/user/voucher-transactions`
   - Missing: OTP reveal endpoints

---

## Implementation Phases

### Phase 1: Backend - Manual Voucher API

**File: `src/backend/src/controllers/adminVoucherController.js`**

Add new `sendManualVoucher` function after line 185:

```javascript
/**
 * Send voucher manually (not via Woohoo)
 * Creates voucher record in DB and optionally sends email
 */
const sendManualVoucher = async (req, res) => {
    try {
        const adminId = req.query.user_id || req.body.user_id || req.headers['x-user-id'];
        const admin = await verifyAdmin(adminId);
        if (!admin) return res.status(403).json({ success: false, message: 'Admin access required' });

        const { claimId, voucherAmount, giftCardCode, paymentAmount, redeemLink } = req.body;

        if (!claimId || !voucherAmount || !giftCardCode) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: claimId, voucherAmount, giftCardCode'
            });
        }

        // 1. Verify eligibility
        const historyEntry = await AuctionHistory.findById(claimId);
        if (!historyEntry) {
            return res.status(404).json({ success: false, message: 'Winner entry not found' });
        }

        if (historyEntry.prizeClaimStatus !== 'CLAIMED' || !historyEntry.remainingFeesPaid) {
            return res.status(400).json({ success: false, message: 'User has not completed the claim process or payment' });
        }

        // 2. Check if already issued
        const existingVoucher = await Voucher.findOne({ claimId });
        if (existingVoucher) {
            return res.status(400).json({ success: false, message: 'Voucher already issued for this claim' });
        }

        // 3. Get user details
        const user = await User.findOne({ user_id: historyEntry.userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 4. Create Voucher document
        const voucher = new Voucher({
            userId: user.user_id,
            claimId: claimId,
            auctionId: historyEntry.hourlyAuctionId,
            source: 'manual',
            amount: parseFloat(voucherAmount),
            cardNumber: giftCardCode,
            activationUrl: redeemLink || 'https://www.amazon.in/gc/redeem',
            status: 'complete',
            sentToUser: true,
            sentAt: new Date()
        });

        await voucher.save();

        // 5. Send email notification (optional)
        if (user.email) {
            try {
                await sendAmazonVoucherEmail(user.email, {
                    username: user.username || 'Customer',
                    voucherAmount: voucherAmount,
                    giftCardCode: giftCardCode,
                    paymentAmount: paymentAmount || historyEntry.lastRoundBidAmount || 0,
                    redeemLink: redeemLink || 'https://www.amazon.in/gc/redeem'
                });

                // Update emailHistory
                voucher.emailHistory = [{
                    sentTo: user.email,
                    sentAt: new Date(),
                    voucherAmount: voucherAmount,
                    giftCardCode: giftCardCode,
                    redeemLink: redeemLink,
                    emailSubject: `Your Amazon Gift Card Worth Rs.${voucherAmount} from Dream60`,
                    status: 'sent'
                }];
                await voucher.save();
            } catch (emailError) {
                console.error('Email send failed:', emailError);
                // Continue - voucher is still created
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Manual voucher created and sent successfully',
            data: {
                transactionId: voucher.transactionId,
                amount: voucher.amount,
                status: voucher.status,
                userName: user.username,
                userEmail: user.email
            }
        });
    } catch (error) {
        console.error('Error sending manual voucher:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating manual voucher',
            error: error.message
        });
    }
};
```

**File: `src/backend/src/routes/adminRoutes.js`**

Add import and route after line 41:
```javascript
// In imports (line 41), add sendManualVoucher:
const {
  getEligibleWinners,
  sendVoucher,
  sendManualVoucher, // ADD THIS
  getIssuedVouchers,
  // ... rest
} = require('../controllers/adminVoucherController');

// Add route after line 846:
router.post('/vouchers/send-manual', sendManualVoucher);
```

### Phase 2: Backend - Voucher Model Update

**File: `src/backend/src/models/Voucher.js`**

Add reveal tracking fields after line 66:

```javascript
// Add before timestamps: true
revealCount: {
    type: Number,
    default: 0
},
lastRevealDate: {
    type: Date
},
revealHistory: [{
    revealedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
}],
dailyRevealLimit: {
    type: Number,
    default: 3
}
```

### Phase 3: Backend - Voucher OTP Controller (NEW FILE)

**File: `src/backend/src/controllers/voucherOtpController.js`**

```javascript
// src/backend/src/controllers/voucherOtpController.js
const Voucher = require('../models/Voucher');
const User = require('../models/user');
const OTP = require('../models/OTP');
const smsRestService = require('../utils/smsRestService');

/**
 * Check if user has exceeded daily reveal limit (3 per day)
 */
const checkDailyRevealLimit = (voucher) => {
    if (!voucher.lastRevealDate) return true;
    
    const today = new Date();
    const lastReveal = new Date(voucher.lastRevealDate);
    
    // Check if last reveal was today
    const isSameDay = today.toDateString() === lastReveal.toDateString();
    
    if (!isSameDay) {
        return true; // Different day, reset count
    }
    
    return voucher.revealCount < (voucher.dailyRevealLimit || 3);
};

/**
 * Standardize mobile number to 91XXXXXXXXXX format
 */
const formatMobile = (num) => {
    if (!num) return num;
    let cleaned = num.toString().replace(/[\s\-\+]/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    }
    return cleaned;
};

/**
 * Send OTP for voucher reveal
 * POST /user/voucher/:voucherId/send-reveal-otp
 */
const sendVoucherRevealOtp = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { userId } = req.body;

        if (!voucherId || !userId) {
            return res.status(400).json({ success: false, message: 'voucherId and userId are required' });
        }

        // 1. Find voucher and verify ownership
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        if (voucher.userId !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this voucher' });
        }

        if (voucher.status !== 'complete') {
            return res.status(400).json({ success: false, message: 'Voucher is not yet complete' });
        }

        // 2. Check daily reveal limit
        if (!checkDailyRevealLimit(voucher)) {
            return res.status(429).json({
                success: false,
                message: 'Daily reveal limit reached (3 per day). Please try again tomorrow.'
            });
        }

        // 3. Get user mobile
        const user = await User.findOne({ user_id: userId });
        if (!user || !user.mobile) {
            return res.status(404).json({ success: false, message: 'User mobile not found' });
        }

        const formattedMobile = formatMobile(user.mobile);

        // 4. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 5. Save OTP with special identifier for voucher reveal
        const otpIdentifier = `voucher_reveal_${voucherId}`;
        await OTP.findOneAndUpdate(
            { identifier: otpIdentifier, type: 'mobile' },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // 6. Send SMS using template 1207176898558880888
        const message = `Dear ${user.username || 'User'}, use this OTP ${otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech `;
        const templateId = '1207176898558880888';

        const result = await smsRestService.sendSms(formattedMobile, message, 'FINPGS', {
            templateId
        });

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully to your registered mobile',
                data: {
                    mobile: formattedMobile.slice(-4).padStart(formattedMobile.length, '*'),
                    expiresIn: '10 minutes'
                }
            });
        } else {
            return res.status(500).json({ success: false, message: result.error || 'Failed to send OTP' });
        }
    } catch (error) {
        console.error('Send Voucher Reveal OTP Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Verify OTP and reveal voucher code
 * POST /user/voucher/:voucherId/verify-otp
 */
const verifyVoucherOtp = async (req, res) => {
    try {
        const { voucherId } = req.params;
        const { userId, otp } = req.body;

        if (!voucherId || !userId || !otp) {
            return res.status(400).json({ success: false, message: 'voucherId, userId, and otp are required' });
        }

        // 1. Find voucher and verify ownership
        const voucher = await Voucher.findById(voucherId);
        if (!voucher) {
            return res.status(404).json({ success: false, message: 'Voucher not found' });
        }

        if (voucher.userId !== userId) {
            return res.status(403).json({ success: false, message: 'You are not authorized to view this voucher' });
        }

        // 2. Find OTP record
        const otpIdentifier = `voucher_reveal_${voucherId}`;
        const otpRecord = await OTP.findOne({ identifier: otpIdentifier, type: 'mobile' });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new OTP.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        // 3. Delete OTP record (one-time use)
        await OTP.deleteOne({ _id: otpRecord._id });

        // 4. Update reveal tracking
        const today = new Date();
        const lastReveal = voucher.lastRevealDate ? new Date(voucher.lastRevealDate) : null;
        const isSameDay = lastReveal && today.toDateString() === lastReveal.toDateString();

        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await Voucher.findByIdAndUpdate(voucherId, {
            $set: {
                revealCount: isSameDay ? (voucher.revealCount || 0) + 1 : 1,
                lastRevealDate: today
            },
            $push: {
                revealHistory: {
                    revealedAt: today,
                    ipAddress,
                    userAgent
                }
            }
        });

        // 5. Return unmasked card number
        return res.status(200).json({
            success: true,
            message: 'Voucher code revealed successfully',
            data: {
                cardNumber: voucher.cardNumber,
                cardPin: voucher.cardPin || null,
                activationUrl: voucher.activationUrl,
                amount: voucher.amount,
                expiry: voucher.expiry
            }
        });
    } catch (error) {
        console.error('Verify Voucher OTP Error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    sendVoucherRevealOtp,
    verifyVoucherOtp
};
```

### Phase 4: Backend - User Routes Update

**File: `src/backend/src/routes/userHistory.js`**

Add import at top and routes at bottom:

```javascript
// At top (after line 9), add:
const { sendVoucherRevealOtp, verifyVoucherOtp } = require('../controllers/voucherOtpController');

// Before module.exports (after line 862), add:
// Voucher OTP reveal routes
router.post('/voucher/:voucherId/send-reveal-otp', sendVoucherRevealOtp);
router.post('/voucher/:voucherId/verify-otp', verifyVoucherOtp);
```

### Phase 5: Frontend - Admin Panel Update

**File: `src/components/AdminVoucherManagement.tsx`**

Replace `handleSendManualVoucher` function (lines 257-335):

```typescript
const handleSendManualVoucher = async () => {
  if (!manualVoucherWinner) return;
  const { voucherAmount, GiftCardCode, paymentAmount, redeem_link } = manualVoucherForm;
  
  if (!voucherAmount || !GiftCardCode) {
    toast.error('Please fill voucher amount and gift card code');
    return;
  }

  setIsSendingManual(true);
  try {
    // Call backend API to create voucher in database + send email
    const response = await fetch(`${API_BASE_URL}/admin/vouchers/send-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: adminUserId,
        claimId: manualVoucherWinner._id,
        voucherAmount: parseFloat(voucherAmount),
        giftCardCode: GiftCardCode,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : null,
        redeemLink: redeem_link || 'https://www.amazon.in/gc/redeem',
      }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      toast.success(`Voucher sent successfully to ${manualVoucherWinner.userName}`, {
        description: `Transaction ID: ${data.data?.transactionId || 'Generated'}`
      });
      setShowManualVoucherModal(false);
      setManualVoucherWinner(null);
      setManualVoucherForm({
        voucherAmount: '',
        GiftCardCode: '',
        paymentAmount: '',
        redeem_link: '',
      });
      // Refresh data to show in issued vouchers
      await loadData();
    } else {
      toast.error(data.message || 'Failed to send voucher');
    }
  } catch (error) {
    console.error('Error sending manual voucher:', error);
    toast.error('An error occurred while sending the voucher');
  } finally {
    setIsSendingManual(false);
  }
};
```

### Phase 6: Frontend - Transaction History with OTP Reveal

**File: `src/components/TransactionHistoryPage.tsx`**

Add these changes:

1. Add imports at top (after line 23):
```typescript
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from './ui/input-otp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
```

2. Add state variables after line 93:
```typescript
// Voucher reveal state
const [revealingVoucherId, setRevealingVoucherId] = useState<string | null>(null);
const [showOtpModal, setShowOtpModal] = useState(false);
const [otpValue, setOtpValue] = useState('');
const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
const [isSendingOtp, setIsSendingOtp] = useState(false);
const [revealedCodes, setRevealedCodes] = useState<Record<string, { cardNumber: string; cardPin?: string }>>({});
```

3. Add OTP functions after line 333:
```typescript
// Send OTP for voucher reveal
const handleRevealClick = async (voucherId: string) => {
  setRevealingVoucherId(voucherId);
  setIsSendingOtp(true);
  
  try {
    const response = await fetch(`${API_BASE_URL}/user/voucher/${voucherId}/send-reveal-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await response.json();
    
    if (data.success) {
      setShowOtpModal(true);
      toast.success('OTP sent to your registered mobile', {
        description: data.data?.expiresIn ? `Valid for ${data.data.expiresIn}` : undefined
      });
    } else {
      toast.error(data.message || 'Failed to send OTP');
      setRevealingVoucherId(null);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    toast.error('Failed to send OTP');
    setRevealingVoucherId(null);
  } finally {
    setIsSendingOtp(false);
  }
};

// Verify OTP and reveal voucher code
const handleVerifyOtp = async () => {
  if (!revealingVoucherId || otpValue.length !== 6) {
    toast.error('Please enter a valid 6-digit OTP');
    return;
  }
  
  setIsVerifyingOtp(true);
  try {
    const response = await fetch(`${API_BASE_URL}/user/voucher/${revealingVoucherId}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, otp: otpValue }),
    });
    const data = await response.json();
    
    if (data.success) {
      setRevealedCodes(prev => ({
        ...prev,
        [revealingVoucherId]: {
          cardNumber: data.data.cardNumber,
          cardPin: data.data.cardPin
        }
      }));
      setShowOtpModal(false);
      setOtpValue('');
      setRevealingVoucherId(null);
      toast.success('Voucher code revealed!');
    } else {
      toast.error(data.message || 'Invalid OTP');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    toast.error('Verification failed');
  } finally {
    setIsVerifyingOtp(false);
  }
};

// Close OTP modal
const handleCloseOtpModal = () => {
  setShowOtpModal(false);
  setOtpValue('');
  setRevealingVoucherId(null);
};
```

4. Update the voucher card display (around line 1053-1069) to show eye icon:
```tsx
{/* Replace the voucher details section */}
{(voucher.cardNumberMasked) && (
  <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5 space-y-1.5">
    <div className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Voucher Details</div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      <div className="flex items-center gap-1.5 text-xs">
        <CreditCard className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-amber-700">Card:</span>
        <span className="font-mono font-semibold text-amber-900">
          {revealedCodes[voucher._id]?.cardNumber || voucher.cardNumberMasked}
        </span>
        {!revealedCodes[voucher._id] && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRevealClick(voucher._id);
            }}
            disabled={isSendingOtp && revealingVoucherId === voucher._id}
            className="p-1 hover:bg-amber-200 rounded transition-colors disabled:opacity-50"
            title="Reveal full code (OTP verification required)"
          >
            {isSendingOtp && revealingVoucherId === voucher._id ? (
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 text-amber-600" />
            )}
          </button>
        )}
        {revealedCodes[voucher._id] && (
          <EyeOff className="w-4 h-4 text-green-600" title="Code revealed" />
        )}
      </div>
      {(revealedCodes[voucher._id]?.cardPin || voucher.cardPinMasked) && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-amber-700">PIN:</span>
          <span className="font-mono font-semibold text-amber-900">
            {revealedCodes[voucher._id]?.cardPin || voucher.cardPinMasked}
          </span>
        </div>
      )}
    </div>
    {voucher.expiryDate && (
      <div className="text-[11px] text-amber-600">
        Expires: {new Date(voucher.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    )}
  </div>
)}
```

5. Add OTP Modal at the end of the component (before the final closing `</div>`):
```tsx
{/* OTP Verification Modal */}
<Dialog open={showOtpModal} onOpenChange={handleCloseOtpModal}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-purple-600" />
        Verify OTP to Reveal Voucher
      </DialogTitle>
      <DialogDescription>
        Enter the 6-digit OTP sent to your registered mobile number to reveal the full voucher code.
      </DialogDescription>
    </DialogHeader>
    
    <div className="flex flex-col items-center gap-4 py-4">
      <InputOTP
        maxLength={6}
        value={otpValue}
        onChange={setOtpValue}
        disabled={isVerifyingOtp}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      
      <p className="text-xs text-purple-600 text-center">
        OTP is valid for 10 minutes. You can reveal voucher codes up to 3 times per day.
      </p>
      
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          onClick={handleCloseOtpModal}
          className="flex-1"
          disabled={isVerifyingOtp}
        >
          Cancel
        </Button>
        <Button
          onClick={handleVerifyOtp}
          disabled={otpValue.length !== 6 || isVerifyingOtp}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {isVerifyingOtp ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify & Reveal'
          )}
        </Button>
      </div>
      
      <button
        onClick={() => revealingVoucherId && handleRevealClick(revealingVoucherId)}
        disabled={isSendingOtp}
        className="text-xs text-purple-600 hover:text-purple-800 underline disabled:opacity-50"
      >
        {isSendingOtp ? 'Sending...' : 'Resend OTP'}
      </button>
    </div>
  </DialogContent>
</Dialog>
```

### Phase 7: API Config Update

**File: `src/lib/api-config.ts`**

Add new endpoint functions in user object (after line 99):
```typescript
user: {
  // ... existing ...
  voucherTransactions: `${API_BASE_URL}/user/voucher-transactions`,
  sendVoucherRevealOtp: (voucherId: string) => `${API_BASE_URL}/user/voucher/${voucherId}/send-reveal-otp`,
  verifyVoucherOtp: (voucherId: string) => `${API_BASE_URL}/user/voucher/${voucherId}/verify-otp`,
},
```

---

## Database Schema Changes

### Voucher Model Fields to Add

```javascript
revealCount: {
  type: Number,
  default: 0
},
lastRevealDate: {
  type: Date
},
revealHistory: [{
  revealedAt: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String
}],
dailyRevealLimit: {
  type: Number,
  default: 3
}
```

---

## SMS Template Configuration

Using existing DLT-approved template:
- **Template ID**: `1207176898558880888`
- **Sender ID**: `FINPGS`
- **Template**: `Dear {name}, use this OTP {otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech`

---

## Security Considerations

1. **Rate Limiting**: 3 reveals per day per voucher
2. **OTP Expiry**: 10 minutes (configured in OTP model - update expires from 300 to 600)
3. **Ownership Verification**: Voucher userId must match requesting user
4. **Audit Trail**: Track reveal history with timestamps and IP addresses
5. **Masked Display**: Show only first 4 characters by default

---

## Testing Checklist

### Admin Panel Tests
- [ ] Send manual voucher creates DB record in Vouchers collection
- [ ] Eligible winner removed from eligible list after send
- [ ] Issued vouchers tab shows new manual voucher with status "complete"
- [ ] Manual voucher has source: "manual" in database
- [ ] Email sent to user with voucher details

### User Transaction History Tests
- [ ] Manual vouchers appear in Amazon Voucher tab
- [ ] Card code shows masked (first 4 chars + asterisks)
- [ ] Eye icon visible next to masked code
- [ ] Clicking eye icon triggers OTP send
- [ ] OTP SMS received on registered mobile
- [ ] Correct OTP reveals full code
- [ ] Wrong OTP shows error message
- [ ] Daily limit (3) enforced with proper error
- [ ] Revealed code persists in component state

### API Tests
- [ ] POST /admin/vouchers/send-manual creates voucher
- [ ] POST /user/voucher/:id/send-reveal-otp sends SMS
- [ ] POST /user/voucher/:id/verify-otp returns unmasked code
- [ ] Rate limiting works correctly (3 per day)
- [ ] Expired OTP returns proper error

---

## File Changes Summary

### New Files
1. `src/backend/src/controllers/voucherOtpController.js` - OTP send/verify for voucher reveal

### Modified Files
1. `src/backend/src/models/Voucher.js` - Add reveal tracking fields
2. `src/backend/src/controllers/adminVoucherController.js` - Add sendManualVoucher function + export
3. `src/backend/src/routes/adminRoutes.js` - Add manual voucher route + import
4. `src/backend/src/routes/userHistory.js` - Add OTP reveal routes + import
5. `src/components/AdminVoucherManagement.tsx` - Update handleSendManualVoucher to call API
6. `src/components/TransactionHistoryPage.tsx` - Add OTP reveal UI, eye icon, modal
7. `src/lib/api-config.ts` - Add new endpoint functions

---

## Dependencies

No new dependencies required. Uses existing:
- SMS service (`smsRestService`)
- OTP model
- Voucher model
- Email service (`sendAmazonVoucherEmail`)
- InputOTP component (already exists)
- Dialog component (already exists)
