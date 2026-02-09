import { useState, useRef } from 'react';
import { Key, Eye, EyeOff, X, Shield, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface AccessCodeManagementProps {
  adminId: string;
  onClose: () => void;
}

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

export const AccessCodeManagement = ({ adminId, onClose }: AccessCodeManagementProps) => {
  const [view, setView] = useState<'menu' | 'view-code' | 'change-code' | 'reset-code'>('menu');
  const [isLoading, setIsLoading] = useState(false);

  // View code state
  const [viewPin, setViewPin] = useState(['', '', '', '']);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [showRevealed, setShowRevealed] = useState(false);
  const viewPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Change code state
  const [currentPin, setCurrentPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const currentPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const newPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const confirmPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Reset with OTP state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resetNewPin, setResetNewPin] = useState(['', '', '', '']);
  const resetPinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const handlePinInput = (
    index: number,
    value: string,
    pins: string[],
    setPins: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.RefObject<HTMLInputElement | null>[]
  ) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...pins];
    updated[index] = value.slice(-1);
    setPins(updated);
    if (value && index < 3) setTimeout(() => refs[index + 1]?.current?.focus(), 0);
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

  const PinInputGroup = ({
    pins,
    setPins,
    refs,
    autoFocus = false,
  }: {
    pins: string[];
    setPins: React.Dispatch<React.SetStateAction<string[]>>;
    refs: React.RefObject<HTMLInputElement | null>[];
    autoFocus?: boolean;
  }) => (
    <div className="flex justify-center gap-3" onPaste={(e) => handlePinPaste(e, setPins, refs)}>
      {pins.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinInput(i, e.target.value, pins, setPins, refs)}
          onKeyDown={(e) => handlePinKeyDown(i, e, pins, refs)}
          autoFocus={autoFocus && i === 0}
          className="w-12 h-12 text-center text-xl font-bold bg-purple-50 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-purple-900 transition-colors"
        />
      ))}
    </div>
  );

  // View access code (verify current PIN first)
  const handleViewCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = viewPin.join('');
    if (code.length !== 4) { toast.error('Enter your 4-digit PIN'); return; }

    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.admin.verifyAccessCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, accessCode: code }),
      });
        const data = await safeJsonParse(res);
        if (data.success) {
          setRevealedCode(code);
          toast.success('Access code verified');
        } else {
          toast.error(data.message || 'Invalid access code');
          // Don't reset PIN inputs - let user see and correct
        }
      } catch { toast.error('Verification failed'); }
    finally { setIsLoading(false); }
  };

  // Change access code
  const handleChangeCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = currentPin.join('');
    const newCode = newPin.join('');
    const confirm = confirmPin.join('');

    if (current.length !== 4) { toast.error('Enter your current PIN'); return; }
    if (newCode.length !== 4) { toast.error('Enter a new 4-digit PIN'); return; }
    if (newCode !== confirm) {
      toast.error('New PINs do not match');
      setConfirmPin(['', '', '', '']);
      confirmPinRefs[0]?.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // First verify current code
      const verifyRes = await fetch(API_ENDPOINTS.admin.verifyAccessCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, accessCode: current }),
      });
        const verifyData = await safeJsonParse(verifyRes);
        if (!verifyData.success) {
          toast.error('Current PIN is incorrect');
          // Don't reset PIN inputs - let user see and correct
          setIsLoading(false);
          return;
        }

          // Set new code
          const setRes = await fetch(API_ENDPOINTS.admin.setAccessCode, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_id: adminId, newAccessCode: newCode, currentAccessCode: current }),
          });
        const setData = await safeJsonParse(setRes);
      if (setData.success) {
        toast.success('Access code changed successfully');
        onClose();
      } else {
        toast.error(setData.message || 'Failed to change access code');
      }
    } catch { toast.error('Failed to change access code'); }
    finally { setIsLoading(false); }
  };

  // Send OTP for reset
  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      const res = await fetch(API_ENDPOINTS.admin.sendAccessCodeOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId }),
      });
        const data = await safeJsonParse(res);
        if (data.success) {
          setOtpSent(true);
          toast.success('OTP sent to your email');
        } else { toast.error(data.message || 'Failed to send OTP'); }
    } catch { toast.error('Failed to send OTP'); }
    finally { setIsSendingOtp(false); }
  };

  // Reset with OTP
  const handleResetWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = resetNewPin.join('');
    if (code.length !== 4) { toast.error('Enter a 4-digit PIN'); return; }
    if (!otp) { toast.error('Enter the OTP'); return; }

    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.admin.resetAccessCode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: adminId, otp, newAccessCode: code }),
      });
      const data = await safeJsonParse(res);
      if (data.success) {
        toast.success('Access code reset successfully');
        onClose();
      } else { toast.error(data.message || 'Failed to reset'); }
    } catch { toast.error('Failed to reset access code'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-purple-200 p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-700" />
            <h2 className="text-lg font-bold text-purple-900">
              {view === 'menu' ? 'Access Code' : view === 'view-code' ? 'View Access Code' : view === 'change-code' ? 'Change Access Code' : 'Reset via OTP'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-purple-600" />
          </button>
        </div>

        <div className="p-6">
          {/* Menu */}
          {view === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={() => setView('view-code')}
                className="w-full flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-200 transition-colors text-left"
              >
                <div className="p-2 bg-purple-600 rounded-lg"><Eye className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-semibold text-purple-900">View Access Code</p>
                  <p className="text-sm text-purple-600">Verify your PIN to see it</p>
                </div>
              </button>

              <button
                onClick={() => setView('change-code')}
                className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors text-left"
              >
                <div className="p-2 bg-blue-600 rounded-lg"><Key className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-semibold text-blue-900">Change Access Code</p>
                  <p className="text-sm text-blue-600">Set a new 4-digit PIN</p>
                </div>
              </button>

              <button
                onClick={() => setView('reset-code')}
                className="w-full flex items-center gap-4 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors text-left"
              >
                <div className="p-2 bg-amber-500 rounded-lg"><RefreshCw className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-semibold text-amber-900">Reset via OTP</p>
                  <p className="text-sm text-amber-600">Forgot your PIN? Reset with email OTP</p>
                </div>
              </button>
            </div>
          )}

          {/* View Code */}
          {view === 'view-code' && (
            <div className="space-y-6">
              {!revealedCode ? (
                <form onSubmit={handleViewCode} className="space-y-6">
                  <p className="text-sm text-gray-600 text-center">Enter your current PIN to reveal it</p>
                  <PinInputGroup pins={viewPin} setPins={setViewPin} refs={viewPinRefs} autoFocus />
                  <button
                    type="submit"
                    disabled={isLoading || viewPin.join('').length !== 4}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Show'}
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">Your access code:</p>
                  <div className="flex justify-center gap-3">
                    {revealedCode.split('').map((digit, i) => (
                      <div key={i} className="w-14 h-14 flex items-center justify-center text-2xl font-bold bg-purple-100 border-2 border-purple-300 rounded-xl text-purple-900">
                        {showRevealed ? digit : '*'}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowRevealed(!showRevealed)}
                    className="flex items-center gap-2 mx-auto text-sm text-purple-600 hover:text-purple-800"
                  >
                    {showRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showRevealed ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
              <button onClick={() => { setView('menu'); setRevealedCode(null); setShowRevealed(false); setViewPin(['', '', '', '']); }} className="w-full text-sm text-purple-600 hover:text-purple-800 mt-4">
                Back to menu
              </button>
            </div>
          )}

          {/* Change Code */}
          {view === 'change-code' && (
            <form onSubmit={handleChangeCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Current PIN</label>
                <PinInputGroup pins={currentPin} setPins={setCurrentPin} refs={currentPinRefs} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">New PIN</label>
                <PinInputGroup pins={newPin} setPins={setNewPin} refs={newPinRefs} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Confirm New PIN</label>
                <PinInputGroup pins={confirmPin} setPins={setConfirmPin} refs={confirmPinRefs} />
              </div>
              <button
                type="submit"
                disabled={isLoading || currentPin.join('').length !== 4 || newPin.join('').length !== 4 || confirmPin.join('').length !== 4}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Changing...' : 'Change Access Code'}
              </button>
              <button type="button" onClick={() => { setView('menu'); setCurrentPin(['', '', '', '']); setNewPin(['', '', '', '']); setConfirmPin(['', '', '', '']); }} className="w-full text-sm text-purple-600 hover:text-purple-800">
                Back to menu
              </button>
            </form>
          )}

          {/* Reset via OTP */}
          {view === 'reset-code' && (
            <div className="space-y-5">
              {!otpSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">An OTP will be sent to your registered email address.</p>
                  <button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                  >
                    {isSendingOtp ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetWithOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-center text-lg tracking-widest"
                      placeholder="Enter OTP"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">New 4-digit PIN</label>
                    <PinInputGroup pins={resetNewPin} setPins={setResetNewPin} refs={resetPinRefs} />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !otp || resetNewPin.join('').length !== 4}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Resetting...' : 'Reset Access Code'}
                  </button>
                  <button type="button" onClick={handleSendOtp} disabled={isSendingOtp} className="w-full text-sm text-amber-600 hover:text-amber-800">
                    Resend OTP
                  </button>
                </form>
              )}
              <button onClick={() => { setView('menu'); setOtp(''); setOtpSent(false); setResetNewPin(['', '', '', '']); }} className="w-full text-sm text-purple-600 hover:text-purple-800">
                Back to menu
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
