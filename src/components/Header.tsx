import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, Clock, Menu, X, User, LogOut, Shield, FileText, History, ArrowLeft, XCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';

interface HeaderProps {
  user?: {
    id?: string;
    username: string;
    totalWins: number;
    totalLosses: number;
    totalAuctions: number;
  } | null;
  onNavigate?: (page: string) => void;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ user, onNavigate, onLogin, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasNewHistory, setHasNewHistory] = useState(false);
  const [userStats, setUserStats] = useState<{ totalWins: number; totalLosses: number }>({ totalWins: 0, totalLosses: 0 });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // PWA Install prompt handler
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  // Fetch user stats from backend API
  useEffect(() => {
    const fetchUserStats = async () => {
      const userId = user?.id || localStorage.getItem('user_id');
      if (!userId) return;

      try {
        const queryString = buildQueryString({ userId });
        const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}${queryString}`);
        if (!response.ok) return;

        const result = await response.json();
        const stats = result.stats || result.data?.stats || {};

        setUserStats({
          totalWins: stats.totalWins ?? user?.totalWins ?? 0,
          totalLosses: stats.totalLosses ?? user?.totalLosses ?? 0,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
    const interval = setInterval(fetchUserStats, 60000);
    return () => clearInterval(interval);
  }, [user?.id, user?.totalWins, user?.totalLosses]);

  useEffect(() => {
    if (user?.totalWins !== undefined || user?.totalLosses !== undefined) {
      setUserStats({
        totalWins: user?.totalWins ?? 0,
        totalLosses: user?.totalLosses ?? 0,
      });
    }
  }, [user?.totalWins, user?.totalLosses]);

  // Check for new auction history entries
  useEffect(() => {
    if (!user?.id) {
      setHasNewHistory(false);
      return;
    }

    const checkNewHistory = async () => {
      try {
        const lastViewedTime = localStorage.getItem(`auction_history_last_viewed_${user.id}`);
        const lastViewedTimestamp = lastViewedTime ? parseInt(lastViewedTime, 10) : 0;

        const queryString = buildQueryString({ userId: user.id });
        const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}${queryString}`);
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          // Check if any entry was created or updated after last viewed time
          const hasNew = result.data.some((entry: any) => {
            const entryTime = new Date(entry.updatedAt || entry.createdAt || entry.joinedAt).getTime();
            return entryTime > lastViewedTimestamp;
          });
          setHasNewHistory(hasNew);
        } else {
          setHasNewHistory(false);
        }
      } catch (error) {
        console.error('Error checking auction history:', error);
      }
    };

    checkNewHistory();
    // Poll every 30 seconds
    const interval = setInterval(checkNewHistory, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Mark history as viewed when navigating to history page
  const handleNavigateToHistory = () => {
    if (user?.id) {
      localStorage.setItem(`auction_history_last_viewed_${user.id}`, Date.now().toString());
      setHasNewHistory(false);
    }
    onNavigate?.('history');
  };

  const overlayVariants = {
    hidden: {
      opacity: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any }
    },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as any }
    }
  };



  const menuVariants = {
    hidden: {
      scale: 0.95,
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
        when: "beforeChildren",
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };


  const menuItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <motion.header
        className="bg-white/70 backdrop-blur-xl border-b border-purple-200/50 shadow-lg shadow-purple-500/5 sticky top-0 z-50 overflow-hidden"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        {/* Animated shine effect */}
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

        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 relative">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => onNavigate?.('home')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0"
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
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </motion.div>
              <div className="min-w-0">
                <motion.h1
                  className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent truncate"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Dream60
                </motion.h1>
                <motion.p
                  className="text-[10px] sm:text-xs hidden sm:block 
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC]
  bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Live Auction Play
                </motion.p>

              </div>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-purple-700 p-2.5 hover:bg-purple-50/80 rounded-xl transition-all relative z-10 backdrop-blur-sm border border-purple-200/50 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Desktop Navigation & User Area */}
            <motion.div
              className="hidden lg:flex items-center space-x-3 xl:space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {user ? (
                <>
                  {/* User Stats - Clickable */}
                  <motion.button
                    onClick={handleNavigateToHistory}
                    className="hidden xl:flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-purple-200/50 shadow-md shadow-purple-500/5 hover:bg-purple-50/80 transition-all cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Trophy className="w-4 h-4 text-green-600" />
                      </motion.div>
                      <span className="text-sm font-medium text-green-700">{userStats.totalWins} Wins</span>
                    </motion.div>
                    <div className="w-px h-5 bg-purple-300"></div>
                    <motion.div
                      className="flex items-center space-x-2"
                      whileHover={{ x: 2 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                      </motion.div>
                      <span className="text-sm font-medium text-red-600">{userStats.totalLosses ?? 0} Losses</span>
                    </motion.div>
                  </motion.button>

                  {/* Navigation Links */}
                  <div className="flex items-center space-x-1.5">
                    {/* PWA Install Button - Only on large screens */}
                    {showInstallButton && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={handleInstallClick}
                          variant="ghost"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1.5" />
                          Install App
                        </Button>
                      </motion.div>
                    )}

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('rules')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all"
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-1.5" />
                        Rules
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('play-guide')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 hidden xl:flex transition-all"
                        size="sm"
                      >
                        <Shield className="w-4 h-4 mr-1.5" />
                        Play Guide
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => onNavigate?.('support')}
                        variant="ghost"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all"
                        size="sm"
                      >
                        Support
                      </Button>
                    </motion.div>
                  </div>

                  {/* Logout Button - Only on large screens */}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="hidden xl:block"
                  >
                    <Button
                      onClick={onLogout}
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Logout
                    </Button>
                  </motion.div>

                  {/* User Profile Button */}
                  <motion.button
                    onClick={() => onNavigate?.('profile')}
                    className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 bg-white/70 hover:bg-purple-50/80 px-3 py-2 rounded-xl transition-all border border-purple-200/50 shadow-md shadow-purple-500/5 backdrop-blur-sm"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-full flex items-center justify-center shadow-md"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-white text-sm font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                    </motion.div>
                    <span className="font-medium text-sm">{user.username}</span>
                  </motion.button>
                </>
              ) : (
                /* Guest Navigation */
                <div className="flex items-center space-x-1.5">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('rules')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 transition-all"
                      size="sm"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Rules
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('participation')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 hidden xl:flex transition-all"
                      size="sm"
                    >
                      How to Play
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => onNavigate?.('support')}
                      variant="ghost"
                      className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-100/90 transition-all"
                      size="sm"
                    >
                      Support
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onLogin}
                      size="lg"
                      className="
                        rounded-xl
                        bg-gradient-to-r from-[#5E3A8A] via-[#7A4FB0] to-[#9A6ED6]
                        text-white font-semibold
                        hover:from-[#7A4FB0] hover:to-[#9A6ED6]
                        shadow-xl shadow-[#9A6ED6]/30
                        transition-all duration-300
                        hover:scale-[1.02]
                      "
                    >
                      Login
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Popup */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Popup Menu */}
            <motion.div
              className="fixed inset-x-0 top-0 z-[70] lg:hidden flex items-start justify-center pt-10 px-4 pointer-events-none"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <motion.div
                className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-purple-500/20 border border-purple-200/50 overflow-hidden pointer-events-auto relative"
                variants={menuVariants}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
                  initial={{ x: '-100%', y: '-100%' }}
                  animate={{ x: '100%', y: '100%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />

                {/* Header with Logo and Back Button */}
                <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-4 pb-6">
                  {/* Back Button */}
                  <motion.button
                    onClick={() => { onNavigate?.('home'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-1.5 text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm px-2.5 py-1.5 rounded-xl transition-all mb-3 border border-white/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </motion.button>

                  <motion.div
                    className="flex items-center justify-center space-x-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                    >
                      <Clock className="w-7 h-7 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Dream60</h2>
                      <p className="text-xs text-purple-200">Live Auction Play</p>
                    </div>
                  </motion.div>

                  {/* User Info or Welcome */}
                  {user && (
                    <motion.div
                      className="mt-4 flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                      variants={menuItemVariants}
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{user.username}</p>
                        <div className="flex items-center space-x-3 text-xs text-purple-200">
                          <span className="flex items-center">
                            <Trophy className="w-3 h-3 mr-1" />
                            {userStats.totalWins} Wins
                          </span>
                          <span className="flex items-center">
                            <XCircle className="w-3 h-3 mr-1" />
                            {userStats.totalLosses ?? 0} Losses
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto relative">
                  {user ? (
                    <>
                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('rules'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Rules</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('play-guide'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Play Guide</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Participation</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Support</span>
                        </button>
                      </motion.div>

                      {/* Divider */}
                      <div className="border-t border-purple-200/50 my-3"></div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { handleNavigateToHistory(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group relative"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors relative">
                            <History className="w-5 h-5 text-purple-600" />
                            {hasNewHistory && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-purple-900">Auction History</span>
                          {hasNewHistory && (
                            <span className="ml-auto text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">New</span>
                          )}
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('profile'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <User className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Profile Settings</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onLogout?.(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-5 h-5 text-red-600" />
                          </div>
                          <span className="font-medium text-red-700">Logout</span>
                        </button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('rules'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Rules</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('play-guide'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Play Guide</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">How to Play</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants}>
                        <button
                          onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                          className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                            <Shield className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="font-medium text-purple-900">Support</span>
                        </button>
                      </motion.div>

                      <motion.div variants={menuItemVariants} className="pt-2">
                        <Button
                          onClick={() => { onLogin?.(); setMobileMenuOpen(false); }}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/30 py-6 rounded-xl"
                        >
                          Login to Continue
                        </Button>
                      </motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}