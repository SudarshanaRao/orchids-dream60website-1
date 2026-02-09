import { useState, useRef, useEffect } from 'react';
import { Lock, ArrowLeft, Shield, Key, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface AdminLoginProps {
  onLogin: (adminUser: any) => void;
  onBack: () => void;
  onSignupClick?: () => void;
}

export const AdminLogin = ({ onLogin, onBack, onSignupClick }: AdminLoginProps) => {
  const [step, setStep] = useState<'credentials' | 'access-code' | 'setup-code' | 'forgot-code'>('credentials');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  // Access code state (4 digits)
  const [accessCode, setAccessCode] = useState(['', '', '', '']);
  const [newAccessCode, setNewAccessCode] = useState(['', '', '', '']);
  const [confirmAccessCode, setConfirmAccessCode] = useState(['', '', '', '']);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const newPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Forgot code OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handlePinInput = (
    index: number,
    value: string,
    setPins: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    setPins(prev => {
      const updated = [...prev];
      updated[index] = digit;
      return updated;
    });
    if (digit && index < 3) {
      setTimeout(() => refs[index + 1]?.current?.focus(), 0);
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    pins: string[],
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      refs[index - 1]?.current?.focus();
    }
  };

  const handlePinPaste = (
    e: React.ClipboardEvent,
    setPins: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setPins(pasted.split(''));
      refs[3]?.current?.focus();
    }
  };

    // Helper to safely parse JSON from a response (handles HTML 404 etc.)
  const safeJsonParse = async (response: Response) => {
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { success: false, message: `Server returned ${response.status}` };
    }
    try {
      return await response.json();
    } catch {
      return { success: false, message: 'Invalid server response' };
    }
  };

  // Step 1: Login with credentials
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.adminLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await safeJsonParse(response);

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Invalid admin credentials');
        setIsLoading(false);
        return;
      }

      // Store admin data temporarily (don't complete login yet)
      setAdminData(data.admin);

      // Check if admin has an access code set from the login response
      if (data.admin.hasAccessCode) {
        setStep('access-code');
        toast.success('Credentials verified');
      } else {
        // Double-check with the status API
        try {
          const statusRes = await fetch(
            `${API_ENDPOINTS.admin.accessCodeStatus}?admin_id=${data.admin.admin_id}`
          );
          const statusData = await safeJsonParse(statusRes);

          if (statusRes.ok && statusData.success && statusData.data?.hasAccessCode) {
            setStep('access-code');
            toast.success('Credentials verified');
          } else {
            setStep('setup-code');
            toast.success('Credentials verified. Please set up your access code.');
          }
        } catch {
          // If status check fails, assume no code set
          setStep('setup-code');
          toast.success('Credentials verified. Please set up your access code.');
        }
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify access code
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = accessCode.join('');
    if (code.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.admin.verifyAccessCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminData.admin_id,
          accessCode: code,
        }),
      });

      const data = await safeJsonParse(response);

      if (data.success) {
        completeLogin();
      } else {
        toast.error(data.message || 'Invalid access code');
        // Don't reset inputs - let user see what they entered and correct
      }
    } catch (error) {
      console.error('Access code verification error:', error);
      toast.error('Failed to verify access code');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup new access code
  const handleSetupCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newAccessCode.join('');
    const confirm = confirmAccessCode.join('');

    if (code.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }
    if (code !== confirm) {
      toast.error('PINs do not match');
      setConfirmAccessCode(['', '', '', '']);
      confirmPinRefs[0]?.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.admin.setAccessCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: adminData.admin_id,
          newAccessCode: code,
        }),
      });

      const data = await safeJsonParse(response);

      if (data.success) {
        toast.success('Access code set successfully');
        completeLogin();
      } else {
        toast.error(data.message || 'Failed to set access code');
      }
    } catch (error) {
      console.error('Set access code error:', error);
      toast.error('Failed to set access code');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot access code - send OTP
  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const response = await fetch(API_ENDPOINTS.admin.sendAccessCodeOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminData.admin_id }),
      });

        const data = await safeJsonParse(response);
        if (data.success) {
          setOtpSent(true);
          toast.success('OTP sent to your registered email');
        } else {
          toast.error(data.message || 'Failed to send OTP');
        }
      } catch (error) {
        toast.error('Failed to send OTP');
      } finally {
        setIsSendingOtp(false);
      }
    };

    // Reset access code with OTP
    const handleResetWithOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      const code = newAccessCode.join('');
      if (code.length !== 4) {
        toast.error('Please enter a 4-digit PIN');
        return;
      }
      if (!otp) {
        toast.error('Please enter the OTP');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(API_ENDPOINTS.admin.resetAccessCode, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_id: adminData.admin_id,
            otp,
            newAccessCode: code,
          }),
        });

        const data = await safeJsonParse(response);
        if (data.success) {
        toast.success('Access code reset successfully');
        completeLogin();
      } else {
        toast.error(data.message || 'Failed to reset access code');
      }
    } catch (error) {
      toast.error('Failed to reset access code');
    } finally {
      setIsLoading(false);
    }
  };

  const completeLogin = () => {
    localStorage.setItem('admin_user_id', adminData.admin_id);
    localStorage.setItem('admin_email', adminData.email);
    localStorage.setItem('admin_username', adminData.username);
    localStorage.setItem('admin_adminType', adminData.adminType);
    localStorage.setItem('admin_login_time', String(Date.now()));
    toast.success('Login successful');
    onLogin(adminData);
  };

    const renderPinInputGroup = (
    pins: string[],
    setPins: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[],
    autoFocus = false,
  ) => (
    <div className="flex justify-center gap-3" onPaste={(e) => handlePinPaste(e, setPins, refs)}>
      {pins.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinInput(i, e.target.value, setPins, refs)}
          onKeyDown={(e) => handlePinKeyDown(i, e, pins, refs)}
          autoFocus={autoFocus && i === 0}
          className="w-14 h-14 text-center text-2xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white transition-colors"
        />
      ))}
    </div>
  );

  // Credentials step
  if (step === 'credentials') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-purple-500/30">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-purple-300 text-sm">Sign in with your credentials</p>
            </div>

            <form onSubmit={handleCredentialSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username / Email / Mobile
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-slate-500 transition-colors"
                    placeholder="Enter username, email or mobile"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-slate-500 transition-colors"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
              >
                {isLoading ? 'Verifying...' : 'Continue'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-center text-slate-500">
                Admin, Super Admin & Developer access only
              </p>
              {onSignupClick && (
                <button
                  onClick={onSignupClick}
                  className="w-full mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Need an admin account? Register here
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access code verification step
  if (step === 'access-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button onClick={() => { setStep('credentials'); setAccessCode(['', '', '', '']); }} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Enter Access Code</h1>
              <p className="text-slate-400 text-sm">Enter your 4-digit PIN to continue</p>
            </div>

            <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
              {renderPinInputGroup(accessCode, setAccessCode, pinRefs, true)}

              <button
                type="submit"
                disabled={isLoading || accessCode.join('').length !== 4}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700 text-center">
              <button
                onClick={() => { setStep('forgot-code'); setNewAccessCode(['', '', '', '']); setOtp(''); setOtpSent(false); setOtpVerified(false); }}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot your access code?
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Setup new access code
  if (step === 'setup-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Set Up Access Code</h1>
              <p className="text-slate-400 text-sm">Create a 4-digit PIN for quick access</p>
            </div>

            <form onSubmit={handleSetupCodeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">New PIN</label>
                  {renderPinInputGroup(newAccessCode, setNewAccessCode, newPinRefs, true)}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">Confirm PIN</label>
                {renderPinInputGroup(confirmAccessCode, setConfirmAccessCode, confirmPinRefs)}
              </div>

              <button
                type="submit"
                disabled={isLoading || newAccessCode.join('').length !== 4 || confirmAccessCode.join('').length !== 4}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg"
              >
                {isLoading ? 'Setting up...' : 'Set Access Code & Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Forgot code flow
  if (step === 'forgot-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button onClick={() => { setStep('access-code'); setAccessCode(['', '', '', '']); }} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Reset Access Code</h1>
              <p className="text-slate-400 text-sm">Verify with OTP to set a new PIN</p>
            </div>

            <form onSubmit={handleResetWithOtp} className="space-y-6">
              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Enter OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-amber-500 text-white placeholder-slate-500 text-center text-lg tracking-widest"
                      placeholder="Enter OTP"
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3 text-center">New 4-digit PIN</label>
                      {renderPinInputGroup(newAccessCode, setNewAccessCode, newPinRefs)}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !otp || newAccessCode.join('').length !== 4}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isLoading ? 'Resetting...' : 'Reset & Login'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
