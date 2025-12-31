import { useState, useEffect, useRef, useCallback } from 'react';
import Snowfall from 'react-snowfall';
import { Clock } from 'lucide-react';
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
import { Support } from './components/Support';
import { Contact } from './components/Contact';
import { Rules } from './components/Rules';
import { Participation } from './components/Participation';
import { AboutUs } from './components/AboutUs';
import { CareersForm } from './components/CareersForm';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
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
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { BrowserRouter } from 'react-router-dom';
import { API_ENDPOINTS } from '@/lib/api-config';

// ✅ Create QueryClient instance
const queryClient = new QueryClient();

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
    const response = await fetch(`${API_ENDPOINTS.serverTime}?t=${Date.now()}`, { cache: 'no-store' });
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
    // ✅ Create Date objects in UTC timezone (not local timezone)
    const startMinutes = (roundNumber - 1) * 15;
    const endMinutes = roundNumber * 15;

  // Use server timestamp to create dates
  const baseTimestamp = serverTime ? serverTime.timestamp : Date.now();
  const baseDate = new Date(baseTimestamp);
  
  // ✅ CRITICAL FIX: Use Date.UTC() to create dates in UTC timezone
  // Otherwise new Date(year, month, date, hour) interprets hour in local timezone (IST)
  // which causes 13:00 UTC to become 13:00 IST = 07:30 UTC
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
        // Add a brief highlight effect
        auctionGridRef.current.classList.add('highlight-auction-grid');
        setTimeout(() => {
          auctionGridRef.current?.classList.remove('highlight-auction-grid');
        }, 2000);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const [serverTime, setServerTime] = useState<ServerTime | null>(null);


  // Initialize currentPage based on URL path
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';

    if (path === '/admin') {
      const adminUserId = localStorage.getItem('admin_user_id');
      return adminUserId ? 'admin-dashboard' : 'admin-login';
    }
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot';
    if (path === '/rules') return 'rules';
    if (path === '/participation') return 'participation';
    if (path === '/about') return 'about';
    if (path === '/careers') return 'careers';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/support') return 'support';
    if (path === '/contact') return 'contact';
    if (path === '/profile') return 'profile';
    if (path === '/success-page') return 'success-preview';
    if (path === '/failure-page') return 'failure-preview';
    if (path === '/history' || path.startsWith('/history/')) return 'history';
    if (path === '/leaderboard') return 'leaderboard';
    if (path === '/view-guide') return 'view-guide';
    if (path === '/winning-tips') return 'winning-tips';
    if (path === '/support-chat') return 'support-chat';
    if (path === '/tester-feedback') return 'tester-feedback';
    if (path === '/transactions' || path.startsWith('/transactions/')) return 'transactions';

    return 'game';
  });

  // ✅ Sync URL with page state and handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      
      if (path === '/admin') {
        const adminUserId = localStorage.getItem('admin_user_id');
        setCurrentPage(adminUserId ? 'admin-dashboard' : 'admin-login');
      } else if (path === '/login') setCurrentPage('login');
      else if (path === '/signup') setCurrentPage('signup');
      else if (path === '/forgot-password') setCurrentPage('forgot');
      else if (path === '/rules') setCurrentPage('rules');
      else if (path === '/participation') setCurrentPage('participation');
      else if (path === '/about') setCurrentPage('about');
      else if (path === '/careers') setCurrentPage('careers');
      else if (path === '/terms') setCurrentPage('terms');
      else if (path === '/privacy') setCurrentPage('privacy');
      else if (path === '/support') setCurrentPage('support');
      else if (path === '/contact') setCurrentPage('contact');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/success-page') setCurrentPage('success-preview');
      else if (path === '/failure-page') setCurrentPage('failure-preview');
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
      else setCurrentPage('game');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ Fetch server time ONCE on mount, then use local offset
  useEffect(() => {
    const initializeServerTime = async () => {
      const time = await fetchServerTime();
      if (time) {
        setServerTime(time);
      }
    };

    // Initial fetch to calculate offset
    initializeServerTime();

    // Update local state every second using calculated offset (no API call)
    const interval = setInterval(() => {
      setServerTime(getCurrentServerTime());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

    // ✅ NEW: Hourly auto-refresh logic (12:00, 1:00, 2:00, etc.)
    useEffect(() => {
      let refreshTimeout: ReturnType<typeof setTimeout>;

      const scheduleHourlyRefresh = () => {
        const now = Date.now() + serverTimeOffset;
        const date = new Date(now);
        
        // Calculate milliseconds until the next full hour
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        const milliseconds = date.getUTCMilliseconds();
        
        const msUntilNextHour = ((60 - minutes) * 60 * 1000) - (seconds * 1000) - milliseconds;
        
        console.log(`⏰ Hourly refresh scheduled in ${Math.round(msUntilNextHour / 1000 / 60)} minutes`);

        refreshTimeout = setTimeout(() => {
          console.log('⏰ Hourly mark reached - Reloading page for consistency');
          window.location.reload();
        }, msUntilNextHour);
      };

      scheduleHourlyRefresh();

      return () => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
      };
    }, []);

    const [currentUser, setCurrentUser] = useState<{
      id: string;
      username: string;
      mobile?: string;
      email?: string;
      isDeleted: boolean;
      totalAuctions: number;
      totalWins: number;
      totalAmountSpent: number;
      totalAmountWon: number;
      userType: string;
      userCode: string;
      preferences: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        bidAlerts: boolean;
        winNotifications: boolean;
      };
      createdAt: string;
      updatedAt: string;
    } | null>(() => {
      // ✅ Restore session immediately from localStorage for instant UI on refresh
      try {
        const userId = localStorage.getItem("user_id");
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");

        if (!userId || !username) return null;

        const storedWins = parseInt(localStorage.getItem("totalWins") || "0", 10);
        const storedLosses = parseInt(localStorage.getItem("totalLosses") || "0", 10);
        const storedSpent = parseFloat(localStorage.getItem("totalAmountSpent") || "0");
        const storedWon = parseFloat(localStorage.getItem("totalAmountWon") || "0");

        console.log('✅ Instant session restoration for:', username);
        
        return {
          id: userId,
          username: username,
          email: email || '',
          isDeleted: false,
          totalAuctions: storedWins + storedLosses,
          totalWins: storedWins,
          totalAmountSpent: storedSpent,
          totalAmountWon: storedWon,
          userType: 'PLAYER',
          userCode: '',
          preferences: {
            emailNotifications: true,
            smsNotifications: true,
            bidAlerts: true,
            winNotifications: true,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.error('Error restoring session in initializer:', e);
        return null;
      }
    });

  // ✅ Helper function to map API user data to local state
  const mapUserData = (userData: any) => {
    return {
      id: userData.user_id || userData.id,
      username: userData.username,
      mobile: userData.mobile,
      email: userData.email,
      isDeleted: userData.isDeleted || false,
      // ✅ CRITICAL FIX: Handle stats from both nested stats object and top-level fields
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

  // ✅ NEW: Fetch user data from API and update state
  const fetchAndSetUser = async (userId: string) => {
    try {
      console.log('🔄 Fetching user data from API for userId:', userId);
      const response = await fetch(`${API_ENDPOINTS.auth.me.base}?user_id=${userId}`);
      
      const contentType = response.headers.get("content-type");
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        console.error('Failed to fetch user data: Invalid response from server', response.status);
        return;
      }
      
      const result = await response.json();
      
        if (result.success && result.user) {
          console.log('✅ User data fetched from API:', result.user);
          const mappedUser = mapUserData(result.user);
          
            // ✅ Save updated stats to localStorage for faster restoration on refresh
            localStorage.setItem("totalWins", (mappedUser.totalWins ?? 0).toString());
            localStorage.setItem("totalLosses", (mappedUser.totalLosses ?? 0).toString());
            localStorage.setItem("totalAmountSpent", (mappedUser.totalAmountSpent ?? 0).toString());
            localStorage.setItem("totalAmountWon", (mappedUser.totalAmountWon ?? 0).toString());
          
          setCurrentUser(mappedUser);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const [adminUser, setAdminUser] = useState<{
    user_id: string;
    username: string;
    email: string;
    userType: string;
    userCode: string;
  } | null>(null);

  const [selectedAuctionDetails, setSelectedAuctionDetails] = useState<any | null>(null);

  // ✅ Restore selected auction details from localStorage on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/history/details' || path.startsWith('/history/details')) {
      const storedAuction = localStorage.getItem('selectedAuctionDetails');
      if (storedAuction) {
        try {
          const parsedAuction = JSON.parse(storedAuction);
          // Convert date strings back to Date objects
          parsedAuction.date = new Date(parsedAuction.date);
          if (parsedAuction.claimDeadline) {
            parsedAuction.claimDeadline = new Date(parsedAuction.claimDeadline);
          }
          if (parsedAuction.claimedAt) {
            parsedAuction.claimedAt = new Date(parsedAuction.claimedAt);
          }
          setSelectedAuctionDetails(parsedAuction);
        } catch (error) {
          console.error('Error parsing stored auction:', error);
          localStorage.removeItem('selectedAuctionDetails');
        }
      }
    }
  }, []);

  const [showEntrySuccess, setShowEntrySuccess] = useState<{
    entryFee: number;
    boxNumber: number;
    auctionId?: string;
    auctionNumber?: string | number;
    productName?: string;
    productWorth?: number;
    timeSlot?: string;
    paidBy?: string;
  } | null>(null);

  const [showEntryFailure, setShowEntryFailure] = useState<{
    entryFee: number;
    errorMessage: string;
    auctionId?: string;
    auctionNumber?: string | number;
  } | null>(null);

  const [showBidSuccess, setShowBidSuccess] = useState<{
    amount: number;
    boxNumber: number;
    productName?: string;
    productWorth?: number;
    timeSlot?: string;
    paidBy?: string;
  } | null>(null);

  const [selectedLeaderboard, setSelectedLeaderboard] = useState<{
    roundNumber?: number;
    hourlyAuctionId?: string;
  } | null>(null);

  // Generate random entry fees between ₹1000-₹3500
  const generateRandomEntryFee = () => Math.floor(Math.random() * 2501) + 1000;

    // ✅ Only initialize currentAuction after server time is loaded
    const [currentAuction, setCurrentAuction] = useState<Auction>(() => {
      // ✅ Try to restore from localStorage for instant display on refresh
      const cached = localStorage.getItem('cached_current_auction');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          
          // ✅ CRITICAL FIX: Validate cache date and hour
          const now = new Date();
          const cachedStartTime = new Date(parsed.startTime);
          
          // Use UTC for consistent date matching
          const isSameDay = cachedStartTime.getUTCDate() === now.getUTCDate() && 
                            cachedStartTime.getUTCMonth() === now.getUTCMonth() &&
                            cachedStartTime.getUTCFullYear() === now.getUTCFullYear();
          
          // Local system hour as a fallback hint while waiting for serverTime
          const currentHourHint = now.getUTCHours();
          const isCorrectHour = parsed.auctionHour === currentHourHint;

          if (isSameDay && isCorrectHour) {
            // Convert date strings back to Date objects
            if (parsed.startTime) parsed.startTime = new Date(parsed.startTime);
            if (parsed.endTime) parsed.endTime = new Date(parsed.endTime);
            if (Array.isArray(parsed.boxes)) {
              parsed.boxes = parsed.boxes.map((box: any) => ({
                ...box,
                opensAt: box.opensAt ? new Date(box.opensAt) : undefined,
                closesAt: box.closesAt ? new Date(box.closesAt) : undefined,
              }));
            }
            console.log('📦 Restored valid auction state from cache:', parsed.id);
            return parsed;
          } else {
            console.log('🗑️ Cached auction is stale (Date/Hour mismatch), ignoring.');
            localStorage.removeItem('cached_current_auction');
          }
        } catch (e) {
          console.error('Error parsing cached auction:', e);
        }
      }

      const entryFee1 = generateRandomEntryFee();
      const entryFee2 = generateRandomEntryFee();
      // If no valid cache, use local time to guess the initial slot while serverTime fetches
      const now = new Date();
      const localUTCHour = now.getUTCHours();
      const auctionHour = (localUTCHour >= 9 && localUTCHour < 19) ? localUTCHour : 9;
      
      const startTime = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        auctionHour,
        0,
        0
      ));
      
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const roundBoxes: RoundBox[] = [1, 2, 3, 4].map((roundNum) => {
        const startMinutes = (roundNum - 1) * 15;
        const endMinutes = roundNum * 15;
        
        const opensAt = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          auctionHour,
          startMinutes,
          0
        ));
        
        const closesAt = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          auctionHour,
          endMinutes,
          0
        ));

        return {
          id: roundNum + 2,
          type: "round",
          roundNumber: roundNum,
          isOpen: false,
          minBid: 10,
          currentBid: 0,
          bidder: null,
          opensAt,
          closesAt,
          leaderboard: [],
          status: "upcoming",
        };
      });

      const entryBox1: EntryBox = {
        id: 1,
        type: "entry",
        isOpen: true,
        entryFee: entryFee1,
        currentBid: 0,
        bidder: null,
        hasPaid: false,
        status: "upcoming",
      };

      const entryBox2: EntryBox = {
        id: 2,
        type: "entry",
        isOpen: true,
        entryFee: entryFee2,
        currentBid: 0,
        bidder: null,
        hasPaid: false,
        status: "upcoming",
      };

      return {
        id: `auction-${auctionHour}`,
        title: "Loading...",
        prize: "Loading...",
        prizeValue: 0,
        startTime,
        endTime,
        currentRound: 1,
        totalParticipants: 0,
        userHasPaidEntry: false,
        auctionHour: auctionHour,
        userBidsPerRound: {},
        userQualificationPerRound: {},
        boxes: [entryBox1, entryBox2, ...roundBoxes],
      };
    });

  // ✅ NEW: Consolidated Auction Fetching Logic
  const refreshAuctionData = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingLiveAuction(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduler.liveAuction}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        console.log('⚠️ No live auction available');
        setLiveAuctionData(null);
        return;
      }
      
      const result = await response.json();
      if (!result.success || !result.data) {
        setLiveAuctionData(null);
        return;
      }

      const liveAuction = result.data;
      console.log('✅ Auction data synchronized with server');
      setLiveAuctionData(liveAuction);
      if (liveAuction.hourlyAuctionId) setCurrentHourlyAuctionId(liveAuction.hourlyAuctionId);

      // Extract user specific data if logged in
      const userBidsMap: { [roundNumber: number]: number } = {};
      const userQualificationMap: { [roundNumber: number]: boolean } = {};
      let userEntryFeeFromAPI: number | undefined = undefined;
      let userHasPaidEntryFromAPI = false;
      let userParticipant = null;

      if (currentUser?.id) {
        if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
          userParticipant = liveAuction.participants.find((p: any) => p.playerId === currentUser.id);
          if (userParticipant) {
            userHasPaidEntryFromAPI = true;
            userEntryFeeFromAPI = userParticipant.entryFee;
          }
        }

        if (liveAuction.rounds && Array.isArray(liveAuction.rounds)) {
          liveAuction.rounds.forEach((round: any) => {
            if (round.playersData && Array.isArray(round.playersData)) {
              const userBid = round.playersData.find((p: any) => p.playerId === currentUser.id);
              if (userBid && userBid.auctionPlacedAmount) {
                userBidsMap[round.roundNumber] = userBid.auctionPlacedAmount;
              }
            }
            
            if (round.roundNumber === 1) userQualificationMap[1] = true;
            if (round.roundNumber > 1) {
              if (userParticipant?.isEliminated === true) {
                userQualificationMap[round.roundNumber] = false;
              } else if (userParticipant?.isEliminated === false) {
                userQualificationMap[round.roundNumber] = true;
              }
            }
          });
        }
      }

      // Sticky optimistic payment check
      let finalUserHasPaidEntry = userHasPaidEntryFromAPI;
      if (!userHasPaidEntryFromAPI && recentPaymentSuccess) {
        if (Date.now() - recentPaymentTimestamp.current < 15000) finalUserHasPaidEntry = true;
        else setRecentPaymentSuccess(false);
      } else if (userHasPaidEntryFromAPI) {
        setRecentPaymentSuccess(false);
      }

      setCurrentAuction(prev => {
        const updatedBoxes = prev.boxes.map(box => {
          if (box.type === 'round') {
            const roundBox = box as RoundBox;
            const roundData = liveAuction.rounds?.find((r: any) => r.roundNumber === roundBox.roundNumber);
            let updatedBox = { ...roundBox };
            
            if (liveAuction.winnersAnnounced) updatedBox.winnersAnnounced = true;

            // Update times and status from API
            if (roundData) {
              if (roundData.startedAt) updatedBox.opensAt = new Date(roundData.startedAt);
              if (roundData.completedAt) updatedBox.closesAt = new Date(roundData.completedAt);
              
              if (roundData.status === 'COMPLETED') updatedBox.status = 'completed';
              else if (roundData.status === 'ACTIVE') { updatedBox.status = 'active'; updatedBox.isOpen = true; }
              else if (roundData.status === 'PENDING') { updatedBox.status = 'upcoming'; updatedBox.isOpen = false; }
            }

            // Update highest bids from API
            if (roundData?.playersData?.length > 0) {
              const sorted = [...roundData.playersData].sort((a, b) => b.auctionPlacedAmount - a.auctionPlacedAmount);
              updatedBox.currentBid = sorted[0].auctionPlacedAmount;
              updatedBox.bidder = sorted[0].playerUsername;
            }
            return updatedBox;
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
          userEntryFeeFromAPI: userEntryFeeFromAPI,
          userHasPaidEntry: finalUserHasPaidEntry,
        };
      });

    } catch (error) {
      console.error('Error refreshing auction data:', error);
    } finally {
      setIsLoadingLiveAuction(false);
    }
  }, [currentUser?.id, recentPaymentSuccess]);

    // ✅ Effect to handle periodic and forced refreshes
    useEffect(() => {
      refreshAuctionData(forceRefetchTrigger === 0);
      
      const interval = setInterval(() => {
        refreshAuctionData(false);
      }, 3000);
      
      return () => clearInterval(interval);
    }, [refreshAuctionData, forceRefetchTrigger]);

  // Effect to handle 15-minute alignment auto-refresh
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const scheduleNextFetch = () => {
      const now = Date.now() + serverTimeOffset;
      const date = new Date(now);
      const minutes = date.getUTCMinutes();
      const nextMarkMinutes = (Math.floor(minutes / 15) + 1) * 15;
      const msToWait = ((nextMarkMinutes - minutes) * 60 * 1000) - (date.getUTCSeconds() * 1000) - date.getUTCMilliseconds() + 2000;
      
      timerId = setTimeout(() => {
        refreshAuctionData(false);
        scheduleNextFetch();
      }, msToWait);
    };
    scheduleNextFetch();
    return () => if (timerId) clearTimeout(timerId);
  }, [refreshAuctionData]);

    // ✅ REMOVED: Redundant serverTime reset useEffect that was wiping out boxes

    // ✅ NEW: Persist currentAuction state to localStorage
    useEffect(() => {
      if (currentAuction && currentAuction.id !== 'auction-loading' && currentAuction.title !== 'Loading...') {
        try {
          localStorage.setItem('cached_current_auction', JSON.stringify(currentAuction));
        } catch (e) {
          console.error('Error saving auction state:', e);
        }
      }
    }, [currentAuction]);

    const [currentHourlyAuctionId, setCurrentHourlyAuctionId] = useState<string | null>(null);

  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [previousRound, setPreviousRound] = useState<number>(1);
  const [forceRefetchTrigger, setForceRefetchTrigger] = useState<number>(0);
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);
  const [liveAuctionData, setLiveAuctionData] = useState<any>(null);
  const [isLoadingLiveAuction, setIsLoadingLiveAuction] = useState<boolean>(true);
  const [tutorialStartToken, setTutorialStartToken] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAmazonVoucherModal, setShowAmazonVoucherModal] = useState<boolean>(false);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [dailyStats, setDailyStats] = useState({ totalAuctions: 6, totalPrizeValue: 350000 });
  const [recentPaymentSuccess, setRecentPaymentSuccess] = useState<boolean>(false);
  const recentPaymentTimestamp = useRef<number>(0);

  // Tutorial steps for What's New
  const whatsNewSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Dream60!',
      description: 'Win amazing prizes with just ₹60! Pay your entry fee, place bids in 4 rounds, and compete to win prizes worth up to ₹3,50,000.',
      targetElement: '[data-whatsnew-target="prize-showcase"]',
      position: 'bottom',
      action: () => handleNavigate('game'),
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description: 'Track all your entry fees, prize claims, and vouchers in one place. Click "Transactions" in the header to view your payment history.',
      targetElement: '[data-whatsnew-target="transactions"]',
      mobileTargetElement: '[data-whatsnew-target="mobile-transactions"]',
      position: 'bottom',
      action: () => handleNavigate('game'),
      mobileAction: () => setMobileMenuOpen(true),
    },
      {
        id: 'auction-schedule',
        title: 'Daily Auction Schedule',
        description: 'Join auctions from 2:30 PM to 12:30 AM IST. Each auction has 4 bidding rounds of 15 minutes each.',
        targetElement: '[data-whatsnew-target="auction-schedule"]',
        position: 'top',
        scrollBlock: 'start',
        action: () => { setMobileMenuOpen(false); handleNavigate('game'); },
        mobileAction: () => setMobileMenuOpen(false),
      },

    {
      id: 'support',
      title: 'Need Help?',
      description: 'Access 24/7 support, view guides, winning tips, and FAQs. Our support team is always ready to assist you.',
      targetElement: '[data-whatsnew-target="support"]',
      mobileTargetElement: '[data-whatsnew-target="mobile-support"]',
      position: 'bottom',
      action: () => handleNavigate('game'),
      mobileAction: () => setMobileMenuOpen(true),
    },
    {
      id: 'pwa-install',
      title: 'Install Dream60 App',
      description: 'Install Dream60 on your device for faster access, offline support, and instant notifications about auctions.',
      targetElement: '[data-whatsnew-target="pwa-install"]',
      position: 'bottom',
      action: () => setMobileMenuOpen(false),
      mobileAction: () => setMobileMenuOpen(false),
    },
  ];

  const handleStartTutorial = () => {
    setTutorialStartToken(Date.now());
  };

    // ✅ NEW: Fetch daily auction stats
    useEffect(() => {
      const fetchDailyStats = async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.scheduler.dailyAuction}?t=${Date.now()}`, { cache: 'no-store' });
          if (!response.ok) return;
          const result = await response.json();
        if (result.success && result.data) {
          const auctions = result.data.auctions || [];
          const totalAuctions = result.data.totalAuctionsPerDay || auctions.length || 6;
          const totalPrizeValue = auctions.reduce((sum: number, auction: any) => sum + (auction.prizeValue || 0), 0);
          setDailyStats({ totalAuctions, totalPrizeValue: totalPrizeValue > 0 ? totalPrizeValue : 350000 });
        }
      } catch (error) {
        console.error('Error fetching daily stats:', error);
      }
    };
    fetchDailyStats();
  }, []);

  // Check for existing session on app initialization
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const adminUserId = localStorage.getItem("admin_user_id");
        if (adminUserId && (currentPage === 'admin-login' || currentPage === 'admin-dashboard')) {
          setAdminUser({
            user_id: adminUserId,
            username: 'admin_dream60',
            email: localStorage.getItem("admin_email") || 'dream60@gmail.com',
            userType: 'ADMIN',
            userCode: '#ADMIN',
          });
          if (currentPage === 'admin-login') setCurrentPage("admin-dashboard");
          return;
        }

        const userId = localStorage.getItem("user_id");
        const username = localStorage.getItem("username");
        if (!userId || !username) return;

        const storedWins = parseInt(localStorage.getItem("totalWins") || "0", 10);
        const storedLosses = parseInt(localStorage.getItem("totalLosses") || "0", 10);
        const storedSpent = parseFloat(localStorage.getItem("totalAmountSpent") || "0");
        const storedWon = parseFloat(localStorage.getItem("totalAmountWon") || "0");

        setCurrentUser(mapUserData({
          user_id: userId,
          username: username,
          email: localStorage.getItem("email") || '',
          totalWins: storedWins,
          totalLosses: storedLosses,
          totalAmountSpent: storedSpent,
          totalAmountWon: storedWon,
        }));
      } catch (error) {
        console.error("Session restore error:", error);
      }
    };
    checkExistingSession();
  }, [currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  useEffect(() => {
    if (currentUser?.id) fetchAndSetUser(currentUser.id);
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentPage === 'game' && currentUser?.id) fetchAndSetUser(currentUser.id);
  }, [currentPage, currentUser?.id]);

  // Detect round changes and trigger refetch
  useEffect(() => {
    if (!serverTime || !currentUser?.id || !currentAuction.userHasPaidEntry) return;
    const currentRound = getCurrentRoundByTime(serverTime);
    if (currentRound !== previousRound) {
        setPreviousRound(currentRound);
        setForceRefetchTrigger(prev => prev + 1);
      }
  }, [serverTime, currentUser?.id, currentAuction.userHasPaidEntry, previousRound]);

  // Timer to automatically open boxes based on time schedule (local fallback logic)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!serverTime) return;
      
      const currentHour = getCurrentAuctionSlot(serverTime);
      const currentRound = getCurrentRoundByTime(serverTime);

      setCurrentAuction((prev) => {
        // If hour changed, we'll eventually get new data from API, but we can do a local reset if needed
        if (currentHour && currentHour !== prev.auctionHour) {
          // Trigger a refetch
          setForceRefetchTrigger(t => t + 1);
          return { ...prev, auctionHour: currentHour, id: `auction-${currentHour}` };
        }

        if (!prev.userHasPaidEntry) return { ...prev, currentRound };

        const now = new Date(serverTime.timestamp);
        const updatedBoxes: AnyBox[] = prev.boxes.map((box) => {
          if (box.type === "round") {
            const roundBox = box as RoundBox;
            const isNowOpen = now >= roundBox.opensAt && now < roundBox.closesAt;
            const isPast = now >= roundBox.closesAt;
            const status: BoxStatus = isPast ? "completed" : isNowOpen ? "active" : "locked";

            if (status === "completed" && roundBox.status !== "completed" && (!roundBox.leaderboard || roundBox.leaderboard.length === 0)) {
              return { ...roundBox, isOpen: isNowOpen, status, leaderboard: generateDemoLeaderboard(roundBox.roundNumber) };
            }
            return { ...roundBox, isOpen: isNowOpen, status };
          }
          return box;
        });

        const hasChanges = updatedBoxes.some((box, index) => {
          const prevBox = prev.boxes[index] as AnyBox;
          return box.isOpen !== prevBox.isOpen || (box.type === "round" && (box as RoundBox).status !== (prevBox as RoundBox).status);
        });

        return hasChanges || prev.currentRound !== currentRound
          ? { ...prev, boxes: updatedBoxes, currentRound }
          : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [serverTime]);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    if (page === 'auction-leaderboard' && data?.hourlyAuctionId) {
      setSelectedLeaderboard({ hourlyAuctionId: data.hourlyAuctionId });
      setCurrentPage('leaderboard');
      window.history.pushState({}, '', '/leaderboard');
      return;
    }
    const urlMap: { [key: string]: string } = {
        'game': '/', 'login': '/login', 'signup': '/signup', 'forgot': '/forgot-password',
        'rules': '/rules', 'participation': '/participation', 'about': '/about', 'terms': '/terms',
        'privacy': '/privacy', 'support': '/support', 'contact': '/contact', 'profile': '/profile',
        'history': '/history', 'leaderboard': '/leaderboard', 'admin-login': '/admin',
        'admin-dashboard': '/admin', 'view-guide': '/view-guide', 'winning-tips': '/winning-tips',
        'support-chat': '/support-chat', 'tester-feedback': '/tester-feedback', 'transactions': '/transactions',
        'careers': '/careers'
      };
    window.history.pushState({}, '', urlMap[page] || '/');
  };

  const handleBackToGame = () => {
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
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    setCurrentUser(null);
    setCurrentAuction(prev => ({
      ...prev,
      userHasPaidEntry: false,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: prev.boxes.map(box => box.type === 'entry' ? { ...box, hasPaid: false, currentBid: 0, bidder: null } : box)
    }));
    setCurrentHourlyAuctionId(null);
    setCurrentPage("game");
    window.history.pushState({}, '', '/');
  };

  const handleShowLogin = () => { setCurrentPage('login'); window.history.pushState({}, '', '/login'); };
  const handleSwitchToSignup = () => { setCurrentPage('signup'); window.history.pushState({}, '', '/signup'); };
  const handleSwitchToLogin = () => { setCurrentPage('login'); window.history.pushState({}, '', '/login'); };

  const handleEntrySuccess = () => {
    if (!showEntrySuccess || !currentUser) return;
    toast.success('Entry Fee Paid!');
    setShowEntrySuccess(null);
    setRecentPaymentSuccess(true);
    recentPaymentTimestamp.current = Date.now();
    setForceRefetchTrigger(prev => prev + 1);
    if (currentUser.id) fetchAndSetUser(currentUser.id);
  };

  const handleEntryFailure = () => { setShowEntryFailure(null); };
  const handleRetryPayment = () => { setShowEntryFailure(null); };
  const handleUserParticipationChange = (isParticipating: boolean) => {
    setCurrentAuction(prev => ({ ...prev, userHasPaidEntry: isParticipating }));
  };

  const handlePlaceBid = async (boxId: number, amount: number) => {
    if (isPlacingBid || !currentUser || !currentAuction.userHasPaidEntry || !currentHourlyAuctionId) return;
    const roundBox = currentAuction.boxes.find(b => b.id === boxId && b.type === 'round') as RoundBox | undefined;
    if (!roundBox || currentAuction.userBidsPerRound[roundBox.roundNumber]) return;

    setIsPlacingBid(true);
    try {
      const response = await fetch(API_ENDPOINTS.scheduler.placeBid, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentUser.id,
          playerUsername: currentUser.username,
          auctionValue: amount,
          hourlyAuctionId: currentHourlyAuctionId,
        }),
      });
      if (response.ok) {
        toast.success('Bid Placed Successfully!');
        setCurrentAuction(prev => ({
          ...prev,
          userBidsPerRound: { ...prev.userBidsPerRound, [roundBox.roundNumber]: amount }
        }));
        refreshAuctionData(false);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleAdminLogin = (admin: any) => { setAdminUser(admin); setCurrentPage('admin-dashboard'); };
  const handleAdminLogout = () => {
    localStorage.removeItem('admin_user_id');
    setAdminUser(null);
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
  };

  if (currentPage === 'admin-login') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AdminLogin onLogin={handleAdminLogin} onBack={() => { setCurrentPage('game'); window.history.pushState({}, '', '/'); }} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'admin-dashboard' && adminUser) return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AdminDashboard adminUser={adminUser} onLogout={handleAdminLogout} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'leaderboard' && selectedLeaderboard) {
    if (selectedLeaderboard.hourlyAuctionId) return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AuctionLeaderboard hourlyAuctionId={selectedLeaderboard.hourlyAuctionId} userId={currentUser?.id} onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <Leaderboard roundNumber={selectedLeaderboard.roundNumber || 1} onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'profile' && currentUser) return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <AccountSettings user={currentUser} onBack={handleBackToGame} onLogout={handleLogout} onUpdateUser={setCurrentUser} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'history') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        {selectedAuctionDetails ? (
          <AuctionDetailsPage auction={selectedAuctionDetails} onBack={() => setSelectedAuctionDetails(null)} userId={currentUser?.id} />
        ) : (
          <AuctionHistory userId={currentUser?.id || ''} onBack={handleBackToGame} onSelectAuction={setSelectedAuctionDetails} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'view-guide') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <ViewGuide onBack={handleBackToGame} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'winning-tips') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <WinningTips onBack={handleBackToGame} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'support-chat') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <SupportChatPage onBack={handleBackToGame} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'tester-feedback') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <TesterFeedback onBack={handleBackToGame} userId={currentUser?.id} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  if (currentPage === 'transactions') return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <TransactionHistoryPage onBack={handleBackToGame} userId={currentUser?.id} />
      </TooltipProvider>
    </QueryClientProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <div className="min-h-screen bg-white font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">
          <Header 
            user={currentUser} 
            onLogout={handleLogout} 
            onShowLogin={handleShowLogin} 
            onNavigate={handleNavigate} 
            currentPage={currentPage}
            mobileMenuOpen={mobileMenuOpen}
            onMobileMenuChange={setMobileMenuOpen}
          />
          
          <main className="relative pt-16 sm:pt-20">
            <AnimatePresence mode="wait">
              {currentPage === 'game' && (
                <motion.div
                  key="game"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-0"
                >
                  <ChristmasHeroBanner 
                    user={currentUser} 
                    onBidNow={handleBidNowScroll} 
                    onLogin={handleShowLogin}
                    dailyStats={dailyStats}
                  />

                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
                    <section data-whatsnew-target="prize-showcase">
                      <PrizeShowcase 
                        auction={currentAuction} 
                        liveAuctionData={liveAuctionData} 
                        isLoading={isLoadingLiveAuction}
                      />
                    </section>

                    <section ref={auctionGridRef} className="scroll-mt-24 sm:scroll-mt-32">
                      <div className="flex flex-col items-center mb-8 sm:mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-xs sm:text-sm font-semibold mb-4">
                          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                          Live Auction Rounds
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center px-4">
                          Compete in Real-Time Rounds
                        </h2>
                      </div>
                      <AuctionGrid 
                        auction={currentAuction} 
                        user={currentUser || { username: 'Guest' }} 
                        onBid={handlePlaceBid} 
                        onShowLeaderboard={handleShowLeaderboard}
                        serverTime={serverTime}
                        isJoinWindowOpen={true}
                      />
                    </section>

                    <section data-whatsnew-target="auction-schedule">
                      <AuctionScheduleInfo />
                    </section>

                    <HowDream60Works />
                  </div>
                </motion.div>
              )}

              {currentPage === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <LoginForm 
                    onLogin={handleLogin} 
                    onSwitchToSignup={handleSwitchToSignup} 
                    onBack={handleBackToGame} 
                    onForgotPassword={() => handleNavigate('forgot')}
                  />
                </motion.div>
              )}

              {currentPage === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <SignupForm 
                    onSignup={handleSignup} 
                    onSwitchToLogin={handleSwitchToLogin} 
                    onBack={handleBackToGame} 
                  />
                </motion.div>
              )}

              {currentPage === 'forgot' && (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ForgotPasswordPage 
                    onBack={handleBackToGame}
                    onSwitchToLogin={handleSwitchToLogin}
                  />
                </motion.div>
              )}

              {currentPage === 'rules' && <Rules onBack={handleBackToGame} />}
              {currentPage === 'participation' && <Participation onBack={handleBackToGame} />}
              {currentPage === 'about' && <AboutUs onBack={handleBackToGame} />}
              {currentPage === 'careers' && <CareersForm onBack={handleBackToGame} />}
              {currentPage === 'terms' && <TermsAndConditions onBack={handleBackToGame} />}
              {currentPage === 'privacy' && <PrivacyPolicy onBack={handleBackToGame} />}
              {currentPage === 'support' && <Support onBack={handleBackToGame} />}
              {currentPage === 'contact' && <Contact onBack={handleBackToGame} />}
              {currentPage === 'success-preview' && <PaymentSuccess onBack={handleBackToGame} onSecondaryAction={handleBackToGame} />}
              {currentPage === 'failure-preview' && <PaymentFailure onBack={handleBackToGame} onRetry={handleBackToGame} />}
            </AnimatePresence>
          </main>
          
          <Footer onNavigate={handleNavigate} />
          
          {showAmazonVoucherModal && (
            <AmazonVoucherModal 
              isOpen={showAmazonVoucherModal} 
              onClose={() => setShowAmazonVoucherModal(false)} 
            />
          )}

          <TutorialOverlay 
            steps={whatsNewSteps} 
            storageKey="dream60-whatsnew-v2" 
            forceStartToken={tutorialStartToken}
          />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
