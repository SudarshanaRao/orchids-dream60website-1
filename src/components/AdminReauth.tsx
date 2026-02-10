import { useState, useRef } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface AdminReauthProps {
  adminUser: { admin_id: string; username: string; email: string; adminType: string };
  onReauth: (adminUser: any) => void;
  onFullLogin: () => void;
}

export const AdminReauth = ({ adminUser, onReauth, onFullLogin }: AdminReauthProps) => {
  const [accessCode, setAccessCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPins = [...accessCode];
    newPins[index] = value.slice(-1);
    setAccessCode(newPins);
    if (value && index < 3) {
      setTimeout(() => pinRefs[index + 1]?.current?.focus(), 0);
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !accessCode[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setAccessCode(pasted.split(''));
      pinRefs[3]?.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          admin_id: adminUser.admin_id,
          accessCode: code,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { success: false, message: `Server returned ${response.status}` };
      }

      if (data.success) {
        toast.success('Session restored');
        onReauth(adminUser);
      } else {
        toast.error(data.message || 'Invalid access code');
      }
    } catch (error) {
      toast.error('Failed to verify access code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Session Expired</h1>
            <p className="text-slate-400 text-sm">
              Hi <span className="text-white font-medium">{adminUser.username}</span>, your 30-minute session has expired.
            </p>
            <p className="text-slate-400 text-sm mt-1">Enter your personal access code to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePinPaste}>
              {accessCode.map((digit, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  autoFocus={i === 0}
                  className="w-14 h-14 text-center text-2xl font-bold bg-slate-900/50 border-2 border-slate-600 rounded-xl focus:outline-none focus:border-amber-500 text-white transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || accessCode.join('').length !== 4}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 shadow-lg"
            >
              {isLoading ? 'Verifying...' : 'Continue Session'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <button
              onClick={onFullLogin}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Sign in with full credentials instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
