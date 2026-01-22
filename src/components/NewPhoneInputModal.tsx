import { useState } from 'react';
import { X, Phone, Send, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface NewPhoneInputModalProps {
  currentPhone: string;
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}

export function NewPhoneInputModal({ currentPhone, onClose, onSuccess }: NewPhoneInputModalProps) {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [otpHint, setOtpHint] = useState<string | null>(null);

  const formatIndianMobile = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 10);
    if (!digits) return "";
    let first = digits.slice(0, 5);
    let last = digits.slice(5);
    if (digits.length <= 5) return first;
    return `${first} ${last}`;
  };

  const currentDigits = currentPhone.replace(/\D/g, '');
  const newDigits = newPhone.replace(/\D/g, '');

  const checkAndSendOtp = async () => {
    if (!newDigits || newDigits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (newDigits === currentDigits) {
      setError('Please enter a different phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setOtpHint(null);

    try {
      const checkRes = await fetch(API_ENDPOINTS.auth.checkMobile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: newDigits }),
      });

      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError('This phone number is already registered with another account');
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.auth.sendVerificationOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: newDigits,
          type: 'mobile',
          reason: 'New Mobile Verification'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      if (data.otp) {
        setOtpHint(data.otp);
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
        description: `Verification code sent to +91 ${formatIndianMobile(newDigits)}`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndUpdate = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.auth.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: newDigits,
          otp: otpCode
        }),
      });

      if (!verifyRes.ok) {
        const verifyData = await verifyRes.json();
        throw new Error(verifyData.message || 'Invalid OTP');
      }

      const userId = localStorage.getItem('user_id');
      const updateRes = await fetch(API_ENDPOINTS.user.updateDetails, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          isMobile: true,
          identifier: newDigits
        }),
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.message || 'Failed to update phone number');
      }

      localStorage.setItem('user_mobile', newDigits);

      toast.success('Phone Number Updated!', {
        description: 'Your phone number has been successfully changed.',
      });

      onSuccess(`+91 ${formatIndianMobile(newDigits)}`);
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
      const nextInput = document.getElementById(`new-phone-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`new-phone-otp-${index - 1}`);
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

  const resendOtp = async () => {
    setLoading(true);
    setError(null);
    setOtpHint(null);
    try {
      const response = await fetch(API_ENDPOINTS.auth.sendVerificationOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: newDigits,
          type: 'mobile',
          reason: 'New Mobile Verification'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      if (data.otp) {
        setOtpHint(data.otp);
      }

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

      setOtp(['', '', '', '', '', '']);
      toast.success('OTP Resent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border-2 border-purple-200">
        <div className="flex items-center justify-between p-6 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-purple-900">
                {step === 'input' ? 'Enter New Phone' : 'Verify New Phone'}
              </h2>
              <p className="text-xs text-green-600 font-medium">Identity Verified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'input' ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Identity Verified Successfully</p>
                  <p className="text-xs text-green-700 mt-1">
                    Now enter your new phone number to complete the change.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-900">
                  Current Phone (Verified)
                </Label>
                <Input
                  type="tel"
                  value={currentPhone}
                  disabled
                  className="bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-purple-900">
                  New Phone Number
                </Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-purple-700 bg-purple-50 border border-r-0 border-purple-300 rounded-l-md">
                    +91
                  </span>
                  <Input
                    type="tel"
                    value={formatIndianMobile(newPhone)}
                    onChange={(e) => {
                      setNewPhone(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    placeholder="Enter 10-digit number"
                    className="rounded-l-none border-purple-300 focus:border-purple-600 focus:ring-purple-600"
                    maxLength={11}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={checkAndSendOtp}
                  disabled={loading || newDigits.length !== 10}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Checking...' : 'Send Verification Code'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-purple-700">
                  We've sent a 6-digit verification code to your new phone
                </p>
                <p className="font-semibold text-purple-900">+91 {formatIndianMobile(newDigits)}</p>
              </div>

              {otpHint && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Testing Mode - OTP Hint</p>
                  <p className="text-lg font-bold text-green-700 tracking-widest">{otpHint}</p>
                </div>
              )}

              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`new-phone-otp-${index}`}
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
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={verifyAndUpdate}
                  disabled={otp.join('').length !== 6 || loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {loading ? 'Updating...' : 'Verify & Update Phone'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
