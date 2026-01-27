import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Menu, X, User, LogOut, Shield, FileText, History, ArrowLeft, XCircle, Download, Sparkles, IndianRupee, LifeBuoy, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';
import { toast } from 'sonner';
import { IOSInstallGuide } from './IOSInstallGuide';

interface HeaderProps {
      user?: {
        id?: string;
        username: string;
        totalWins: number;
        totalLosses: number;
        totalClaimed?: number;
        totalAuctions: number;
      } | null;
      onNavigate?: (page: string) => void;
      onLogin?: () => void;
      onLogout?: () => void;
      onStartTutorial?: () => void;
      mobileMenuOpen?: boolean;
      setMobileMenuOpen?: (open: boolean) => void;
    }

  export function Header({ user, onNavigate, onLogin, onLogout, onStartTutorial, mobileMenuOpen: externalMobileMenuOpen, setMobileMenuOpen: externalSetMobileMenuOpen }: HeaderProps) {
    const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false);
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const dropdownRef = useState<HTMLDivElement | null>(null)[0];

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isExploreOpen && !(event.target as HTMLElement).closest('.explore-dropdown')) {
          setIsExploreOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExploreOpen]);
    
    // Use external state if provided, otherwise use internal state
      const mobileMenuOpen = externalMobileMenuOpen !== undefined ? externalMobileMenuOpen : internalMobileMenuOpen;
    const setMobileMenuOpen = externalSetMobileMenuOpen || setInternalMobileMenuOpen;
    const [hasNewHistory, setHasNewHistory] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>((window as any).deferredPWAPrompt);
    const [showInstallButton, setShowInstallButton] = useState(true); // Default to true to show manual install guide
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

  // PWA Install prompt handler
  useEffect(() => {
        const handler = (e: Event) => {
          console.log('✅ [PWA v2] beforeinstallprompt fired in Header');
          e.preventDefault();
          setDeferredPrompt(e);
          setShowInstallButton(true);
        };

        const pwaCapturedHandler = (e: Event) => {
          console.log('✅ [PWA v2] Header notified of global prompt capture');
          const customEvent = e as CustomEvent;
          if (customEvent.detail?.prompt) {
            setDeferredPrompt(customEvent.detail.prompt);
          } else if ((window as any).deferredPWAPrompt) {
            setDeferredPrompt((window as any).deferredPWAPrompt);
          }
          setShowInstallButton(true);
        };

        const pwaInstalledHandler = () => {
          console.log('✅ [PWA v2] App installed - hiding button');
          setShowInstallButton(false);
          setIsStandalone(true);
          setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('pwa-prompt-captured', pwaCapturedHandler);
        window.addEventListener('pwa-installed', pwaInstalledHandler);

        // Check if app is already installed
        const checkStandalone = () => {
          const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone || document.referrer.includes('android-app://');
          setIsStandalone(isStandaloneMode);
          if (isStandaloneMode) {
            setShowInstallButton(false);
          }
        };

        checkStandalone();
        window.addEventListener('appinstalled', pwaInstalledHandler);

        // Check if global prompt was already captured before component mounted
        if ((window as any).deferredPWAPrompt) {
          console.log('✅ [PWA v2] Found existing global prompt');
          setDeferredPrompt((window as any).deferredPWAPrompt);
          setShowInstallButton(true);
        }

        return () => {
          window.removeEventListener('beforeinstallprompt', handler);
          window.removeEventListener('pwa-prompt-captured', pwaCapturedHandler);
          window.removeEventListener('pwa-installed', pwaInstalledHandler);
          window.removeEventListener('appinstalled', pwaInstalledHandler);
        };
      }, []);

            const handleInstallClick = async () => {
              console.log('🔘 [PWA v2] Install button clicked');
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
              
              if (isIOS) {
                console.log('📱 [PWA v2] iOS detected - showing guide');
                setShowIOSGuide(true);
                return;
              }

              // Use either local state or global window variable
              const promptToUse = deferredPrompt || (window as any).deferredPWAPrompt;
              console.log('🔍 [PWA v2] Prompt available:', !!promptToUse);

              if (promptToUse) {
                try {
                  console.log('🚀 [PWA v2] Triggering native install prompt');
                  await promptToUse.prompt();
                  const { outcome } = await promptToUse.userChoice;
                  console.log(`👤 [PWA v2] User choice: ${outcome}`);
                  
                  if (outcome === 'accepted') {
                    toast.success('Dream60 installed!', {
                      description: 'You can now access Dream60 from your home screen.',
                    });
                    setShowInstallButton(false);
                  }
                  setDeferredPrompt(null);
                  (window as any).deferredPWAPrompt = null;
                  (window as any).pwaInstallReady = false;
                } catch (err) {
                  console.error('❌ [PWA v2] Install prompt error:', err);
                }
                return;
              }

              // Fallback guide if native prompt isn't available
              console.log('⚠️ [PWA v2] No native prompt - showing fallback');
              const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
              const isEdge = /Edg/.test(navigator.userAgent);
              const isAndroid = /Android/.test(navigator.userAgent);
            
            if (isStandalone) {
              toast.info('Dream60 already installed', {
                description: 'You are already using the Dream60 app.',
              });
              return;
            }

            if (isAndroid) {
              toast.info('Install Dream60', {
                description: 'Tap the menu (⋮) → "Install app" or "Add to Home screen"',
                duration: 8000,
              });
            } else if (isChrome || isEdge) {
              toast.info('Install Dream60', {
                description: 'Click the install icon (⊕) in the address bar, or use Menu → "Install Dream60..."',
                duration: 8000,
              });
            } else {
              toast.info('Install Dream60', {
                description: 'Use your browser menu to "Add to Home Screen" or "Install"',
                duration: 8000,
              });
            }
          };


      const [userStats, setUserStats] = useState<{ totalWins: number; totalLosses: number; totalClaimed: number }>(() => ({
        totalWins: user?.totalWins ?? 0,
        totalLosses: user?.totalLosses ?? 0,
        totalClaimed: user?.totalClaimed ?? 0,
      }));
      const [showStatsDot, setShowStatsDot] = useState(false);
  
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
  
            const newWins = stats.totalWins ?? user?.totalWins ?? 0;
            const newLosses = stats.totalLosses ?? user?.totalLosses ?? 0;
            const newClaimed = stats.totalClaimed ?? user?.totalClaimed ?? 0;
  
            // Check if stats changed from what we last SAW
            const lastSeenStatsStr = localStorage.getItem(`last_seen_stats_${userId}`);
            const lastSeenStats = lastSeenStatsStr ? JSON.parse(lastSeenStatsStr) : { totalWins: newWins, totalLosses: newLosses, totalClaimed: newClaimed };
            
            if (newWins !== lastSeenStats.totalWins || newLosses !== lastSeenStats.totalLosses || newClaimed !== (lastSeenStats.totalClaimed ?? 0)) {
              setShowStatsDot(true);
            }
  
            setUserStats({
              totalWins: newWins,
              totalLosses: newLosses,
              totalClaimed: newClaimed,
            });
          } catch (error) {
            console.error('Error fetching user stats:', error);
          }
        };
  
        fetchUserStats();
        const interval = setInterval(fetchUserStats, 60000);
        return () => clearInterval(interval);
      }, [user?.id, user?.totalWins, user?.totalLosses, user?.totalClaimed]);
  
      useEffect(() => {
        if (user?.totalWins !== undefined || user?.totalLosses !== undefined || user?.totalClaimed !== undefined) {
          setUserStats({
            totalWins: user?.totalWins ?? 0,
            totalLosses: user?.totalLosses ?? 0,
            totalClaimed: user?.totalClaimed ?? 0,
          });
        }
      }, [user?.totalWins, user?.totalLosses, user?.totalClaimed]);

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
        localStorage.setItem(`last_seen_stats_${user.id}`, JSON.stringify(userStats));
        setHasNewHistory(false);
        setShowStatsDot(false);
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
          className="bg-white/50 backdrop-blur-xl border-b border-purple-200/30 shadow-lg shadow-purple-500/10 sticky top-0 z-50"
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
                  Live Auction Platform
                </motion.p>

              </div>
            </motion.div>

            {/* Mobile Install App & Menu Buttons */}
              <div className="lg:hidden flex items-center gap-2">
                  <motion.button
                    onClick={handleInstallClick}
                    className="text-purple-700 p-2.5 hover:bg-purple-50/80 rounded-xl transition-all relative z-10 backdrop-blur-sm border border-purple-200/50 shadow-md"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Install App"
                    data-tutorial-target="pwa-install" data-whatsnew-target="pwa-install"
                  >
                  <Download className="w-5 h-5" />
                </motion.button>

                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-purple-700 p-2.5 hover:bg-purple-50/80 rounded-xl transition-all relative z-10 backdrop-blur-sm border border-purple-200/50 shadow-md"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showStatsDot && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
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
            </div>

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
                    className="hidden xl:flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-purple-200/50 shadow-md shadow-purple-500/5 hover:bg-purple-50/80 transition-all cursor-pointer relative"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showStatsDot && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
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
                          <History className="w-4 h-4 text-purple-600" />
                        </motion.div>
                        <span className="text-sm font-medium text-purple-700">{userStats.totalClaimed} Claimed</span>
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
                      {/* Explore Dropdown */}
                      <div className="relative explore-dropdown">
                          <motion.button
                            onClick={() => setIsExploreOpen(!isExploreOpen)}
                            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${isExploreOpen ? 'bg-purple-100 text-purple-800' : 'text-purple-600 hover:bg-purple-50'}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Menu className="w-4 h-4" />
                            <span className="text-sm font-medium">Menu</span>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
                          </motion.button>

                        <AnimatePresence>
                          {isExploreOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-purple-100 py-2 z-[60] backdrop-blur-xl"
                            >
                              <button
                                onClick={() => { onNavigate?.('rules'); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Rules</span>
                              </button>
                              <button
                                onClick={() => { onNavigate?.('participation'); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">Play Guide</span>
                              </button>
                              <button
                                onClick={() => { onNavigate?.('transactions'); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <IndianRupee className="w-4 h-4" />
                                <span className="text-sm font-medium">Transactions</span>
                              </button>
                              <button
                                onClick={() => { onNavigate?.('support'); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <LifeBuoy className="w-4 h-4" />
                                <span className="text-sm font-medium">Support</span>
                              </button>
                              <div className="h-px bg-purple-50 my-1 mx-2" />
                              <button
                                onClick={() => { onStartTutorial?.(); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-medium">What's new</span>
                              </button>
                                {showInstallButton && (
                                  <button
                                    onClick={() => { handleInstallClick(); setIsExploreOpen(false); }}
                                    className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span className="text-sm font-medium">Install App</span>
                                  </button>
                                )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                      size="sm"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Logout
                    </Button>
                  </motion.div>

                    {/* User Profile Button */}
                    <motion.button
                      onClick={() => onNavigate?.('profile')}
                      className="flex items-center space-x-2 text-purple-700 hover:text-purple-800 bg-white/70 hover:bg-purple-50 px-3 py-2 rounded-xl transition-all border border-purple-200/50 shadow-md backdrop-blur-sm"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="w-8 h-8 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-full flex items-center justify-center shadow-md flex-shrink-0"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <span className="text-white text-sm font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                      </motion.div>
                      <span className="font-medium text-sm truncate max-w-[100px]">{user.username}</span>
                    </motion.button>

                </>
              ) : (
                /* Guest Navigation */
                <div className="flex items-center space-x-1.5">
                    {/* Explore Dropdown for Guests */}
                    <div className="relative explore-dropdown">
                      <motion.button
                        onClick={() => setIsExploreOpen(!isExploreOpen)}
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all ${isExploreOpen ? 'bg-purple-100 text-purple-800' : 'text-purple-600 hover:bg-purple-50'}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Menu className="w-4 h-4" />
                        <span className="text-sm font-medium">Explore</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExploreOpen ? 'rotate-180' : ''}`} />
                      </motion.button>

                      <AnimatePresence>
                        {isExploreOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-purple-100 py-2 z-[60] backdrop-blur-xl"
                          >
                            <button
                              onClick={() => { onNavigate?.('rules'); setIsExploreOpen(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">Rules</span>
                            </button>
                            <button
                              onClick={() => { onNavigate?.('participation'); setIsExploreOpen(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              <span className="text-sm font-medium">How to Play</span>
                            </button>
                            <button
                              onClick={() => { onNavigate?.('support'); setIsExploreOpen(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                            >
                              <LifeBuoy className="w-4 h-4" />
                              <span className="text-sm font-medium">Support</span>
                            </button>
                            {showInstallButton && (
                              <button
                                onClick={() => { handleInstallClick(); setIsExploreOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-purple-50 text-purple-700 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                <span className="text-sm font-medium">Install APP</span>
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

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
                      <p className="text-xs text-purple-200">Live Auction Platform</p>
                    </div>
                  </motion.div>

                  {/* User Info or Welcome */}
                  {user && (
                    <motion.div
                      className="mt-4 flex items-center justify-center space-x-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20"
                      variants={menuItemVariants}
                    >
                      <div className="relative group flex items-center justify-center">
                        {/* Premium Glowing Pulse Loader */}
                        <motion.div 
                          className="absolute inset-x-[-4px] inset-y-[-4px] border-2 border-white/40 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0, 0.5],
                            borderWidth: ['2px', '1px', '2px']
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div 
                          className="absolute inset-x-[-8px] inset-y-[-8px] border border-white/20 rounded-full"
                          animate={{ 
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0, 0.3]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative z-10 border border-white/40 transition-transform group-hover:scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                          <span className="text-white font-bold">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{user.username}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-200 relative">
                                <span className="flex items-center">
                                  <Trophy className="w-3 h-3 mr-1" />
                                  {userStats.totalWins} Wins
                                </span>
                                <span className="flex items-center">
                                  <History className="w-3 h-3 mr-1" />
                                  {userStats.totalClaimed} Claimed
                                </span>
                                <span className="flex items-center">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  {userStats.totalLosses ?? 0} Losses
                                </span>
                              {showStatsDot && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
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
                              onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
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
                              onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                              data-whatsnew-target="mobile-support"
                            >
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <LifeBuoy className="w-5 h-5 text-purple-600" />
                              </div>
                              <span className="font-medium text-purple-900">Support</span>
                            </button>
                          </motion.div>


                        <motion.div variants={menuItemVariants}>
                          <button
                            onClick={() => { handleInstallClick(); setMobileMenuOpen(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                            data-tutorial-target="pwa-install" data-whatsnew-target="pwa-install"
                          >
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <Download className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-medium text-purple-900">Install APP</span>
                          </button>
                        </motion.div>

                        <motion.div variants={menuItemVariants}>
                          <button
                            onClick={() => { onStartTutorial?.(); setMobileMenuOpen(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                            data-tutorial-target="tutorial-trigger"
                          >
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-medium text-purple-900">What's new</span>
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
                                onClick={() => { onNavigate?.('transactions'); setMobileMenuOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                                data-whatsnew-target="mobile-transactions"
                              >
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                  <IndianRupee className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-medium text-purple-900">Transactions</span>
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
                            onClick={() => { onNavigate?.('participation'); setMobileMenuOpen(false); }}
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
                            onClick={() => { onNavigate?.('support'); setMobileMenuOpen(false); }}
                            className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                          >
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                              <LifeBuoy className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="font-medium text-purple-900">Support</span>
                          </button>
                        </motion.div>


                            <motion.div variants={menuItemVariants}>
                              <button
                                onClick={() => { handleInstallClick(); setMobileMenuOpen(false); }}
                                className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl hover:bg-purple-50 transition-all text-left group"
                                data-tutorial-target="pwa-install" data-whatsnew-target="pwa-install"
                              >
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                  <Download className="w-5 h-5 text-purple-600" />
                                </div>
                                <span className="font-medium text-purple-900">Install APP</span>
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
        <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </>
    );
  }