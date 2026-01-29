import { useState } from 'react';
import { X, Phone, Send, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface ChangePhoneModalProps {
  currentPhone: string;
  onClose: () => void;
  onOldPhoneVerified: () => void;
  onNavigateToSupport?: () => void;
}

export function ChangePhoneModal({ currentPhone, onClose, onOldPhoneVerified, onNavigateToSupport }: ChangePhoneModalProps) {
  const [step, setStep] = useState<'verify-old' | 'otp'>('verify-old');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const currentDigits = currentPhone.replace(/\D/g, '');

    const sendOtpToCurrentPhone = async () => {
      setLoading(true);
      setError(null);
      try {
      const userId = localStorage.getItem('user_id');
      const response = await fetch(API_ENDPOINTS.auth.sendVerificationOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentDigits,
          type: 'mobile',
          reason: 'Current Mobile Verification',
          user_id: userId
        }),
      });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to send OTP');
        }

        setStep('otp');
      setTimeLeft(60);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success('OTP Sent!', {
        description: `Verification code sent to ${currentPhone}`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.auth.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: currentDigits,
          otp: otpCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }

      toast.success('Identity Verified!', {
        description: 'Now you can enter your new phone number.',
      });
      onOldPhoneVerified();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`phone-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`phone-otp-${index - 1}`);
      prevInput?.focus();
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-2 border-purple-200">
        <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">
              {step === 'verify-old' ? 'Change Phone Number' : 'Verify Your Identity'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'verify-old' ? (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Identity Verification Required</p>
                  <p className="text-xs text-amber-700 mt-1">
                    To change your phone number, we need to first verify your current number for security.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-900">
                  Current Phone Number
                </Label>
                <Input
                  type="tel"
                  value={currentPhone}
                  disabled
                  className="bg-purple-50 border-purple-300 text-purple-700 cursor-not-allowed font-medium"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-700">
                  Click the button below to receive a verification code on your current phone number.
                </p>
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={sendOtpToCurrentPhone}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </div>

              <div className="border-t border-purple-100 pt-4">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSupport?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Don't have access to this number? Contact Support
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-purple-700">
                  We've sent a 6-digit verification code to
                </p>
                  <p className="font-semibold text-purple-900">{currentPhone}</p>
                </div>

                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`phone-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-purple-300 focus:border-purple-600 focus:ring-purple-600"
                    disabled={loading}
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-purple-600">
                    Resend code in <span className="font-semibold">{timeLeft}s</span>
                  </p>
                ) : (
                  <button
                    onClick={sendOtpToCurrentPhone}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={verifyOtp}
                  disabled={otp.join('').length !== 6 || loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('verify-old')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Back
                </Button>
              </div>

              <div className="border-t border-purple-100 pt-4">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSupport?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 text-sm text-purple-600 hover:text-purple-800 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Don't have access to this number? Contact Support
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
