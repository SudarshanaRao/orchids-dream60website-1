import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HowDream60Works } from './components/HowDream60Works';
import { Header } from './components/Header';
import { AuctionGrid } from './components/AuctionGrid';
import { AuctionSchedule } from './components/AuctionSchedule';
import { AuctionScheduleInfo } from './components/AuctionScheduleInfo';
import { PrizeShowcase } from './components/PrizeShowcase';
import { Footer } from './components/Footer';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { RefundPolicy } from './components/RefundPolicy';
import { Support } from './components/Support';
import { Contact } from './components/Contact';
import { Rules } from './components/Rules';
import { Participation } from './components/Participation';
import { AboutUs } from './components/AboutUs';
import { ComingSoon } from './components/ComingSoon';
import { CareersForm } from './components/CareersForm';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { EntrySuccessModal } from './components/EntrySuccessModal';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentFailure } from './components/PaymentFailure';
import { Leaderboard } from './components/Leaderboard';
import { AuctionLeaderboard } from './components/AuctionLeaderboard';
import { AccountSettings } from './components/AccountSettings';
import { AuctionHistory } from './components/AuctionHistory';
import { AuctionDetailsPage } from './components/AuctionDetailsPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ViewGuide } from './components/ViewGuide';
import { WinningTips } from './components/WinningTips';
import { SupportChatPage } from './components/SupportChatPage';
import { TesterFeedback } from './components/TesterFeedback';
import { TransactionHistoryPage } from './components/TransactionHistoryPage';
import { PrizeShowcasePage } from './components/PrizeShowcasePage';
import { AdminSignup } from './components/AdminSignup';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { WinnerClaimBanner } from './components/WinnerClaimBanner';
import { WinnersAnnouncedBanner } from './components/WinnersAnnouncedBanner';
import { AmazonVoucherModal } from './components/AmazonVoucherModal';
import { ChristmasHeroBanner } from './components/ChristmasHeroBanner';
import { toast } from 'sonner';
import { parseAPITimestamp } from './utils/timezone';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Sonner } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { BrowserRouter } from 'react-router-dom';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useActivityTracker } from './hooks/useActivityTracker';

// ✅ Create QueryClient instance
const queryClient = new QueryClient();

// ✅ Cache version - increment to invalidate all user localStorage caches on deploy
const CACHE_VERSION = 'v3';
const CACHE_VERSION_KEY = 'dream60_cache_version';

// Clear stale caches if version changed
(() => {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  if (storedVersion !== CACHE_VERSION) {
    // Preserve only essential session keys
    const preserveKeys = ['user_id', 'username', 'email', 'admin_user_id', 'admin_email', 'admin_username', 'admin_userType', 'admin_isSuperAdmin', 'countdown_completed', 'push-permission-asked', 'push-subscribed', 'push-user-id'];
    const preserved: Record<string, string> = {};
    preserveKeys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) preserved[key] = val;
    });
    localStorage.clear();
    Object.entries(preserved).forEach(([k, v]) => localStorage.setItem(k, v));
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  }
})();

// ✅ unified types
import type {
  Auction,
  AnyBox,
  EntryBox,
  RoundBox,
  BoxStatus,
} from "./types/auction";

// ✅ Server time interface
interface ServerTime {
  timestamp: number;
  iso: string;
  hour: number;
  minute: number;
  second: number;
  date: string;
  time: string;
  timezone: string;
  utcOffset: string;
}

// ✅ Server time offset state
let serverTimeOffset: number = 0;

// ✅ Fetch server time from API - only once on mount
const fetchServerTime = async (): Promise<ServerTime | null> => {
  try {
    const response = await fetch(API_ENDPOINTS.serverTime);
    const data = await response.json();
    
    if (data.success && data.data) {
      // Calculate offset between server time and local time
      const localTime = Date.now();
      serverTimeOffset = data.data.timestamp - localTime;
      console.log('✅ Server time offset calculated:', serverTimeOffset, 'ms');
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching server time:', error);
    return null;
  }
};

// ✅ Get current server time using offset (no API call needed)
const getCurrentServerTime = (): ServerTime => {
  const now = Date.now() + serverTimeOffset;
  const date = new Date(now);
  
  return {
    timestamp: now,
    iso: date.toISOString(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    date: date.toISOString().split('T')[0],
    time: date.toTimeString().split(' ')[0],
    timezone: 'UTC',
    utcOffset: '+00:00'
  };
};

const getCurrentAuctionSlot = (serverTime: ServerTime | null) => {
  if (!serverTime) return null;
  
  const hour = serverTime.hour;
  if (hour < 9 || hour >= 19) {
    return null;
  }

  return hour;
};

const getCurrentRoundByTime = (serverTime: ServerTime | null) => {
  if (!serverTime) return 1;
  
  const minutes = serverTime.minute;

  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 45) return 3;
  return 4;
};

const getRoundBoxTimes = (auctionHour: number, roundNumber: number, serverTime: ServerTime | null) => {
  const startMinutes = (roundNumber - 1) * 15;
  const endMinutes = roundNumber * 15;

  const baseTimestamp = serverTime ? serverTime.timestamp : Date.now();
  const baseDate = new Date(baseTimestamp);
  
  const opensAt = new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate(),
    auctionHour,
    startMinutes,
    0
  ));
  
  const closesAt = new Date(Date.UTC(
    baseDate.getUTCFullYear(),
    baseDate.getUTCMonth(),
    baseDate.getUTCDate(),
    auctionHour,
    endMinutes,
    0
  ));

  return { opensAt, closesAt };
};

const generateDemoLeaderboard = (roundNumber: number) => {
  const usernames = [
    "BidKing2024", "AuctionPro", "WinnerX", "Player123", "GameMaster99",
    "LuckyBidder", "ProBidder", "ChampionBid", "BidWarrior", "ElitePlayer",
    "MegaBidder", "TopGun", "AcePlayer", "StarBidder", "VictorySeeker",
    "BidNinja", "AuctionHero", "PrizeFighter", "BidMaster", "WinStreak"
  ];

  const base = 200 + roundNumber * 10;
  const topBidAmount = Math.floor(Math.random() * 300) + base;
  const secondBidAmount = topBidAmount - Math.floor(Math.random() * 50) - 20;
  const thirdBidAmount = secondBidAmount - Math.floor(Math.random() * 40) - 10;

  const leaderboard: {
    username: string;
    bid: number;
    timestamp: Date;
  }[] = [];

  const usedUsernames = new Set<string>();

  const getUniqueUsername = () => {
    let username;
    let attempts = 0;
    do {
      const baseName = usernames[Math.floor(Math.random() * usernames.length)];
      username = attempts > 0 ? `${baseName}${attempts}` : baseName;
      attempts++;
    } while (usedUsernames.has(username));
    usedUsernames.add(username);
    return username;
  };

  const firstPlaceCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < firstPlaceCount; i++) {
    leaderboard.push({
      username: getUniqueUsername(),
      bid: topBidAmount,
      timestamp: new Date(Date.now() - Math.random() * 900000)
    });
  }

  const secondPlaceCount = 40;
  for (let i = 0; i < secondPlaceCount; i++) {
    leaderboard.push({
      username: getUniqueUsername(),
      bid: secondBidAmount,
      timestamp: new Date(Date.now() - Math.random() * 900000)
    });
  }

  const thirdPlaceCount = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < thirdPlaceCount; i++) {
    leaderboard.push({
      username: getUniqueUsername(),
      bid: thirdBidAmount,
      timestamp: new Date(Date.now() - Math.random() * 900000)
    });
  }

  leaderboard.sort((a, b) => {
    if (b.bid !== a.bid) return b.bid - a.bid;
    return a.timestamp.getTime() - b.timestamp.getTime();
  });

  return leaderboard.map((entry) => ({
    ...entry,
    round: roundNumber,
  }));
};

