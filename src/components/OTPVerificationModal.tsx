import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { API_ENDPOINTS } from '../lib/api-config';

interface OTPVerificationModalProps {
  type: 'email' | 'phone';
  recipient: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
}


export function OTPVerificationModal({ type, recipient, onClose, onVerify }: OTPVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const [serverOtp, setServerOtp] = useState<string | null>(null);

  // Helper to build request body based on type
  const buildRequestBody = () => {
    if (type === 'email') return { email: recipient };
    else return { mobile: recipient };
  };

  // Send OTP API call (POST /auth/forgot-password)
const sendOtp = async () => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch(API_ENDPOINTS.auth.sendOtp, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody()),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }

    // ⭐ NEW: show OTP returned from server
    if (data.otp) {
      setServerOtp(data.otp);
    }

    setTimeLeft(60);
  } catch (err: any) {
    setError(err.message || 'Error sending OTP');
  } finally {
    setLoading(false);
  }
};

const updateDetails = async () => {
  try {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      setError("User ID missing in localStorage");
      return;
    }

    const payload = {
      user_id: userId,
      identifier: recipient,
      isEmail: type === "email",
      isMobile: type === "phone"
    };

    const res = await fetch(API_ENDPOINTS.user.updateDetails, {
      method: "PUT", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to update details");
    }

  } catch (error: any) {
    setError(error.message);
  }
};



  // Verify OTP API call (POST /auth/verify-otp)
const verifyOtp = async (otpCode: string) => {
  setLoading(true);
  setError(null);

  try {
    const body = {
      otp: otpCode,
      ...(type === 'email' ? { email: recipient } : { mobile: recipient }),
    };

    const response = await fetch(API_ENDPOINTS.auth.verifyOTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'OTP verification failed');
    }

    // OTP verified → Now update details
    await updateDetails();

    // Notify parent
    onVerify(otpCode);

  } catch (err: any) {
    setError(err.message || 'Error verifying OTP');
  } finally {
    setLoading(false);
  }
};


const sentRef = useRef(false);

useEffect(() => {
  if (!sentRef.current) {
    sendOtp();
    sentRef.current = true;
  }

  const timer = setInterval(() => {
    setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
  }, 1000);

  inputRefs.current[0]?.focus();

  return () => clearInterval(timer);
}, []);


  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i];
      }
    }

    setOtp(newOtp);
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      verifyOtp(otpCode);
    }
  };

  const handleResend = () => {
    sendOtp();
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-2 border-purple-200">
        <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">Verify OTP</h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-purple-700">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-semibold text-purple-900">{recipient}</p>
            {serverOtp && (
  <p className="text-green-600 text-sm">
    OTP: <span className="font-semibold">{serverOtp}</span>
  </p>
)}

            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center border-purple-300 focus:border-purple-600 focus:ring-purple-600"
                  disabled={loading}
                />
              ))}
            </div>

            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-purple-600">
                  Resend code in <span className="font-semibold">{timeLeft}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleVerify}
              disabled={otp.join('').length !== 6 || loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : 'Verify'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}