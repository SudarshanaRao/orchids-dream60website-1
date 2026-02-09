import { useState } from 'react';
import { Lock, Mail, ArrowLeft, Shield, Key, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../lib/api-config';

interface AdminLoginProps {
  onLogin: (adminUser: any) => void;
  onBack: () => void;
  onSignupClick?: () => void;
}

const SECRET_ACCESS_CODE = '841941';

export const AdminLogin = ({ onLogin, onBack, onSignupClick }: AdminLoginProps) => {
  const [accessCode, setAccessCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === SECRET_ACCESS_CODE) {
      setIsCodeVerified(true);
      toast.success('Access granted');
    } else {
      toast.error('Invalid access code');
      setAccessCode('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.adminLogin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Invalid admin credentials');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('admin_user_id', data.admin.admin_id);
      localStorage.setItem('admin_email', data.admin.email);
      localStorage.setItem('admin_username', data.admin.username);
      localStorage.setItem('admin_adminType', data.admin.adminType);
      localStorage.setItem('admin_login_time', String(Date.now()));
      
      toast.success('Login successful');
      onLogin(data.admin);
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Failed to connect to server');
      setIsLoading(false);
    }
  };

  if (!isCodeVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Restricted Access
              </h1>
              <p className="text-slate-400 text-sm">
                Enter the security code to proceed
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Access Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-red-500 text-white placeholder-slate-500 transition-colors"
                    placeholder="Enter access code"
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
              >
                Verify Access
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <p className="text-xs text-center text-slate-500">
                Unauthorized access attempts are logged
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-purple-500/30">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-purple-300 text-sm">Sign in with your credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Username / Email / Mobile
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData({ ...formData, identifier: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-slate-500 transition-colors"
                  placeholder="Enter username, email or mobile"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-slate-500 transition-colors"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
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
};