const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const auctionGridRef = useRef<HTMLDivElement>(null);

  const handleBidNowScroll = () => {
    if (auctionGridRef.current) {
      auctionGridRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      auctionGridRef.current.classList.add('highlight-auction-grid');
      setTimeout(() => {
        auctionGridRef.current?.classList.remove('highlight-auction-grid');
      }, 2000);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [serverTime, setServerTime] = useState<ServerTime | null>(null);

    const [currentPage, setCurrentPage] = useState(() => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  
    // Redirect to coming-soon if it's before the launch time (11:58 PM)
    const now = new Date();
    const launchDate = new Date();
    launchDate.setHours(23, 58, 0, 0);
    // If it's already past today's 11:58 PM, the target is tomorrow's 11:58 PM
    if (launchDate < now) launchDate.setDate(launchDate.getDate() + 1);
    
    // Check if we've already completed the countdown
    const hasCompletedCountdown = sessionStorage.getItem('countdown_completed') === 'true' || localStorage.getItem('countdown_completed') === 'true';

    if (path === '/' && now < launchDate && !hasCompletedCountdown) {
      window.history.replaceState({}, '', '/coming-soon');
      return 'coming-soon';
    }

    if (path === '/d60-ctrl-x9k7') {
      const adminUserId = localStorage.getItem('admin_user_id');
      return adminUserId ? 'admin-dashboard' : 'admin-login';
    }
    if (path === '/d60-ctrl-x9k7/signup') return 'admin-signup';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot';
    if (path === '/rules') return 'rules';
    if (path === '/participation') return 'participation';
    if (path === '/about') return 'about';
    // If countdown completed, redirect /coming-soon to home
    if (path === '/coming-soon') {
      const hasCompletedCountdown = sessionStorage.getItem('countdown_completed') === 'true' || localStorage.getItem('countdown_completed') === 'true';
      if (hasCompletedCountdown) {
        window.history.replaceState({}, '', '/');
        return 'game';
      }
      return 'coming-soon';
    }
    if (path === '/careers') return 'careers';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/refund') return 'refund';
    if (path === '/support') return 'support';
    if (path === '/contact') return 'contact';
    if (path === '/profile') return 'profile';
    if (path === '/history' || path.startsWith('/history/')) return 'history';
    if (path === '/leaderboard') return 'leaderboard';
    if (path === '/view-guide') return 'view-guide';
    if (path === '/winning-tips') return 'winning-tips';
    if (path === '/support-chat') return 'support-chat';
    if (path === '/tester-feedback') return 'tester-feedback';
    if (path === '/transactions' || path.startsWith('/transactions/')) return 'transactions';
    if (path === '/prizeshowcase') return 'prizeshowcase';
    if (path === '/success-page' || path === '/payment/success' || path === '/payment/result') return 'payment-success';
    if (path === '/failure-page' || path === '/payment/failure') return 'payment-failure';

    return 'game';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const searchParams = new URLSearchParams(window.location.search);
      
      // Redirect to coming-soon if it's before the launch time (11:58 PM)
      const now = new Date();
      const launchDate = new Date();
      launchDate.setHours(23, 58, 0, 0);
      if (launchDate < now) launchDate.setDate(launchDate.getDate() + 1);

      const hasCompletedCountdown = sessionStorage.getItem('countdown_completed') === 'true' || localStorage.getItem('countdown_completed') === 'true';

      if (path === '/' && now < launchDate && !hasCompletedCountdown) {
        window.history.replaceState({}, '', '/coming-soon');
        setCurrentPage('coming-soon');
        return;
      }

      if (path === '/d60-ctrl-x9k7') {
        const adminUserId = localStorage.getItem('admin_user_id');
        setCurrentPage(adminUserId ? 'admin-dashboard' : 'admin-login');
      } else if (path === '/d60-ctrl-x9k7/signup') setCurrentPage('admin-signup');
      else if (path === '/login') setCurrentPage('login');
      else if (path === '/signup') setCurrentPage('signup');
      else if (path === '/forgot-password') setCurrentPage('forgot');
      else if (path === '/rules') setCurrentPage('rules');
      else if (path === '/participation') setCurrentPage('participation');
      else if (path === '/about') setCurrentPage('about');
        else if (path === '/coming-soon') {
          // If countdown completed, redirect /coming-soon to home
          if (hasCompletedCountdown) {
            window.history.replaceState({}, '', '/');
            setCurrentPage('game');
          } else {
            setCurrentPage('coming-soon');
          }
        }
        else if (path === '/careers') setCurrentPage('careers');
      else if (path === '/terms') setCurrentPage('terms');
      else if (path === '/privacy') setCurrentPage('privacy');
      else if (path === '/refund') setCurrentPage('refund');
      else if (path === '/support') setCurrentPage('support');
      else if (path === '/contact') setCurrentPage('contact');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/success-page' || path === '/payment/success' || path === '/payment/result') {
        setCurrentPage('payment-success');
        setRecentPaymentSuccess(true);
        recentPaymentTimestamp.current = Date.now();

        const orderId = searchParams.get('orderId') || searchParams.get('txnId');
        const hourlyAuctionId = searchParams.get('hourlyAuctionId');
        
        // Safety: Prevent modal reopening on refresh
        const sessionKey = `entry_done_${orderId}`;
        const alreadyShown = sessionStorage.getItem(sessionKey);

        if (orderId && !alreadyShown) {
          // Verify payment status from backend using unified endpoint
          fetch(`${API_ENDPOINTS.payments.status}?orderId=${orderId}`)
            .then(res => res.json())
            .then(data => {
              if (data.success && data.status === 'paid') {
                sessionStorage.setItem(sessionKey, 'true');
                
                // For entry fee and claim, show success data
                  const successData = {
                    amount: data.amount,
                    type: data.paymentType === 'PRIZE_CLAIM' ? 'claim' : 'entry',
                    boxNumber: 0,
                    auctionId: data.auctionId,
                    transactionId: data.orderId,
                    transactionTime: data.transactionDate || data.paidAt || data.createdAt,
                    hourlyAuctionId: data.auctionId,
                    productName: data.paymentType === 'PRIZE_CLAIM' ? 'Winner Prize Claim' : 'Auction Entry Fee',
                    timeSlot: data.auctionData?.timeSlot
                  };
                
                setShowEntrySuccess(successData as any);
                // ✅ CRITICAL: Do NOT show the secondary detail modal on the result page to avoid duplicates
                setShowEntrySuccessDetail(null);
              }
            })
            .catch(err => console.error("Error verifying payment status:", err));
        }

        const cookieData = document.cookie.split('; ').find(row => row.startsWith('airpay_txn_data='));
        
        if (cookieData) {
          try {
            const airpayData = JSON.parse(decodeURIComponent(cookieData.split('=')[1]));
              setShowEntrySuccess({
                amount: Number(airpayData.amount),
                type: airpayData.paymentType === 'PRIZE_CLAIM' ? 'claim' : 'entry',
                boxNumber: 0,
                auctionId: airpayData.auctionId,
                transactionId: airpayData.txnId || airpayData.orderId,
                transactionTime: airpayData.transactionTime || airpayData.airpayResponse?.transaction_time || airpayData.transactionDate || airpayData.paidAt || airpayData.createdAt,
                paymentMethod: airpayData.method,
                upiId: airpayData.upiId,
                bankName: airpayData.bankName,
                cardName: airpayData.cardName,
                cardNumber: airpayData.cardNumber,
                productName: airpayData.paymentType === 'PRIZE_CLAIM' ? 'Winner Prize Claim' : 'Auction Entry Fee',
                timeSlot: 'Active',
                hourlyAuctionId: airpayData.hourlyAuctionId
              } as any);
            document.cookie = "airpay_txn_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          } catch (e) {
            console.error("Error parsing airpay cookie", e);
          }
        } else if (orderId || hourlyAuctionId) {
          setShowEntrySuccess(prev => ({
            ...(prev || {}),
            amount: Number(searchParams.get('amount')) || 0,
            type: searchParams.get('type') === 'claim' ? 'claim' : 'entry',
            boxNumber: 0,
            transactionId: orderId || '',
            hourlyAuctionId: hourlyAuctionId || ''
          } as any));
        }
      }
      else if (path === '/failure-page' || path === '/payment/failure') {
        setCurrentPage('payment-failure');
        const txnId = searchParams.get('txnId');
        const cookieData = document.cookie.split('; ').find(row => row.startsWith('airpay_txn_data='));

        if (cookieData) {
          try {
            const airpayData = JSON.parse(decodeURIComponent(cookieData.split('=')[1]));
              setShowEntryFailure({
                entryFee: Number(airpayData.amount),
                errorMessage: airpayData.message || 'Payment failed',
                auctionId: airpayData.auctionId,
                transactionId: airpayData.txnId || airpayData.orderId,
                transactionTime: airpayData.transactionTime || airpayData.airpayResponse?.transaction_time || airpayData.transactionDate || airpayData.paidAt || airpayData.createdAt,
                paymentMethod: airpayData.method,
                upiId: airpayData.upiId,
                bankName: airpayData.bankName,
                cardName: airpayData.cardName,
                  cardNumber: airpayData.cardNumber
                } as any);
              document.cookie = "airpay_txn_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            } catch (e) {
              console.error("Error parsing airpay cookie", e);
            }
          } else if (txnId) {
            setShowEntryFailure(prev => prev ? { ...prev, transactionId: txnId } as any : { entryFee: 0, errorMessage: 'Payment failed', transactionId: txnId } as any);
          }
        }
      else if (path === '/history' || path.startsWith('/history/')) {
        setCurrentPage('history');
        if (path === '/history') {
          setSelectedAuctionDetails(null);
        }
      } else if (path === '/leaderboard') setCurrentPage('leaderboard');
      else if (path === '/view-guide') setCurrentPage('view-guide');
      else if (path === '/winning-tips') setCurrentPage('winning-tips');
      else if (path === '/support-chat') setCurrentPage('support-chat');
      else if (path === '/tester-feedback') setCurrentPage('tester-feedback');
      else if (path === '/transactions' || path.startsWith('/transactions/')) setCurrentPage('transactions');
      else if (path === '/prizeshowcase') setCurrentPage('prizeshowcase');
      else setCurrentPage('game');
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const initializeServerTime = async () => {
      const time = await fetchServerTime();
      if (time) {
        setServerTime(time);
      }
    };
    initializeServerTime();
    const interval = setInterval(() => {
      setServerTime(getCurrentServerTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout>;
    const scheduleHourlyRefresh = () => {
      const now = Date.now() + serverTimeOffset;
      const date = new Date(now);
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const milliseconds = date.getUTCMilliseconds();
      const msUntilNextHour = ((60 - minutes) * 60 * 1000) - (seconds * 1000) - milliseconds;
      refreshTimeout = setTimeout(() => {
        window.location.reload();
      }, msUntilNextHour);
    };
    scheduleHourlyRefresh();
    return () => { if (refreshTimeout) clearTimeout(refreshTimeout); };
  }, []);

  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return null;
    return {
      id: userId,
      username: localStorage.getItem("username") || '',
      email: localStorage.getItem("email") || '',
      totalWins: 0,
      totalLosses: 0,
      totalAmountSpent: 0,
      totalAmountWon: 0
    };
  });

  const mapUserData = (userData: any) => {
    return {
      id: userData.user_id || userData.id,
      username: userData.username,
      mobile: userData.mobile,
      email: userData.email,
      isDeleted: userData.isDeleted || false,
      totalAuctions: userData.stats?.totalAuctions ?? userData.totalAuctions ?? 0,
      totalWins: userData.stats?.totalWins ?? userData.totalWins ?? 0,
      totalLosses: userData.stats?.totalLosses ?? userData.totalLosses ?? 0,
      totalClaimed: userData.stats?.totalClaimed ?? userData.totalClaimed ?? 0,
      totalAmountSpent: userData.stats?.totalSpent ?? userData.totalAmountSpent ?? 0,
      totalAmountWon: userData.stats?.totalWon ?? userData.totalAmountWon ?? 0,
      userType: userData.userType || 'PLAYER',
      userCode: userData.userCode || '',
      preferences: userData.preferences || {
        emailNotifications: true,
        smsNotifications: true,
        bidAlerts: true,
        winNotifications: true,
      },
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
    };
  };

  const fetchAndSetUser = async (userId: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.auth.me.base}?user_id=${userId}`);
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) return;
      const result = await response.json();
        if (result.success && result.user) {
          const mappedUser = mapUserData(result.user);
          setCurrentUser(mappedUser);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const [adminUser, setAdminUser] = useState<any | null>(() => {
    const adminUserId = localStorage.getItem('admin_user_id');
    if (!adminUserId) return null;
    return {
      user_id: adminUserId,
      username: localStorage.getItem("admin_username") || 'admin',
      email: localStorage.getItem("admin_email") || '',
      userType: 'ADMIN',
      userCode: '#ADMIN',
      isSuperAdmin: localStorage.getItem("admin_isSuperAdmin") === 'true'
    };
  });
  const [selectedAuctionDetails, setSelectedAuctionDetails] = useState<any | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/history/details' || path.startsWith('/history/details')) {
      const storedAuction = localStorage.getItem('selectedAuctionDetails');
      if (storedAuction) {
        try {
          const parsedAuction = JSON.parse(storedAuction);
          parsedAuction.date = new Date(parsedAuction.date);
          if (parsedAuction.claimDeadline) parsedAuction.claimDeadline = new Date(parsedAuction.claimDeadline);
          if (parsedAuction.claimedAt) parsedAuction.claimedAt = new Date(parsedAuction.claimedAt);
          setSelectedAuctionDetails(parsedAuction);
        } catch (error) {
          localStorage.removeItem('selectedAuctionDetails');
        }
      }
    }
  }, []);

  const [showEntrySuccess, setShowEntrySuccess] = useState<any | null>(null);
  const [showEntrySuccessDetail, setShowEntrySuccessDetail] = useState<any | null>(null);
  const [showEntryFailure, setShowEntryFailure] = useState<any | null>(null);
  const [showBidSuccess, setShowBidSuccess] = useState<any | null>(null);
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<any | null>(null);
  const [selectedPrizeShowcaseAuctionId, setSelectedPrizeShowcaseAuctionId] = useState<string | null>(null);

  const currentPathForTracking = currentPage === 'game' ? '/' : `/${currentPage}`;
  useActivityTracker(
    currentUser?.id || null,
    currentUser?.username || null,
    currentPathForTracking
  );

  const generateRandomEntryFee = () => Math.floor(Math.random() * 2501) + 1000;

  const [currentAuction, setCurrentAuction] = useState<Auction>(() => {
    const entryFee1 = generateRandomEntryFee();
    const entryFee2 = generateRandomEntryFee();
    const auctionHour = 9;
    const today = new Date();
    const startTime = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), auctionHour, 0, 0));
    
    return {
      id: 'auction-1',
      title: 'Mega Auction',
      prize: 'iPhone 15 Pro',
      prizeValue: 129900,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000),
      currentRound: 1,
      totalParticipants: 0,
      userHasPaidEntry: false,
      auctionHour,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: [
        { id: 1, type: "entry", isOpen: true, currentBid: 0, bidder: null, entryFee: entryFee1, hasPaid: false },
        { id: 2, type: "entry", isOpen: true, currentBid: 0, bidder: null, entryFee: entryFee2, hasPaid: false },
        { id: 3, type: "round", roundNumber: 1, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: new Date(), closesAt: new Date(), leaderboard: [] },
        { id: 4, type: "round", roundNumber: 2, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: new Date(), closesAt: new Date(), leaderboard: [] },
        { id: 5, type: "round", roundNumber: 3, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: new Date(), closesAt: new Date(), leaderboard: [] },
        { id: 6, type: "round", roundNumber: 4, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: new Date(), closesAt: new Date(), leaderboard: [] },
      ]
    };
  });

  const [isAuctionSectionsVisible, setIsAuctionSectionsVisible] = useState(true);

  useEffect(() => {
    if (currentAuction.userHasPaidEntry) {
      setIsAuctionSectionsVisible(true);
    }
  }, [currentAuction.userHasPaidEntry]);

  useEffect(() => {
    if (!serverTime) return;
    const currentHour = getCurrentAuctionSlot(serverTime);
    if (!currentHour) return;
    if (currentAuction.auctionHour !== currentHour) {
      const entryFee1 = generateRandomEntryFee();
      const entryFee2 = generateRandomEntryFee();
      const today = new Date(serverTime.timestamp);
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), currentHour, 0, 0);
      const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), currentHour + 1, 0, 0);
      const roundBoxes: RoundBox[] = [1, 2, 3, 4].map((roundNum) => {
        const { opensAt, closesAt } = getRoundBoxTimes(currentHour, roundNum, serverTime);
        return { id: roundNum + 2, type: "round", roundNumber: roundNum, isOpen: false, minBid: 10, currentBid: 0, bidder: null, opensAt, closesAt, leaderboard: [], status: "upcoming" };
      });
      setCurrentAuction(prev => ({
        ...prev,
        id: `auction-${currentHour}`,
        startTime,
        endTime,
        auctionHour: currentHour,
        currentRound: getCurrentRoundByTime(serverTime),
        boxes: [
          { id: 1, type: "entry", isOpen: true, entryFee: entryFee1, currentBid: 0, bidder: null, hasPaid: false, status: "upcoming" },
          { id: 2, type: "entry", isOpen: true, entryFee: entryFee2, currentBid: 0, bidder: null, hasPaid: false, status: "upcoming" },
          ...roundBoxes
        ],
      }));
    }
  }, [serverTime]);

  const [currentHourlyAuctionId, setCurrentHourlyAuctionId] = useState<string | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [previousRound, setPreviousRound] = useState<number>(1);
  const [forceRefetchTrigger, setForceRefetchTrigger] = useState<number>(0);
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);
  const [liveAuctionData, setLiveAuctionData] = useState<any>(null);
  const [isLoadingLiveAuction, setIsLoadingLiveAuction] = useState<boolean>(true);
  const [upcomingAuctionData, setUpcomingAuctionData] = useState<any>(null);
  const [upcomingCountdown, setUpcomingCountdown] = useState<string>('00:00:00');
  const [isUpcomingAuctionVisible, setIsUpcomingAuctionVisible] = useState(false);

  const calculateCountdown = useCallback((targetTimeStr: string, auctionDateStr?: string, currentTime?: number) => {
    if (!targetTimeStr || !currentTime) return '00:00:00';
    const [targetHours, targetMinutes] = targetTimeStr.split(':').map(Number);
    const auctionDate = auctionDateStr ? new Date(auctionDateStr) : new Date(currentTime);
    const target = new Date(Date.UTC(auctionDate.getUTCFullYear(), auctionDate.getUTCMonth(), auctionDate.getUTCDate(), targetHours, targetMinutes, 0, 0));
    if (!auctionDateStr && target.getTime() <= currentTime) target.setUTCDate(target.getUTCDate() + 1);
    const totalSecondsRemaining = Math.floor((target.getTime() - currentTime) / 1000);
    if (totalSecondsRemaining <= 0) return '00:00:00';
    const hours = Math.floor(totalSecondsRemaining / 3600);
    const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
    const seconds = totalSecondsRemaining % 60;
    return hours > 0 ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!serverTime) return;
    const updateCountdown = () => {
      if (upcomingAuctionData?.TimeSlot) {
        setUpcomingCountdown(calculateCountdown(upcomingAuctionData.TimeSlot, upcomingAuctionData.auctionDate, serverTime.timestamp));
      } else {
        const totalSecondsRemaining = 3600 - (serverTime.minute * 60 + serverTime.second);
        setUpcomingCountdown(`${Math.floor(totalSecondsRemaining / 60).toString().padStart(2, '0')}:${(totalSecondsRemaining % 60).toString().padStart(2, '0')}`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [serverTime, upcomingAuctionData, calculateCountdown]);

  const fetchUpcomingAuction = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.scheduler.firstUpcomingProduct);
      const data = await response.json();
      if (data.success && data.data) setUpcomingAuctionData(data.data);
      else setUpcomingAuctionData(null);
    } catch (error) { console.error('Error fetching upcoming auction:', error); }
  }, []);

  useEffect(() => {
    if (!serverTime) return;
    fetchUpcomingAuction();
    const pollInterval = setInterval(fetchUpcomingAuction, 300000);
    return () => clearInterval(pollInterval);
  }, [fetchUpcomingAuction, serverTime?.hour]);

  const hasInitiallyLoaded = useRef(false);
  const [tutorialStartToken, setTutorialStartToken] = useState<number>(0);
  const [forceTutorialShow, setForceTutorialShow] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAmazonVoucherModal, setShowAmazonVoucherModal] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [dailyStats, setDailyStats] = useState({ totalAuctions: 6, totalPrizeValue: 350000 });
  const [recentPaymentSuccess, setRecentPaymentSuccess] = useState<boolean>(false);
  const recentPaymentTimestamp = useRef<number>(0);

  const whatsNewSteps: TutorialStep[] = [
    { id: 'welcome', title: 'Welcome to Dream60!', description: 'Win amazing prizes with just ₹60!', targetElement: '[data-whatsnew-target="prize-showcase"]', position: 'bottom', action: () => handleNavigate('game') },
    { id: 'transactions', title: 'Transaction History', description: 'Track all your entry fees.', targetElement: '[data-whatsnew-target="transactions"]', mobileTargetElement: '[data-whatsnew-target="mobile-transactions"]', position: 'bottom', action: () => handleNavigate('game'), mobileAction: () => setMobileMenuOpen(true) },
    { id: 'auction-schedule', title: 'Daily Auction Schedule', description: 'Join auctions from 2:30 PM.', targetElement: '[data-whatsnew-target="auction-schedule"]', position: 'top', scrollBlock: 'start', action: () => { setMobileMenuOpen(false); handleNavigate('game'); }, mobileAction: () => setMobileMenuOpen(false) },
    { id: 'support', title: 'Need Help?', description: 'Access 24/7 support.', targetElement: '[data-whatsnew-target="support"]', mobileTargetElement: '[data-whatsnew-target="mobile-support"]', position: 'bottom', action: () => handleNavigate('game'), mobileAction: () => setMobileMenuOpen(true) },
    { id: 'pwa-install', title: 'Install Dream60 App', description: 'Install Dream60 on your device.', targetElement: '[data-whatsnew-target="pwa-install"]', position: 'bottom', action: () => setMobileMenuOpen(false), mobileAction: () => setMobileMenuOpen(false) },
  ];

  const handleStartTutorial = () => {
    setForceTutorialShow(true);
    setTutorialStartToken(Date.now());
  };

  const fetchLiveAuction = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingLiveAuction(true);
    try {
      const response = await fetch(API_ENDPOINTS.scheduler.liveAuction, { cache: 'no-store' });
      if (!response.ok) { setLiveAuctionData(null); return; }
      const result = await response.json();
      if (result.success && result.data) {
        setLiveAuctionData(result.data);
        setCurrentAuction(prev => ({ ...prev, prize: result.data.auctionName || prev.prize, prizeValue: result.data.prizeValue || prev.prizeValue, totalParticipants: result.data.participants?.length || prev.totalParticipants }));
      } else setLiveAuctionData(null);
    } catch (error) { console.error('Error fetching live auction:', error); }
    finally { setIsLoadingLiveAuction(false); }
  }, []);

  useEffect(() => { fetchLiveAuction(forceRefetchTrigger === 0); }, [fetchLiveAuction, forceRefetchTrigger]);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleNextFetch = () => {
      const now = Date.now() + serverTimeOffset;
      const date = new Date(now);
      const nextMarkMinutes = (Math.floor(date.getUTCMinutes() / 15) + 1) * 15;
      const msToWait = (nextMarkMinutes - date.getUTCMinutes()) * 60 * 1000 - date.getUTCSeconds() * 1000 - date.getUTCMilliseconds() + 2000;
      timerId = setTimeout(() => { fetchLiveAuction(false); scheduleNextFetch(); }, msToWait);
    };
    scheduleNextFetch();
    return () => { if (timerId) clearTimeout(timerId); };
  }, [fetchLiveAuction]);

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.scheduler.dailyAuction, { cache: 'no-store' });
          if (!response.ok) return;
          const result = await response.json();
            if (result.success && result.data) {
              const auctionConfig = result.data.dailyAuctionConfig || [];
            const activeAuctions = auctionConfig.filter((a: any) => a.Status !== 'CANCELLED');
            const totalPrize = activeAuctions.reduce((sum: number, a: any) => sum + (a.prizeValue || 0), 0);
            setDailyStats({ totalAuctions: activeAuctions.length || 6, totalPrizeValue: totalPrize || 350000 });
        }
      } catch (error) { console.error('Error fetching daily stats:', error); }
    };
    fetchDailyStats();
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const adminUserId = localStorage.getItem("admin_user_id");
        if (adminUserId && (currentPage === 'admin-login' || currentPage === 'admin-dashboard')) {
          setAdminUser({ user_id: adminUserId, username: localStorage.getItem("admin_username") || 'admin', email: localStorage.getItem("admin_email") || '', userType: 'ADMIN', userCode: '#ADMIN', isSuperAdmin: localStorage.getItem("admin_isSuperAdmin") === 'true' });
          if (currentPage === 'admin-login') setCurrentPage("admin-dashboard");
          return;
        }
        const userId = localStorage.getItem("user_id");
        if (!userId) return;
          setCurrentUser(mapUserData({ user_id: userId, username: localStorage.getItem("username") || '', email: localStorage.getItem("email") || '', totalWins: 0, totalLosses: 0, totalAmountSpent: 0, totalAmountWon: 0 }));
      } catch (error) { console.error("Session restore error:", error); }
    };
    checkExistingSession();
  }, [currentPage]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [currentPage]);

  useEffect(() => { if (currentUser?.id) fetchAndSetUser(currentUser.id); }, [currentUser?.id]);

  useEffect(() => {
    if (!serverTime || !currentUser?.id || !currentAuction.userHasPaidEntry) return;
    const currentRound = getCurrentRoundByTime(serverTime);
    if (currentRound !== previousRound) {
      setPreviousRound(currentRound);
      setForceRefetchTrigger(prev => prev + 1);
    }
  }, [serverTime, currentUser?.id, currentAuction.userHasPaidEntry, previousRound]);

  useEffect(() => {
    const fetchCurrentAuctionId = async (showLoading = false) => {
      if (!currentUser?.id) return;
      if (justLoggedIn) setJustLoggedIn(false);
      if (showLoading && !hasInitiallyLoaded.current) setIsLoadingLiveAuction(true);
      try {
          const response = await fetch(API_ENDPOINTS.scheduler.liveAuction, { cache: 'no-store' });
          if (!response.ok) return;
          const result = await response.json();
          if (result.success && result.data?.hourlyAuctionId) {
            setCurrentHourlyAuctionId(result.data.hourlyAuctionId);
            setLiveAuctionData(result.data);
            const liveAuction = result.data;
          const userBidsMap: any = {};
          const userQualificationMap: any = {};
          let userHasPaid = false;
          let userEntryFee = 10;
          const participant = liveAuction.participants?.find((p: any) => p.playerId === currentUser.id);
          if (participant) { userHasPaid = true; userEntryFee = participant.entryFee; }
          liveAuction.rounds?.forEach((round: any) => {
            const bid = round.playersData?.find((p: any) => p.playerId === currentUser.id);
            if (bid?.auctionPlacedAmount) userBidsMap[round.roundNumber] = bid.auctionPlacedAmount;
            if (round.roundNumber === 1) userQualificationMap[1] = true;
            else if (participant) userQualificationMap[round.roundNumber] = !participant.isEliminated;
          });
          setCurrentAuction(prev => {
            const isPaymentValid = localStorage.getItem(`payment_${currentUser.id}_${prev.id}`) === 'true' && Date.now() < parseInt(localStorage.getItem(`payment_${currentUser.id}_${prev.id}_expiry`) || '0');
            const finalPaid = userHasPaid || isPaymentValid || (prev.userHasPaidEntry && prev.id === `auction-${result.data.auctionHour}`) || (recentPaymentSuccess && Date.now() - recentPaymentTimestamp.current < 3600000);
            const updatedBoxes = prev.boxes.map(box => {
              if (box.type === 'round') {
                const roundBox = box as RoundBox;
                const roundData = liveAuction.rounds?.find((r: any) => r.roundNumber === roundBox.roundNumber);
                let updated = { ...roundBox, winnersAnnounced: liveAuction.winnersAnnounced };
                if (roundBox.roundNumber === 1) updated.minBid = userEntryFee;
                else {
                  const prevData = liveAuction.rounds?.find((r: any) => r.roundNumber === roundBox.roundNumber - 1);
                  if (prevData?.playersData?.length > 0) {
                    const highest = Math.max(...prevData.playersData.map((p: any) => p.auctionPlacedAmount));
                    const config = liveAuction.roundConfig?.find((rc: any) => rc.round === roundBox.roundNumber);
                    updated.minBid = highest - Math.floor(highest * (config?.roundCutoffPercentage || 0) / 100);
                  } else updated.minBid = userEntryFee;
                }
                if (roundData) {
                  if (roundData.startedAt) updated.opensAt = new Date(roundData.startedAt);
                  if (roundData.completedAt) updated.closesAt = new Date(roundData.completedAt);
                  else if (roundData.startedAt) updated.closesAt = new Date(new Date(roundData.startedAt).getTime() + 15 * 60 * 1000);
                  updated.status = roundData.status === 'COMPLETED' ? 'completed' : roundData.status === 'ACTIVE' ? 'active' : 'upcoming';
                  updated.isOpen = updated.status === 'active';
                  if (roundData.playersData?.length > 0) {
                    const sorted = [...roundData.playersData].sort((a, b) => b.auctionPlacedAmount !== a.auctionPlacedAmount ? b.auctionPlacedAmount - a.auctionPlacedAmount : new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime());
                    updated.currentBid = sorted[0].auctionPlacedAmount;
                    updated.bidder = sorted[0].playerUsername;
                    updated.highestBidFromAPI = sorted.find((p: any) => p.rank === 1)?.auctionPlacedAmount || sorted[0].auctionPlacedAmount;
                  }
                }
                return updated;
              }
              return box;
            });
              return { 
                ...prev, 
                prize: liveAuction.auctionName || prev.prize, 
                prizeValue: liveAuction.prizeValue || prev.prizeValue, 
                totalParticipants: liveAuction.participants?.length || prev.totalParticipants, 
                boxes: updatedBoxes, 
                userBidsPerRound: { ...prev.userBidsPerRound, ...userBidsMap }, 
                userQualificationPerRound: { ...prev.userQualificationPerRound, ...userQualificationMap }, 
                winnersAnnounced: liveAuction.winnersAnnounced || false, 
                userHasPaidEntry: finalPaid,
                userEntryFee: userEntryFee // ✅ Added this line
              };

          });
        } else setLiveAuctionData(null);
      } catch (error) { console.error('Error fetching live auction:', error); }
      finally { setIsLoadingLiveAuction(false); hasInitiallyLoaded.current = true; }
    };
    fetchCurrentAuctionId(forceRefetchTrigger === 0);
    const interval = setInterval(() => fetchCurrentAuctionId(false), 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id, justLoggedIn, forceRefetchTrigger, recentPaymentSuccess]);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    if (page === 'auction-leaderboard' && data?.hourlyAuctionId) {
      setSelectedLeaderboard({ hourlyAuctionId: data.hourlyAuctionId });
      setCurrentPage('leaderboard');
      window.history.pushState({}, '', '/leaderboard');
      return;
    }
    if (page === 'prizeshowcase') {
      setSelectedPrizeShowcaseAuctionId(data?.hourlyAuctionId || null);
      window.history.pushState({}, '', '/prizeshowcase');
      return;
    }
    const urlMap: any = { 'game': '/', 'login': '/login', 'signup': '/signup', 'forgot': '/forgot-password', 'rules': '/rules', 'participation': '/participation', 'about': '/about', 'terms': '/terms', 'privacy': '/privacy', 'refund': '/refund', 'support': '/support', 'contact': '/contact', 'profile': '/profile', 'history': '/history', 'leaderboard': '/leaderboard', 'admin-login': '/d60-ctrl-x9k7', 'admin-dashboard': '/d60-ctrl-x9k7', 'view-guide': '/view-guide', 'winning-tips': '/winning-tips', 'support-chat': '/support-chat', 'tester-feedback': '/tester-feedback', 'transactions': '/transactions', 'prizeshowcase': '/prizeshowcase', 'careers': '/careers' };
    window.history.pushState({}, '', urlMap[page] || '/');
  };

  const handleBackToGame = () => {
    sessionStorage.setItem('countdown_completed', 'true');
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
    setSelectedLeaderboard(null);
    setSelectedAuctionDetails(null);
  };

  const handleShowLeaderboard = (roundNumber: number) => {
    setSelectedLeaderboard({ roundNumber });
    setCurrentPage('leaderboard');
    window.history.pushState({}, '', '/leaderboard');
  };

  const handleLogin = async (user: any) => {
    setShowAmazonVoucherModal(true);
    const mappedUser = mapUserData(user);
    setCurrentUser(mappedUser);
    if (localStorage.getItem('tutorial_completed_dream60-whatsnew-v2') !== 'true') {
      setIsFirstLogin(true);
      setTimeout(() => setTutorialStartToken(Date.now()), 60000);
    }
    setJustLoggedIn(true);
    setForceRefetchTrigger(prev => prev + 1);
    setCurrentPage("game");
    window.history.pushState({}, '', '/');
  };

  const handleSignup = async (user: any) => {
    setShowAmazonVoucherModal(true);
    setCurrentUser(mapUserData(user));
    setIsFirstLogin(true);
    setCurrentPage("game");
    window.history.pushState({}, '', '/');
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    setCurrentAuction(prev => ({ ...prev, userHasPaidEntry: false, userBidsPerRound: {}, userQualificationPerRound: {}, boxes: prev.boxes.map(b => b.type === 'entry' ? { ...b, hasPaid: false, currentBid: 0, bidder: null } : b) }));
    setCurrentHourlyAuctionId(null);
    setRecentPaymentSuccess(false);
    setCurrentPage("game");
    window.history.pushState({}, '', '/');
  };

  const handleShowLogin = () => { setCurrentPage('login'); window.history.pushState({}, '', '/login'); };
  const handleSwitchToSignup = () => { setCurrentPage('signup'); window.history.pushState({}, '', '/signup'); };
  const handleSwitchToLogin = () => { setCurrentPage('login'); window.history.pushState({}, '', '/login'); };
  const handleCloseEntrySuccess = useCallback(() => setShowEntrySuccess(null), []);
  const handleCloseEntryFailure = useCallback(() => setShowEntryFailure(null), []);
  const handleCloseBidSuccess = useCallback(() => setShowBidSuccess(null), []);

  const handleEntrySuccess = useCallback(() => {
    if (!showEntrySuccess || !currentUser) { handleBackToGame(); return; }
    toast.success('Entry Fee Paid!');
    localStorage.setItem(`payment_${currentUser.id}_${currentAuction.id}`, 'true');
    localStorage.setItem(`payment_${currentUser.id}_${currentAuction.id}_expiry`, (Date.now() + 7200000).toString());
    const { entryFee, boxNumber, auctionId, transactionId, hourlyAuctionId } = showEntrySuccess;
    setTimeout(() => document.querySelector('[data-whatsnew-target="prize-showcase-section"]')?.scrollIntoView({ behavior: 'smooth' }), 10);
    setShowEntrySuccess(null);
    setShowEntrySuccessDetail({ entryFee, boxNumber, auctionId, transactionId, hourlyAuctionId });
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
    setRecentPaymentSuccess(true);
    recentPaymentTimestamp.current = Date.now();
    setForceRefetchTrigger(prev => prev + 1);
    if (currentUser.id) fetchAndSetUser(currentUser.id);
  }, [showEntrySuccess, currentUser, currentAuction.id]);

  const handlePlaceBid = async (boxId: number, amount: number) => {
    if (isPlacingBid || !currentUser || !currentAuction.userHasPaidEntry || !currentHourlyAuctionId) return;
    const roundBox = currentAuction.boxes.find(b => b.id === boxId && b.type === 'round') as RoundBox;
    if (currentAuction.userBidsPerRound[roundBox.roundNumber]) { toast.error('Already bid'); return; }
    setIsPlacingBid(true);
    try {
      const response = await fetch(API_ENDPOINTS.scheduler.placeBid, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: currentUser.id, playerUsername: currentUser.username, auctionValue: amount, hourlyAuctionId: currentHourlyAuctionId }) });
      if (response.ok) {
        toast.success('Bid Placed!');
        setCurrentAuction(prev => ({ ...prev, boxes: prev.boxes.map(b => b.id === boxId ? { ...b, currentBid: amount, bidder: currentUser.username } : b), userBidsPerRound: { ...prev.userBidsPerRound, [roundBox.roundNumber]: amount } }));
      }
    } catch (e) { console.error(e); }
    finally { setIsPlacingBid(false); }
  };

  const handleAdminLogin = (admin: any) => { setAdminUser(admin); setCurrentPage('admin-dashboard'); };
  const handleAdminLogout = () => { localStorage.clear(); setAdminUser(null); setCurrentPage('game'); window.history.pushState({}, '', '/'); };

  const renderContent = () => {
    switch (currentPage) {
      case 'admin-login': return <AdminLogin onLogin={handleAdminLogin} onSignupClick={() => { setCurrentPage('admin-signup'); window.history.pushState({}, '', '/d60-ctrl-x9k7/signup'); }} onBack={handleBackToGame} />;
      case 'admin-signup': return <AdminSignup onSignupSuccess={() => { setCurrentPage('admin-login'); window.history.pushState({}, '', '/d60-ctrl-x9k7'); }} onBack={() => { setCurrentPage('admin-login'); window.history.pushState({}, '', '/d60-ctrl-x9k7'); }} />;
      case 'admin-dashboard': return adminUser ? <AdminDashboard adminUser={adminUser} onLogout={handleAdminLogout} /> : <AdminLogin onLogin={handleAdminLogin} onSignupClick={() => {}} onBack={handleBackToGame} />;
      case 'leaderboard':
        if (selectedLeaderboard?.hourlyAuctionId) return <AuctionLeaderboard hourlyAuctionId={selectedLeaderboard.hourlyAuctionId} userId={currentUser?.id} onBack={handleBackToGame} />;
        return <Leaderboard roundNumber={selectedLeaderboard?.roundNumber} onBack={handleBackToGame} />;
      case 'profile': return currentUser ? <AccountSettings user={currentUser} onBack={handleBackToGame} onNavigate={handleNavigate} onDeleteAccount={handleLogout} onLogout={handleLogout} /> : null;
      case 'history':
        if (selectedAuctionDetails) return <AuctionDetailsPage auction={selectedAuctionDetails} onBack={() => { setSelectedAuctionDetails(null); localStorage.removeItem('selectedAuctionDetails'); window.history.pushState({}, '', '/history'); }} serverTime={serverTime} />;
        return currentUser ? <AuctionHistory user={currentUser} onBack={handleBackToGame} onViewDetails={(a) => { setSelectedAuctionDetails(a); localStorage.setItem('selectedAuctionDetails', JSON.stringify(a)); window.history.pushState({}, '', '/history/details'); }} serverTime={serverTime} /> : null;
      case 'login': return <LoginForm onLogin={handleLogin} onSwitchToSignup={handleSwitchToSignup} onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'signup': return <SignupForm onSignup={handleSignup} onSwitchToLogin={handleSwitchToLogin} onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'rules': return <><Rules onBack={handleBackToGame} /><Footer onNavigate={handleNavigate} /></>;
      case 'forgot': return <ForgotPasswordPage onBack={handleSwitchToLogin} onNavigate={handleNavigate} />;
      case 'participation': return <Participation onBack={handleBackToGame} />;
      case 'careers': return <CareersForm onBack={handleBackToGame} />;
      case 'coming-soon': return <ComingSoon onComplete={handleBackToGame} />;
      case 'about': return <><AboutUs onBack={handleBackToGame} onNavigate={handleNavigate} /><Footer onNavigate={handleNavigate} /></>;
      case 'terms': return <TermsAndConditions onBack={handleBackToGame} />;
      case 'refund': return <RefundPolicy onBack={handleBackToGame} />;
      case 'privacy': return <PrivacyPolicy onBack={handleBackToGame} />;
      case 'support': return <Support user={currentUser} onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'view-guide': return <ViewGuide onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'winning-tips': return <WinningTips onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'support-chat': return <SupportChatPage onBack={handleBackToGame} onNavigate={handleNavigate} />;
      case 'tester-feedback': return <TesterFeedback user={currentUser} onBack={handleBackToGame} />;
      case 'transactions': return currentUser ? <TransactionHistoryPage user={currentUser} onBack={handleBackToGame} /> : null;
      case 'prizeshowcase': return <PrizeShowcasePage onBack={handleBackToGame} onJoinAuction={() => { handleBackToGame(); setTimeout(() => document.getElementById('auction-grid')?.scrollIntoView({ behavior: 'smooth' }), 100); }} hourlyAuctionId={selectedPrizeShowcaseAuctionId} />;
      case 'payment-success': return <PaymentSuccess 
          amount={showEntrySuccess?.amount || showEntrySuccess?.entryFee || 0} 
          type={showEntrySuccess?.type || 'entry'} 
          boxNumber={showEntrySuccess?.boxNumber || 0} 
          auctionId={showEntrySuccess?.auctionId} 
          auctionNumber={showEntrySuccess?.auctionNumber} 
          productName={showEntrySuccess?.productName} 
          productWorth={showEntrySuccess?.productWorth} 
          timeSlot={showEntrySuccess?.timeSlot} 
          paidBy={showEntrySuccess?.paidBy} 
          paymentMethod={showEntrySuccess?.paymentMethod} 
          transactionId={showEntrySuccess?.transactionId} 
          transactionTime={showEntrySuccess?.transactionTime}
          upiId={showEntrySuccess?.upiId}
          bankName={showEntrySuccess?.bankName}
          cardName={showEntrySuccess?.cardName}
          cardNumber={showEntrySuccess?.cardNumber}
          onBackToHome={handleBackToGame} 
          onClose={handleCloseEntrySuccess}
        />;
      case 'payment-failure': return <PaymentFailure amount={showEntryFailure?.entryFee || 0} errorMessage={showEntryFailure?.errorMessage || 'Payment failed'} auctionId={showEntryFailure?.auctionId} auctionNumber={showEntryFailure?.auctionNumber} productName={showEntryFailure?.productName} productWorth={showEntryFailure?.productWorth} timeSlot={showEntryFailure?.timeSlot} paidBy={showEntryFailure?.paidBy} paymentMethod={showEntryFailure?.paymentMethod} transactionId={showEntryFailure?.transactionId} transactionTime={showEntryFailure?.transactionTime} onRetry={() => setShowEntryFailure(null)} onBackToHome={handleBackToGame} onClose={handleCloseEntryFailure} />;
      case 'contact': return <Contact onBack={handleBackToGame} />;
      default: return (
        <div className="min-h-screen bg-background">
          <Header user={currentUser} onNavigate={handleNavigate} onLogin={handleShowLogin} onLogout={handleLogout} onStartTutorial={handleStartTutorial} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
          {currentUser && <WinnerClaimBanner userId={currentUser.id} onNavigate={handleNavigate} serverTime={serverTime} />}
          <div data-whatsnew-target="prize-showcase"><ChristmasHeroBanner user={currentUser} onJoinNow={() => { if (!currentUser) handleShowLogin(); else document.querySelector('[data-whatsnew-target="prize-showcase-section"]')?.scrollIntoView({ behavior: 'smooth' }); }} /></div>
          <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {serverTime && (
              <div className="space-y-4">
                {liveAuctionData && (() => {
                  const activeRoundNum = liveAuctionData?.rounds?.find((r: any) => r.status === 'ACTIVE')?.roundNumber || (liveAuctionData?.currentRound || 1);
                  const timeSlot = liveAuctionData?.TimeSlot || "00:00";
                  const [h, m] = timeSlot.split(':').map(Number);
                  const displayTime = `${timeSlot} to ${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                  return (
                    <>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] text-white rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3"><Clock className="w-6 h-6 sm:w-8 sm:h-8" /><div><div className="text-sm opacity-90">Current Auction</div><div className="text-xl sm:text-2xl font-bold">{displayTime}</div></div></div>
                          <div className="flex items-center gap-3">
              {liveAuctionData?.winnersAnnounced ? (
                                  <button
                                    onClick={() => {
                                      const canAccess = currentAuction.userHasPaidEntry || currentUser?.userType === 'ADMIN';
                                      if (!canAccess || !liveAuctionData?.hourlyAuctionId) return;
                                      handleNavigate('auction-leaderboard', { hourlyAuctionId: liveAuctionData.hourlyAuctionId });
                                    }}
                                    disabled={!currentAuction.userHasPaidEntry && currentUser?.userType !== 'ADMIN'}
                                    className={`bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-left transition-all ${
                                      currentAuction.userHasPaidEntry || currentUser?.userType === 'ADMIN'
                                        ? 'hover:bg-white/30 cursor-pointer'
                                        : 'opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                  <div className="text-xs opacity-90">Status</div>
                                  <div className="text-lg sm:text-xl font-bold">Winners Announced</div>
                                </button>
                              ) : (
                                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                  <div className="text-xs opacity-90">Active Round</div>
                                  <div className="text-lg sm:text-xl font-bold">{`Round ${activeRoundNum}`}</div>
                                </div>
                              )}
                            {!currentAuction.userHasPaidEntry && <button onClick={() => setIsAuctionSectionsVisible(!isAuctionSectionsVisible)} className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"><motion.div animate={{ rotate: isAuctionSectionsVisible ? 180 : 0 }}><ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" /></motion.div></button>}
                          </div>
                        </div>
                      </motion.div>
                      <AnimatePresence>{isAuctionSectionsVisible && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><div id="six-box-system-container" className="space-y-6 sm:space-y-10 mt-4"><div data-whatsnew-target="prize-showcase-section"><PrizeShowcase currentPrize={currentAuction} isLoggedIn={!!currentUser} onLogin={handleShowLogin} serverTime={serverTime} liveAuctionData={liveAuctionData} isLoadingLiveAuction={isLoadingLiveAuction} recentPaymentSuccess={recentPaymentSuccess} recentPaymentTimestamp={recentPaymentTimestamp.current} onPayEntry={(_id, fee, data) => { if (!currentUser) return; setCurrentAuction(prev => ({ ...prev, userHasPaidEntry: true, boxes: prev.boxes.map(b => b.type === 'entry' ? { ...b, hasPaid: true, currentBid: (b as EntryBox).entryFee || 0, bidder: currentUser.username } : b) })); setForceRefetchTrigger(prev => prev + 1); if (currentUser.id) fetchAndSetUser(currentUser.id); setShowEntrySuccess({ entryFee: fee, boxNumber: 0, auctionId: currentAuction.id, auctionNumber: liveAuctionData?.TimeSlot || currentAuction.auctionHour, productName: liveAuctionData?.auctionName || currentAuction.prize || 'Auction Prize', productWorth: liveAuctionData?.prizeValue || currentAuction.prizeValue, timeSlot: liveAuctionData?.TimeSlot || currentAuction.auctionHour, paidBy: currentUser.username || currentUser.email, paymentMethod: data?.payment?.paymentMethod || 'UPI / Card' }); }} onPaymentFailure={(fee, msg) => { setForceRefetchTrigger(prev => prev + 1); setTimeout(() => document.getElementById('auction-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); setShowEntryFailure({ entryFee: fee, errorMessage: msg, auctionId: currentAuction.id, auctionNumber: liveAuctionData?.TimeSlot || currentAuction.auctionHour, productName: liveAuctionData?.auctionName || currentAuction.prize || 'Auction Prize', productWorth: liveAuctionData?.prizeValue || currentAuction.prizeValue, timeSlot: liveAuctionData?.TimeSlot || currentAuction.auctionHour, paidBy: currentUser?.username || currentUser?.email, paymentMethod: 'UPI / Card' }); }} onUserParticipationChange={(p) => setCurrentAuction(prev => ({ ...prev, userHasPaidEntry: p }))} /></div></div>{currentUser && <WinnersAnnouncedBanner onBidNow={handleBidNowScroll} />}{currentUser ? <div ref={auctionGridRef} id="auction-grid"><AuctionGrid auction={currentAuction} user={currentUser} onShowLeaderboard={handleShowLeaderboard} onBid={handlePlaceBid} serverTime={serverTime} isJoinWindowOpen={currentAuction.currentRound === 1} /></div> : <div className="bg-purple-50/50 rounded-2xl p-6 text-center border-2 border-dashed border-purple-200"><h3 className="text-xl font-bold text-purple-800 mb-2">Join to See Details</h3><p className="text-purple-600 mb-4">Log in to participate.</p><Button onClick={handleShowLogin} className="bg-purple-600 hover:bg-purple-700">Login / Sign Up</Button></div>}</motion.div>}</AnimatePresence>
                    </>
                  );
                })()}
                {!currentAuction.userHasPaidEntry && upcomingAuctionData && (() => {
                  const upcomingTimeSlot = upcomingAuctionData.TimeSlot || upcomingAuctionData.startTime || "00:00";
                  const [uh, um] = upcomingTimeSlot.split(':').map(Number);
                  const displayTime = `${upcomingTimeSlot} to ${String((uh + 1) % 24).padStart(2, '0')}:${String(um).padStart(2, '0')}`;
                  return (
                    <div className="space-y-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-[#2D3047] via-[#404466] to-[#555B85] text-white rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3"><Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" /><div><div className="text-sm opacity-90">Next Upcoming Auction</div><div className="text-xl sm:text-2xl font-bold">{displayTime}</div><div className="text-xs sm:text-sm text-blue-200 font-medium">Starts in: <span className="font-mono font-bold text-white">{upcomingCountdown}</span></div></div></div>
                          <div className="flex items-center gap-3"><div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2"><div className="text-xs opacity-90">Status</div><div className="text-lg sm:text-xl font-bold">Upcoming</div></div><button onClick={() => setIsUpcomingAuctionVisible(!isUpcomingAuctionVisible)} className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95"><motion.div animate={{ rotate: isUpcomingAuctionVisible ? 180 : 0 }}><ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" /></motion.div></button></div>
                        </div>
                      </motion.div>
                      <AnimatePresence>{isUpcomingAuctionVisible && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><PrizeShowcase currentPrize={{ ...currentAuction, prize: upcomingAuctionData.auctionName || upcomingAuctionData.prizeName, prizeValue: upcomingAuctionData.prizeValue, auctionHour: upcomingAuctionData.TimeSlot }} isLoggedIn={!!currentUser} onLogin={handleShowLogin} serverTime={serverTime} liveAuctionData={upcomingAuctionData} isLoadingLiveAuction={false} isUpcoming={true} upcomingCountdown={upcomingCountdown} onPayEntry={() => { document.getElementById('six-box-system-container')?.scrollIntoView({ behavior: 'smooth' }); toast.info("Join the live auction!"); }} /></motion.div>}</AnimatePresence>
                    </div>
                  );
                })()}
              </div>
            )}
            <AuctionSchedule user={currentUser} onNavigate={handleNavigate} serverTime={serverTime} />
            {!currentUser && <div className="text-center py-8 px-4"><div className="max-w-2xl mx-auto space-y-6"><h2 className="text-2xl font-bold text-purple-700">Ready to Start Winning?</h2><p className="text-lg text-purple-600">Create your free account!</p><div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-lg"><h3 className="text-lg font-semibold text-purple-700 mb-4">Why Join Dream60?</h3><div className="grid grid-cols-3 gap-4 text-center"><div><div className="text-xl font-bold text-purple-700">Pay</div><div className="text-sm text-purple-600">Per Bid</div></div><div><div className="text-xl font-bold text-purple-700">{dailyStats.totalAuctions}x</div><div className="text-sm text-purple-600">Daily Auctions</div></div><div><div className="text-xl font-bold text-purple-700">₹{dailyStats.totalPrizeValue.toLocaleString()}+</div><div className="text-sm text-purple-600">Prize Values</div></div></div></div></div></div>}
            <AuctionScheduleInfo />
          </main>
          <HowDream60Works />
          <Footer onNavigate={handleNavigate} />
          <style>{`@keyframes highlight-fade { 0% { box-shadow: 0 0 0 0px rgba(139, 92, 246, 0.7); border-radius: 1.5rem; } 50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0.3); border-radius: 1.5rem; } 100% { box-shadow: 0 0 0 0px rgba(139, 92, 246, 0); border-radius: 1.5rem; } } .highlight-auction-grid { animation: highlight-fade 2s ease-in-out infinite; z-index: 50; position: relative; }`}</style>
            <AnimatePresence mode="sync">
              {showBidSuccess && <PaymentSuccess 
                amount={showBidSuccess.amount} 
                type="bid" 
                boxNumber={showBidSuccess.boxNumber} 
                auctionId={currentAuction.id} 
                auctionNumber={liveAuctionData?.TimeSlot || currentAuction.auctionHour} 
                productName={currentAuction.prizeName || 'Auction Prize'} 
                productWorth={currentAuction.prizeValue} 
                timeSlot={liveAuctionData?.TimeSlot || currentAuction.auctionHour} 
                paidBy={currentUser?.username || currentUser?.email} 
                paymentMethod="Wallet / UPI" 
                onBackToHome={() => { setShowBidSuccess(null); setCurrentPage('game'); }} 
                onClose={() => setShowBidSuccess(null)} 
              />}
            </AnimatePresence>
          {currentUser && <TutorialOverlay steps={whatsNewSteps} tutorialId="dream60-whatsnew-v2" startToken={tutorialStartToken} forceShow={forceTutorialShow} onComplete={() => { setMobileMenuOpen(false); setForceTutorialShow(false); handleNavigate('game'); }} returnTo="" />}
          <AmazonVoucherModal isVisible={showAmazonVoucherModal} onClose={() => setShowAmazonVoucherModal(false)} />
        </div>
      );
    }
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          {renderContent()}
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
