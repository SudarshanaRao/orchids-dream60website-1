import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Lock, Shield, Bell, Check, Trash2, History, LogOut, Gavel, Trophy, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { SuccessModal } from './SuccessModal';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { ChangeEmailModal } from './ChangeEmailModal';
import { ChangePhoneModal } from './ChangePhoneModal';
import { NewEmailInputModal } from './NewEmailInputModal';
import { NewPhoneInputModal } from './NewPhoneInputModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { NotificationPermissionCard } from './NotificationPermissionCard';
import { LoadingProfile } from './LoadingProfile';
import { toast } from 'sonner';
import { motion, Variants } from "framer-motion";
import { API_ENDPOINTS, buildQueryString } from '../lib/api-config';

interface AccountSettingsProps {
  user: {
    username: string;
    email?: string;
    mobile?: string;

    preferences?: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      bidAlerts: boolean;
      winNotifications: boolean;
    };
  };

  onBack: () => void;
  onNavigate?: (page: string) => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
}


export function AccountSettings({ user, onBack, onNavigate, onDeleteAccount, onLogout }: AccountSettingsProps) {
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userDataError, setUserDataError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [emailAlerts, setEmailAlerts] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [bidAlerts, setBidAlerts] = useState(false);
  const [winNotifications, setWinNotifications] = useState(false);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [showNewEmailInput, setShowNewEmailInput] = useState(false);
  const [showNewPhoneInput, setShowNewPhoneInput] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const formatIndianMobile = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 10);

    if (!digits) return "+91 ";

    let first = digits.slice(0, 5);
    let last = digits.slice(5);

    if (digits.length <= 5) {
      return `+91 ${first}`;
    }

    return `+91 ${first} ${last}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingUser(true);
        setUserDataError(null);

        const userId = localStorage.getItem('user_id');
        
        if (!userId) {
          throw new Error('User ID not found in localStorage');
        }

        const queryParams = buildQueryString({ user_id: userId });
        const response = await fetch(`${API_ENDPOINTS.auth.deleteAccount}${queryParams}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.user) {
          const userData = data.user;
          
          setFullName(userData.username || userData.name || '');
          setEmail(userData.email || '');
          setPhone(formatIndianMobile(userData.mobile || userData.phone || ''));

          if (userData.preferences) {
            setEmailAlerts(userData.preferences.emailNotifications ?? false);
            setSmsAlerts(userData.preferences.smsNotifications ?? false);
            setBidAlerts(userData.preferences.bidAlerts ?? false);
            setWinNotifications(userData.preferences.winNotifications ?? false);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserDataError(error instanceof Error ? error.message : 'Failed to load user data');
        toast.error('Failed to load user data', {
          description: 'Please try refreshing the page.',
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  const handleDeleteAccount = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        toast.error("User ID not found.");
        return;
      }

      const res = await fetch(API_ENDPOINTS.auth.deleteAccount, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          isDeleted: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to delete account");
        return;
      }

      setIsDeleted(true);

      toast.success("Account Deleted", {
        description: "Your account has been permanently deleted.",
      });

      setShowDeleteDialog(false);
      onDeleteAccount?.();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while deleting the account.");
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Account settings saved successfully!', {
      description: 'Your personal information has been updated.',
    });
  };

  const handleOldEmailVerified = () => {
    setShowChangeEmail(false);
    setShowNewEmailInput(true);
  };

  const handleOldPhoneVerified = () => {
    setShowChangePhone(false);
    setShowNewPhoneInput(true);
  };

  const handleEmailChangeSuccess = (newEmail: string) => {
    setEmail(newEmail);
    setShowNewEmailInput(false);
  };

  const handlePhoneChangeSuccess = (newPhone: string) => {
    setPhone(newPhone);
    setShowNewPhoneInput(false);
  };

  const handleNavigateToSupport = () => {
    onNavigate?.('support');
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const userId = localStorage.getItem("user_id");

      const res = await fetch(API_ENDPOINTS.auth.updatePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          oldPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update password");
        return;
      }

      toast.success("Password Updated!", {
        description: "Your password has been successfully updated.",
      });

      setShowChangePassword(false);

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again later.");
    }
  };

  const handleSavePreferences = async () => {
    try {
      const userId = localStorage.getItem("user_id");

      const res = await fetch(API_ENDPOINTS.user.updatePreferences, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          emailNotifications: emailAlerts,
          smsNotifications: smsAlerts,
          bidAlerts: bidAlerts,
          winNotifications: winNotifications,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to update preferences");
        return;
      }

      toast.success("Preferences Updated!", {
        description: "Your notification preferences have been saved.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.42, 0, 0.58, 1] as [number, number, number, number],
      },
    }),
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <LoadingProfile />
      </div>
    );
  }

  if (userDataError) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        
        <div className="flex items-center justify-center min-h-screen relative z-10 px-4">
          <motion.div
            className="text-center space-y-4 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-purple-900">Unable to Load Account</h2>
            <p className="text-purple-600">{userDataError}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white"
              >
                Retry
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Go Back
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
              <div className="hidden sm:flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <h1 className="text-lg font-bold text-purple-800">Account Settings</h1>
              </div>
            </div>
            
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Play</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div 
        className="flex sm:hidden items-center space-x-2 mb-4 px-3 pt-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <User className="w-5 h-5 text-purple-600" />
        <h1 className="text-xl font-bold text-purple-800">Account Settings</h1>
      </motion.div>

      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 md:py-8 max-w-4xl relative z-10">
        <div className="space-y-4 sm:space-y-5 md:space-y-6">

          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <form onSubmit={handleSaveChanges} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-inner shadow-purple-500/20 border border-purple-200/50 overflow-hidden relative">

                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
                  initial={{ x: '-100%', y: '-100%' }}
                  animate={{ x: '100%', y: '100%' }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: "easeInOut"
                  }}
                />

                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/80 backdrop-blur-sm relative">
                  <div className="flex items-center gap-2">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                    </motion.div>
                    <h2 className="text-base sm:text-lg font-semibold text-purple-900">Personal Information</h2>
                  </div>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 relative">
                  <motion.div
                    className="space-y-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-500" />
                      <Label htmlFor="fullName" className="text-sm font-medium text-purple-900">
                        USERNAME
                      </Label>
                    </div>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled
                      className="bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-500" />
                        <Label htmlFor="email" className="text-sm font-medium text-purple-900">
                          Email Address
                        </Label>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setShowChangeEmail(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Change
                      </motion.button>
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-purple-50/80 border-purple-300 cursor-not-allowed text-purple-700 rounded-xl"
                    />
                  </motion.div>

                  <motion.div
                    className="space-y-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-purple-500" />
                        <Label htmlFor="phone" className="text-sm font-medium text-purple-900">
                          Phone Number
                        </Label>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setShowChangePhone(true)}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Change
                      </motion.button>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      disabled
                      className="bg-purple-50/80 border-purple-300 cursor-not-allowed text-purple-700 rounded-xl"
                    />
                  </motion.div>
                </div>
              </div>
            </form>
          </motion.div>

          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-inner shadow-purple-500/20 border border-purple-200/50 overflow-hidden relative"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
            />

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/80 backdrop-blur-sm relative">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </motion.div>
                <h2 className="text-base sm:text-lg font-semibold text-purple-900">Notification Preferences</h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 relative">
              <motion.div
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Gavel className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base truncate">Bid Alerts</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">Get alerts on your device</div>
                  </div>
                </div>
                <Switch
                  checked={bidAlerts}
                  onCheckedChange={setBidAlerts}
                  className="data-[state=checked]:bg-red-600 flex-shrink-0"
                />
              </motion.div>

              <motion.div
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base truncate">Email Alerts</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">Receive important updates via email</div>
                  </div>
                </div>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                  className="data-[state=checked]:bg-purple-600 flex-shrink-0"
                />
              </motion.div>

              <motion.div
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base truncate">Win Notifications</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">Get notified when you win an auction</div>
                  </div>
                </div>
                <Switch
                  checked={winNotifications}
                  onCheckedChange={setWinNotifications}
                  className="data-[state=checked]:bg-purple-600 flex-shrink-0"
                />
              </motion.div>

              <motion.div
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base truncate">SMS Alerts</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">Get SMS notifications for transactions</div>
                  </div>
                </div>
                <Switch
                  checked={smsAlerts}
                  onCheckedChange={setSmsAlerts}
                  className="data-[state=checked]:bg-purple-600 flex-shrink-0"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 pt-4 border-t border-purple-200/50"
              >
                <NotificationPermissionCard 
                  userId={localStorage.getItem('user_id') || undefined}
                  showTitle={false}
                />
              </motion.div>
            </div>

            <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSavePreferences}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-5 sm:py-6 rounded-xl shadow-lg shadow-purple-500/30 text-sm sm:text-base"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Save Preferences
                </Button>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-inner shadow-purple-500/20 border border-purple-200/50 overflow-hidden relative"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
            />

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/80 backdrop-blur-sm relative">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </motion.div>
                <h2 className="text-base sm:text-lg font-semibold text-purple-900">Security</h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 relative">
              <motion.div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base">Change Password</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">Update your account password</div>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 text-sm sm:text-base py-5 sm:py-2"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-inner shadow-purple-500/20 border border-purple-200/50 overflow-hidden relative"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
            />

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-purple-200/50 bg-gradient-to-r from-purple-50/80 to-purple-100/80 backdrop-blur-sm relative">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                </motion.div>
                <h2 className="text-base sm:text-lg font-semibold text-purple-900">Auction History</h2>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 relative">
              <motion.div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <History className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </motion.div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-purple-900 text-sm sm:text-base">View Auction History</div>
                    <div className="text-xs sm:text-sm text-purple-600 truncate">See all your past auction activities</div>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                  <Button
                    onClick={() => onNavigate?.('history')}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/30 text-sm sm:text-base py-5 sm:py-2"
                  >
                    <History className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/60 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-inner shadow-purple-500/20 border-2 border-red-200/50 overflow-hidden relative"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: '100%', y: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut"
              }}
            />

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-red-200/50 bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-sm relative">
              <h2 className="text-base sm:text-lg font-semibold text-red-900">Danger Zone</h2>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 relative">
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                <div>
                  <h3 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">Delete Account</h3>
                  <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">
                    Deleting your account removes all data. This cannot be undone.
                  </p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="destructive"
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30 text-sm sm:text-base py-5 sm:py-2"
                      disabled={isDeleted}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleted ? "Account Deleted" : "Delete My Account"}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                className="pt-4 border-t border-red-100"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 rounded-xl hover:bg-orange-50/50 transition-all">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <motion.div
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0"
                      whileHover={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-purple-900 text-sm sm:text-base">Sign Out</div>
                      <div className="text-xs sm:text-sm text-purple-600 truncate">Sign out from your account securely</div>
                    </div>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        toast.info('Signed Out', {
                          description: 'You have been signed out successfully.',
                        });
                        onLogout?.();
                      }}
                      variant="outline"
                      className="w-full sm:w-auto border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 shadow-md shadow-orange-500/20 text-sm sm:text-base py-5 sm:py-2"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      {showChangeEmail && (
        <ChangeEmailModal
          currentEmail={email}
          onClose={() => setShowChangeEmail(false)}
          onOldEmailVerified={handleOldEmailVerified}
          onNavigateToSupport={handleNavigateToSupport}
        />
      )}

      {showNewEmailInput && (
        <NewEmailInputModal
          currentEmail={email}
          onClose={() => setShowNewEmailInput(false)}
          onSuccess={handleEmailChangeSuccess}
        />
      )}

      {showChangePhone && (
        <ChangePhoneModal
          currentPhone={phone}
          onClose={() => setShowChangePhone(false)}
          onOldPhoneVerified={handleOldPhoneVerified}
          onNavigateToSupport={handleNavigateToSupport}
        />
      )}

      {showNewPhoneInput && (
        <NewPhoneInputModal
          currentPhone={phone}
          onClose={() => setShowNewPhoneInput(false)}
          onSuccess={handlePhoneChangeSuccess}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSubmit={handleChangePassword}
        />
      )}

      {showSuccess && (
        <SuccessModal
          title="Success!"
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {showDeleteDialog && (
        <DeleteAccountDialog
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
