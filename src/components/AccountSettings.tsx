import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Lock, Shield, Bell, Check, Trash2, History, LogOut, Gavel, Trophy } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { SuccessModal } from './SuccessModal';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { ChangeEmailModal } from './ChangeEmailModal';
import { ChangePhoneModal } from './ChangePhoneModal';
import { OTPVerificationModal } from './OTPVerificationModal';
import { ChangePasswordModal } from './ChangePasswordModal';
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner';
// import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';
import { motion, Variants } from "framer-motion";
import { API_ENDPOINTS } from '../lib/api-config';

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
  const [emailAlerts, setEmailAlerts] = useState(
    user.preferences?.emailNotifications ?? false
  );

  const [smsAlerts, setSmsAlerts] = useState(
    user.preferences?.smsNotifications ?? false
  );

  const [bidAlerts, setBidAlerts] = useState(
    user.preferences?.bidAlerts ?? false
  );

  const [winNotifications, setWinNotifications] = useState(
    user.preferences?.winNotifications ?? false
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Modal states
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePhone, setShowChangePhone] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [otpRecipient, setOtpRecipient] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);

  const formatIndianMobile = (input: string) => {
    // keep only digits
    const digits = input.replace(/\D/g, "").slice(0, 10);

    if (!digits) return "+91 ";

    let first = digits.slice(0, 5);
    let last = digits.slice(5);

    if (digits.length <= 5) {
      return `+91 ${first}`;
    }

    return `+91 ${first} ${last}`;
  };

  const handleDeleteAccount = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        toast.error("User ID not found.");
        return;
      }

      // Call API to mark account as deleted (isDeleted: true)
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

      // Update local state to reflect deletion
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


  // User data states
  const [fullName, setFullName] = useState(user.username);
  const [email, setEmail] = useState(user.email || 'player@dream60.com');
  const [phone, setPhone] = useState(formatIndianMobile(user.mobile || '+91 98765 43210'));

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Account settings saved successfully!', {
      description: 'Your personal information has been updated.',
    });
  };

  const handleChangeEmailSubmit = (newEmail: string) => {
    setPendingEmail(newEmail);
    setOtpType('email');
    setOtpRecipient(newEmail);
    setShowChangeEmail(false);
    setShowOTPVerification(true);
  };

  const handleChangePhoneSubmit = (newPhone: string) => {
    setPendingPhone(newPhone);
    setOtpType('phone');
    setOtpRecipient(newPhone);
    setShowChangePhone(false);
    setShowOTPVerification(true);
  };

  const handleOTPVerify = (_otp: string) => {
    if (otpType === 'email' && pendingEmail) {
      setEmail(pendingEmail);
      setPendingEmail('');
      toast.success('Email Updated!', {
        description: 'Your email address has been successfully updated.',
      });
    } else if (otpType === 'phone' && pendingPhone) {
      setPhone(pendingPhone);
      setPendingPhone('');
      toast.success('Phone Number Updated!', {
        description: 'Your phone number has been successfully updated.',
      });
    }

    setShowOTPVerification(false);
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
        ease: [0.42, 0, 0.58, 1] as [number, number, number, number], // cast it as tuple
      },
    }),
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <motion.div
        className="bg-white/70 backdrop-blur-xl border-b border-purple-200/50 shadow-lg shadow-purple-500/5 relative z-10"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 4,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-4 py-6 relative">
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-all group"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ x: [-2, 0, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-purple-700" />
            </motion.div>
            <span className="font-medium">Back to Auction</span>
          </motion.button>

          <motion.div
            className="mt-4 flex items-center gap-2 sm:gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{
                scale: 1.05,
                rotate: 5,
                transition: { duration: 0.2 }
              }}
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent truncate">
                Account Settings
              </h1>
              <p className="text-xs sm:text-sm text-purple-600/80 truncate">Manage your info & preferences</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-4xl relative z-10">
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {/* Profile Section */}

          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <form onSubmit={handleSaveChanges} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-200/50 overflow-hidden relative">
                {/* Card shine effect */}
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
                  {/* Full Name */}
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
                      // placeholder="Enter your full name"
                      className="bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                  </motion.div>

                  {/* Email Address */}
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

                  {/* Phone Number */}
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

                  {/* Address */}
                  {/* <motion.div
                    className="space-y-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-purple-500" />
                      <Label htmlFor="address" className="text-sm font-medium text-purple-900">
                        Address
                      </Label>
                    </div>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                  </motion.div>*/}

                  {/* Date of Birth */}
                  {/* <motion.div
                    className="space-y-2"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <Label htmlFor="dob" className="text-sm font-medium text-purple-900">
                        Date of Birth
                      </Label>
                    </div>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="bg-white/50 border-2 border-purple-400 text-purple-900 placeholder-purple-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-400/100 focus:outline-none focus-visible:outline-none transition-all duration-200 rounded-xl"
                    />
                  </motion.div>  */}
                </div>
              </div>

              {/* Save Profile Button */}
              {/* <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <motion.div className="flex-1 order-1 sm:order-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-5 sm:py-6 rounded-xl font-medium shadow-lg shadow-purple-500/30 transition-all text-sm sm:text-base"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Save Changes
                  </Button>
                </motion.div>
                <motion.div className="order-2 sm:order-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 rounded-xl border-purple-300 hover:bg-purple-50 text-purple-700 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </motion.div>
              </div> */}
            </form>
          </motion.div>

          {/* Notifications Section */}
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-200/50 overflow-hidden relative"
          >
            {/* Card shine effect */}
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
              {/* Push Notifications */}
              <motion.div
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-purple-50/50 transition-all"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-3">
                  <motion.div
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl    flex items-center justify-center flex-shrink-0"
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

              {/* Email Alerts */}
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
              {/* SMS Alerts */}
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

          {/* Security Section */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-200/50 overflow-hidden relative"
          >
            {/* Card shine effect */}
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

          {/* Auction History Section */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-200/50 overflow-hidden relative"
          >
            {/* Card shine effect */}
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

          {/* Danger Zone */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl shadow-red-500/10 border-2 border-red-200/50 overflow-hidden relative"
          >
            {/* Card shine effect */}
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
              {/* Delete Account */}
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

              {/* Sign Out */}
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
                        // setShowLogoutDialog(false);
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

      {/* Modals */}
      {showChangeEmail && (
        <ChangeEmailModal
          currentEmail={email}
          onClose={() => setShowChangeEmail(false)}
          onSubmit={handleChangeEmailSubmit}
        />
      )}

      {showChangePhone && (
        <ChangePhoneModal
          currentPhone={phone}
          onClose={() => setShowChangePhone(false)}
          onSubmit={handleChangePhoneSubmit}
        />
      )}

      {showOTPVerification && (
        <OTPVerificationModal
          type={otpType}
          recipient={otpRecipient}
          onClose={() => setShowOTPVerification(false)}
          onVerify={handleOTPVerify}
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