import { useState, useEffect, useRef, useCallback } from 'react';
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
import { RefundCancellation } from './components/RefundCancellation';
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
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { Sonner } from '@/components/ui/sonner';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { BrowserRouter } from 'react-router-dom';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useActivityTracker } from './hooks/useActivityTracker';

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

  console.log(`🕐 [GET ROUND BOX TIMES] Creating times for Round ${roundNumber}:`, {
    'Auction Hour (UTC)': auctionHour,
    'Start Minutes': startMinutes,
    'End Minutes': endMinutes,
    'opensAt (UTC)': opensAt.toUTCString(),
    'opensAt (ISO)': opensAt.toISOString(),
    'closesAt (UTC)': closesAt.toUTCString(),
    'closesAt (ISO)': closesAt.toISOString(),
      'Display Time': `${opensAt.toLocaleTimeString('en-IN', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false })} to ${closesAt.toLocaleTimeString('en-IN', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false })}`
  });

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
    if (path === '/careers') return 'careers';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/support') return 'support';
    if (path === '/contact') return 'contact';
    if (path === '/profile') return 'profile';
    if (path === '/success-page' || path === '/payment/success') return 'success-preview';
    if (path === '/failure-page' || path === '/payment/failure') return 'failure-preview';
    if (path === '/history' || path.startsWith('/history/')) return 'history';
    if (path === '/leaderboard') return 'leaderboard';
    if (path === '/view-guide') return 'view-guide';
    if (path === '/winning-tips') return 'winning-tips';
    if (path === '/support-chat') return 'support-chat';
    if (path === '/tester-feedback') return 'tester-feedback';
    if (path === '/transactions' || path.startsWith('/transactions/')) return 'transactions';
    if (path === '/prizeshowcase') return 'prizeshowcase';

    return 'game';
  });

  // ✅ Sync URL with page state and handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      
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
      else if (path === '/careers') setCurrentPage('careers');
      else if (path === '/terms') setCurrentPage('terms');
      else if (path === '/privacy') setCurrentPage('privacy');
      else if (path === '/support') setCurrentPage('support');
      else if (path === '/contact') setCurrentPage('contact');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/success-page' || path === '/payment/success') setCurrentPage('success-preview');
      else if (path === '/failure-page' || path === '/payment/failure') setCurrentPage('failure-preview');
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
  } | null>(null);

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
        console.log('✅ User state updated with stats:', {
          totalAuctions: mappedUser.totalAuctions,
          totalWins: mappedUser.totalWins,
          totalAmountSpent: mappedUser.totalAmountSpent,
          totalAmountWon: mappedUser.totalAmountWon,
        });
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
      isSuperAdmin?: boolean;
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

const [selectedPrizeShowcaseAuctionId, setSelectedPrizeShowcaseAuctionId] = useState<string | null>(null);

    // User Activity Tracker
    const currentPathForTracking = currentPage === 'game' ? '/' : `/${currentPage}`;
    useActivityTracker(
      currentUser?.id || null,
      currentUser?.username || null,
      currentPathForTracking
    );

  // ✅ Only initialize currentAuction after server time is loaded
  const [currentAuction, setCurrentAuction] = useState<Auction>(() => {
    const entryFee1 = 60;
    const entryFee2 = 60;
    const auctionHour = serverTime?.hour || 9; // Default to 9 UTC (14:30 IST)
    const today = serverTime ? new Date(serverTime.timestamp) : new Date();

    // ✅ Calculate IST slot start time correctly
    // 9 UTC -> 14:30 IST
    // 11 UTC -> 16:30 IST
    // etc.
    const startTime = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      auctionHour,
      0, // Auctions start at :00 past the UTC hour (which is :30 past IST hour, e.g. 14:30)
      0
    ));
    
    return {
      id: 'auction-1',
      title: 'Mega Auction',
      prize: 'iPhone 15 Pro',
      prizeValue: 129900,
      startTime,
      endTime: new Date(startTime.getTime() + 60 * 60 * 1000), // 1 hour duration
      currentRound: getCurrentRoundByTime(serverTime),
      totalParticipants: 0,
      userHasPaidEntry: false,
      auctionHour,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: [
        { id: 1, type: "entry", isOpen: true, currentBid: 0, bidder: null, entryFee: entryFee1, hasPaid: false },
        { id: 2, type: "entry", isOpen: true, currentBid: 0, bidder: null, entryFee: entryFee2, hasPaid: false },
        { id: 3, type: "round", roundNumber: 1, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: getRoundBoxTimes(auctionHour, 1, serverTime).opensAt, closesAt: getRoundBoxTimes(auctionHour, 1, serverTime).closesAt, leaderboard: generateDemoLeaderboard(1) },
        { id: 4, type: "round", roundNumber: 2, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: getRoundBoxTimes(auctionHour, 2, serverTime).opensAt, closesAt: getRoundBoxTimes(auctionHour, 2, serverTime).closesAt, leaderboard: generateDemoLeaderboard(2) },
        { id: 5, type: "round", roundNumber: 3, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: getRoundBoxTimes(auctionHour, 3, serverTime).opensAt, closesAt: getRoundBoxTimes(auctionHour, 3, serverTime).closesAt, leaderboard: generateDemoLeaderboard(3) },
        { id: 6, type: "round", roundNumber: 4, isOpen: false, currentBid: 0, bidder: null, minBid: 1, opensAt: getRoundBoxTimes(auctionHour, 4, serverTime).opensAt, closesAt: getRoundBoxTimes(auctionHour, 4, serverTime).closesAt, leaderboard: generateDemoLeaderboard(4) },
      ]
    };
  });

  const [isAuctionSectionsVisible, setIsAuctionSectionsVisible] = useState(true);

  // Force show sections if user has participated
  useEffect(() => {
    if (currentAuction.userHasPaidEntry) {
      setIsAuctionSectionsVisible(true);
    }
  }, [currentAuction.userHasPaidEntry]);

  // ✅ Update auction state when server time first loads
  useEffect(() => {
    if (!serverTime) return;
    
    const currentHour = getCurrentAuctionSlot(serverTime);
    if (!currentHour) return;
    
    // Only update if the auction hour is different from current
    if (currentAuction.auctionHour !== currentHour) {
      const entryFee1 = 60;
      const entryFee2 = 60;
      const today = new Date(serverTime.timestamp);
      
      const startTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        currentHour,
        0,
        0
      );
      
      const endTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        currentHour + 1,
        0,
        0
      );

      const roundBoxes: RoundBox[] = [1, 2, 3, 4].map((roundNum) => {
        const { opensAt, closesAt } = getRoundBoxTimes(currentHour, roundNum, serverTime);
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

      setCurrentAuction(prev => ({
        ...prev,
        id: `auction-${currentHour}`,
        startTime,
        endTime,
        auctionHour: currentHour,
        currentRound: getCurrentRoundByTime(serverTime),
        boxes: [entryBox1, entryBox2, ...roundBoxes],
      }));
    }
  }, [serverTime]); // Run when server time first loads

  const [currentHourlyAuctionId, setCurrentHourlyAuctionId] = useState<string | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  // ✅ NEW: Track previous round to detect round changes
  const [previousRound, setPreviousRound] = useState<number>(1);
  // ✅ NEW: Force refetch trigger
  const [forceRefetchTrigger, setForceRefetchTrigger] = useState<number>(0);
  // ✅ NEW: Track if user just logged in to trigger immediate refresh
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);
  // ✅ NEW: Store live auction data to pass to PrizeShowcase
  const [liveAuctionData, setLiveAuctionData] = useState<any>(null);
  // ✅ NEW: Track if we're currently fetching live auction data
    const [isLoadingLiveAuction, setIsLoadingLiveAuction] = useState<boolean>(true);

    const [upcomingAuctionData, setUpcomingAuctionData] = useState<any>(null);
    const [upcomingCountdown, setUpcomingCountdown] = useState<string>('00:00:00');
    const [isUpcomingAuctionVisible, setIsUpcomingAuctionVisible] = useState(false);

      // ✅ Update countdown timer for upcoming auction every second using server time
        useEffect(() => {
          if (!serverTime) return;
  
          const updateCountdown = () => {
            // If we have upcoming auction data with a specific time slot, use that
            if (upcomingAuctionData?.TimeSlot) {
              try {
                const [targetHour, targetMinute] = upcomingAuctionData.TimeSlot.split(':').map(Number);
                
                // Create target date based on server time's date but target hour/minute
                const targetDate = new Date(serverTime.timestamp);
                targetDate.setHours(targetHour, targetMinute, 0, 0);
                
                // If target time is in the past for today, it might be for tomorrow
                if (targetDate.getTime() < serverTime.timestamp) {
                  targetDate.setDate(targetDate.getDate() + 1);
                }
                
                const totalSecondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - serverTime.timestamp) / 1000));
                
                if (totalSecondsRemaining === 0) {
                  setUpcomingCountdown('00:00:00');
                  return;
                }
  
                const hours = Math.floor(totalSecondsRemaining / 3600);
                const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
                const seconds = totalSecondsRemaining % 60;
                
                if (hours > 0) {
                  setUpcomingCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                } else {
                  setUpcomingCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
                return;
              } catch (e) {
                console.error("Error calculating custom countdown:", e);
              }
            }

            // Simplified fallback calculation to the next top of the hour (MM:SS)
            const currentMinute = serverTime.minute;
            const currentSecond = serverTime.second;
            
            const totalSecondsRemaining = 3600 - (currentMinute * 60 + currentSecond);
            
            if (totalSecondsRemaining >= 3600) {
              setUpcomingCountdown('00:00');
              return;
            }

            const minutes = Math.floor(totalSecondsRemaining / 60);
            const seconds = totalSecondsRemaining % 60;
            
            setUpcomingCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          };

          updateCountdown();
          const timer = setInterval(updateCountdown, 1000);
          return () => clearInterval(timer);
        }, [serverTime, upcomingAuctionData]);

      // Fetch upcoming auction data
    useEffect(() => {
      const fetchUpcomingAuction = async () => {
        try {
          // First try to fetch the single first upcoming product
          const response = await fetch(API_ENDPOINTS.scheduler.firstUpcomingProduct);
          const data = await response.json();
          
          if (data.success && data.data) {
            setUpcomingAuctionData(data.data);
          } else {
            // Fallback: Fetch daily auction schedule and find the next one
            const dailyResponse = await fetch(API_ENDPOINTS.scheduler.dailyAuction);
            const dailyData = await dailyResponse.json();
            
            if (dailyData.success && dailyData.data?.dailyAuctionConfig) {
              const auctions = dailyData.data.dailyAuctionConfig;
              // Find the first auction that is marked as 'UPCOMING'
              const nextAuction = auctions.find((a: any) => a.Status === 'UPCOMING');
              
              if (nextAuction) {
                console.log('✅ Found fallback upcoming auction from daily schedule:', nextAuction.auctionName);
                setUpcomingAuctionData(nextAuction);
              } else {
                console.log('⚠️ No upcoming auctions found in daily schedule');
                setUpcomingAuctionData(null);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching upcoming auction:', error);
        }
      };

      if (serverTime) {
        fetchUpcomingAuction();
      }
    }, [serverTime, liveAuctionData]);
  // ✅ Track if the first load has completed
  const hasInitiallyLoaded = useRef(false);
  // ✅ NEW: Track tutorial/whatsnew token
  const [tutorialStartToken, setTutorialStartToken] = useState<number>(0);
  const [forceTutorialShow, setForceTutorialShow] = useState<boolean>(false);
  // ✅ NEW: Mobile menu state for header (to control from tutorial)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  // ✅ NEW: Show Amazon Voucher modal after first login/signup
  const [showAmazonVoucherModal, setShowAmazonVoucherModal] = useState<boolean>(false);
  // ✅ NEW: Track if this is user's first login/signup for tutorial
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  // ✅ NEW: Daily auction stats for the "Why Join Dream60?" section
  const [dailyStats, setDailyStats] = useState({ totalAuctions: 6, totalPrizeValue: 350000 });
  // ✅ NEW: Sticky optimistic payment state
  const [recentPaymentSuccess, setRecentPaymentSuccess] = useState<boolean>(false);
  const recentPaymentTimestamp = useRef<number>(0);

  // Tutorial steps for What's New (5 steps)
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
        scrollBlock: 'start', // Start in the middle of the screen (custom logic in TutorialOverlay)
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
    setForceTutorialShow(true);
    setTutorialStartToken(Date.now());
  };

  // ✅ NEW: Fetch live auction data and refresh every 15 minutes (aligned with UTC/IST 15-min marks)
  const fetchLiveAuction = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingLiveAuction(true);
    }
    try {
      const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
      
      if (!response.ok) {
        console.log('⚠️ No live auction available');
        setLiveAuctionData(null);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Live auction data loaded/refreshed');
        setLiveAuctionData(result.data);
        
        // Update basic auction info
        setCurrentAuction(prev => ({
          ...prev,
          prize: result.data.auctionName || prev.prize,
          prizeValue: result.data.prizeValue || prev.prizeValue,
          totalParticipants: result.data.participants?.length || prev.totalParticipants,
        }));
      } else {
        setLiveAuctionData(null);
      }
    } catch (error) {
      console.error('Error fetching live auction:', error);
    } finally {
      setIsLoadingLiveAuction(false);
    }
  }, []);

    // Effect to trigger fetch on mount and when forced
    useEffect(() => {
      // ✅ Background refresh when force triggered to avoid visible "Loading..." flicker
      const showLoading = forceRefetchTrigger === 0;
      fetchLiveAuction(showLoading);
    }, [fetchLiveAuction, forceRefetchTrigger]);

  // Effect to handle 15-minute alignment auto-refresh
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;

    const scheduleNextFetch = () => {
      // Use serverTime for alignment if available, otherwise use local time
      const now = Date.now() + serverTimeOffset;
      const date = new Date(now);
      const minutes = date.getUTCMinutes();
      const seconds = date.getUTCSeconds();
      const milliseconds = date.getUTCMilliseconds();
      
      // Calculate minutes until next 15-min mark (00, 15, 30, 45)
      // This aligns with IST boundaries as well (IST = UTC + 5:30)
      const nextMarkMinutes = (Math.floor(minutes / 15) + 1) * 15;
      const minutesToWait = nextMarkMinutes - minutes;
      
      // Calculate total ms to wait, plus a 2s buffer to ensure server has processed transition
      const msToWait = (minutesToWait * 60 * 1000) - (seconds * 1000) - milliseconds + 2000;
      
      console.log(`⏱️ Next 15-min auto-refresh scheduled in ${Math.round(msToWait / 1000)}s (at :${nextMarkMinutes % 60} UTC/IST boundary)`);
      
      timerId = setTimeout(() => {
        console.log('⏰ 15-minute boundary reached - triggering auto-refresh');
        fetchLiveAuction(false); // Background refresh
        scheduleNextFetch();
      }, msToWait);
    };

    scheduleNextFetch();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [fetchLiveAuction]);

  // ✅ NEW: Fetch daily auction stats for the "Why Join Dream60?" section
  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.scheduler.dailyAuction);
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const auctions = result.data.auctions || [];
          const totalAuctions = result.data.totalAuctionsPerDay || auctions.length || 6;
          
          // Calculate total prize value by summing prizeValue of all auctions
          const totalPrizeValue = auctions.reduce((sum: number, auction: any) => {
            return sum + (auction.prizeValue || 0);
          }, 0);
          
          setDailyStats({
            totalAuctions,
            totalPrizeValue: totalPrizeValue > 0 ? totalPrizeValue : 350000
          });
          
          console.log('📈 Daily Stats Updated:', { totalAuctions, totalPrizeValue });
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
        // Check for admin session first
        const adminUserId = localStorage.getItem("admin_user_id");
        if (adminUserId && (currentPage === 'admin-login' || currentPage === 'admin-dashboard')) {
          const adminEmail = localStorage.getItem("admin_email");
          const adminUsername = localStorage.getItem("admin_username");
          const adminIsSuperAdmin = localStorage.getItem("admin_isSuperAdmin") === 'true';
          setAdminUser({
            user_id: adminUserId,
            username: adminUsername || 'admin_dream60',
            email: adminEmail || 'dream60@gmail.com',
            userType: 'ADMIN',
            userCode: '#ADMIN',
            isSuperAdmin: adminIsSuperAdmin,
          });
          if (currentPage === 'admin-login') {
            setCurrentPage("admin-dashboard");
          }
          return;
        }

        // ✅ Check for regular user session - restore from localStorage only
        const userId = localStorage.getItem("user_id");
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");

        if (!userId || !username) return; // No valid session

      // ✅ Restore user from localStorage without API call
      const storedWins = parseInt(localStorage.getItem("totalWins") || "0", 10);
      const storedLosses = parseInt(localStorage.getItem("totalLosses") || "0", 10);
      const storedSpent = parseFloat(localStorage.getItem("totalAmountSpent") || "0");
      const storedWon = parseFloat(localStorage.getItem("totalAmountWon") || "0");

      const user = mapUserData({
        user_id: userId,
        username: username,
        email: email || '',
        totalWins: storedWins,
        totalLosses: storedLosses,
        totalAmountSpent: storedSpent,
        totalAmountWon: storedWon,
      });

      setCurrentUser(user);
        console.log('✅ Session restored from localStorage');
      } catch (error) {
        console.error("Session restore error:", error);
        localStorage.removeItem("user_id");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
      }
    };

    checkExistingSession();
  }, [currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // ✅ NEW: Fetch user data from API when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 User logged in - fetching updated user data from API');
      fetchAndSetUser(currentUser.id);
    }
  }, [currentUser?.id]);

  // ✅ NEW: Refresh user data when navigating back to game page (homepage)
  useEffect(() => {
    if (currentPage === 'game' && currentUser?.id) {
      console.log('🔄 Navigated to homepage - refreshing user data from API');
      fetchAndSetUser(currentUser.id);
    }
  }, [currentPage, currentUser?.id]);

  // ✅ NEW: Detect round changes and trigger refetch
  useEffect(() => {
    if (!serverTime || !currentUser?.id || !currentAuction.userHasPaidEntry) return;
    
    const currentRound = getCurrentRoundByTime(serverTime);
    
    // Check if round has changed
    if (currentRound !== previousRound) {
      console.log(`🔄 Round changed from ${previousRound} to ${currentRound} - triggering auction data refresh`);
        setPreviousRound(currentRound);
        
        // Trigger immediate refetch by incrementing the trigger
        setForceRefetchTrigger(prev => prev + 1);
      }
  }, [serverTime, currentUser?.id, currentAuction.userHasPaidEntry, previousRound]);

  // ✅ NEW: Fetch basic auction info immediately when user logs in (before entry payment)
  useEffect(() => {
    const fetchBasicAuctionInfo = async () => {
      if (!currentUser?.id || currentAuction.userHasPaidEntry) return;
      
      // ✅ Only fetch on login event
      if (!justLoggedIn) return;
      
      try {
        console.log('🔄 Fetching basic auction info after login...');
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const liveAuction = result.data;
          
          console.log('📊 [LOGIN REFRESH] Basic auction info loaded:', {
            'Prize Name': liveAuction.auctionName,
            'Prize Value': liveAuction.prizeValue,
            'Total Participants': liveAuction.participants?.length || 0
          });
          
          // Update only basic auction info
          setCurrentAuction(prev => ({
            ...prev,
            prize: liveAuction.auctionName || prev.prize,
            prizeValue: liveAuction.prizeValue || prev.prizeValue,
            totalParticipants: liveAuction.participants?.length || prev.totalParticipants,
          }));
          
          // Reset flag after fetch
          setJustLoggedIn(false);
        }
      } catch (error) {
        console.error('Error fetching basic auction info:', error);
        setJustLoggedIn(false);
      }
    };
    
    fetchBasicAuctionInfo();
  }, [currentUser?.id, justLoggedIn, currentAuction.userHasPaidEntry]);

  // Timer to automatically open boxes based on time schedule
  useEffect(() => {
    const interval = setInterval(() => {
      // ✅ Don't run timer logic if server time hasn't loaded yet
      if (!serverTime) return;
      
      const currentHour = getCurrentAuctionSlot(serverTime);
      const currentRound = getCurrentRoundByTime(serverTime);

      setCurrentAuction((prev) => {
        // Switch to new auction hour
        if (currentHour && currentHour !== prev.auctionHour) {
          const entryFee1 = 60;
          const entryFee2 = 60;
          const today = new Date(serverTime.timestamp);
          
          const startTime = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            currentHour,
            0,
            0
          ));
          
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

          const roundBoxes: RoundBox[] = [1, 2, 3, 4].map((roundNum) => {
            const startMinutes = (roundNum - 1) * 15;
            const endMinutes = roundNum * 15;
            
            const opensAt = new Date(Date.UTC(
              today.getUTCFullYear(),
              today.getUTCMonth(),
              today.getUTCDate(),
              currentHour,
              startMinutes,
              0
            ));
            
            const closesAt = new Date(Date.UTC(
              today.getUTCFullYear(),
              today.getUTCMonth(),
              today.getUTCDate(),
              currentHour,
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
            ...prev,
            id: `auction-${currentHour}`,
            startTime,
            endTime,
            currentRound,
            auctionHour: currentHour,
            userHasPaidEntry: false,
            userBidsPerRound: {},
            userQualificationPerRound: {},
            boxes: [entryBox1, entryBox2, ...roundBoxes],
          };
        }

        if (!prev.userHasPaidEntry) {
          return { ...prev, currentRound };
        }

        // ✅ Use server time instead of new Date()
        const now = new Date(serverTime.timestamp);

        const updatedBoxes: AnyBox[] = prev.boxes.map((box) => {
          if (box.type === "round") {
            const roundBox = box as RoundBox;
            const { opensAt, closesAt } = roundBox;
            const isNowOpen = now >= opensAt && now < closesAt;
            const isPast = now >= closesAt;
            const status: BoxStatus = isPast
              ? "completed"
              : isNowOpen
              ? "active"
              : "locked";

            if (
              status === "completed" &&
              roundBox.status !== "completed" &&
              (!roundBox.leaderboard || roundBox.leaderboard.length === 0)
            ) {
              return {
                ...roundBox,
                isOpen: isNowOpen,
                status,
                leaderboard: generateDemoLeaderboard(roundBox.roundNumber),
                currentBid: 0,
                bidder: null,
              };
            }

            return { ...roundBox, isOpen: isNowOpen, status };
          }
          return box;
        });

        const hasChanges = updatedBoxes.some((box, index) => {
          const prevBox = prev.boxes[index] as AnyBox;
          if (box.isOpen !== prevBox.isOpen) return true;
          if (box.type === "round" && prevBox.type === "round") {
            return box.status !== prevBox.status;
          }
          return false;
        });

        return hasChanges || prev.currentRound !== currentRound
          ? { ...prev, boxes: updatedBoxes, currentRound }
          : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTime]); // ✅ Add serverTime as dependency

      // Fetch current hourly auction ID when user is logged in
          useEffect(() => {
            const fetchCurrentAuctionId = async (showLoading = false) => {
              // ✅ CRITICAL FIX: Always fetch when user is logged in
              // This ensures the user's participation status is correctly loaded from the API on page refresh
              if (!currentUser?.id) return;
              
              // ✅ Reset justLoggedIn flag after triggering refetch
              if (justLoggedIn) {
                console.log('🔄 User just logged in - forcing immediate auction data refresh');
                setJustLoggedIn(false);
              }
              
              // ✅ FIX: Only show loading on initial fetch to prevent flickering every 3s
              if (showLoading && !hasInitiallyLoaded.current) {
                setIsLoadingLiveAuction(true);
              }


          
          try {
            const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
            if (!response.ok) return;
            
            const result = await response.json();
            
            // Extract hourlyAuctionId from the response
            if (result.success && result.data?.hourlyAuctionId) {
              setCurrentHourlyAuctionId(result.data.hourlyAuctionId);
              
              // ✅ NEW: Store live auction data to pass to PrizeShowcase
              setLiveAuctionData(result.data);
              
              // ✅ Check if user has already placed bids in any rounds AND elimination status
              const liveAuction = result.data;
              const userBidsMap: { [roundNumber: number]: number } = {};
              const userQualificationMap: { [roundNumber: number]: boolean } = {};
              
              // ✅ NEW: Extract user's entry fee from participants array
              let userEntryFeeFromAPI: number | undefined = undefined;
              let userHasPaidEntryFromAPI = false; // ✅ NEW: Track if user has paid entry
              
              if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
                const userParticipant = liveAuction.participants.find(
                  (participant: any) => participant.playerId === currentUser.id
                );
                
                if (userParticipant) {
                  // ✅ CRITICAL FIX: If user is found in participants, they have paid entry fee
                  userHasPaidEntryFromAPI = true;
                  userEntryFeeFromAPI = userParticipant.entryFee;
                }
              }
              
              // ✅ CRITICAL: Find user in participants array to check isEliminated status
              let userParticipant = null;
              if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
                userParticipant = liveAuction.participants.find(
                  (participant: any) => participant.playerId === currentUser.id
                );
              }
              
              if (liveAuction.rounds && Array.isArray(liveAuction.rounds)) {
                // ✅ First pass: Collect all user bids
                liveAuction.rounds.forEach((round: any) => {
                  if (round.playersData && Array.isArray(round.playersData)) {
                    const userBid = round.playersData.find(
                      (player: any) => player.playerId === currentUser.id
                    );
                    
                    if (userBid && userBid.auctionPlacedAmount) {
                      userBidsMap[round.roundNumber] = userBid.auctionPlacedAmount;
                    }
                  }
                });
                
                // ✅ Second pass: Set qualification status for each round
                liveAuction.rounds.forEach((round: any) => {
                  // Round 1: Always eligible if entry fee is paid
                  if (round.roundNumber === 1) {
                    userQualificationMap[1] = true;
                  }
                  
                  // Rounds 2, 3, 4: Check if user is eliminated
                  if (round.roundNumber > 1) {
                    // ✅ CRITICAL: If user is eliminated, mark ALL future rounds as not qualified
                    if (userParticipant && userParticipant.isEliminated === true) {
                      userQualificationMap[round.roundNumber] = false;
                    } else if (userParticipant && userParticipant.isEliminated === false) {
                      // User is NOT eliminated, they can continue
                      userQualificationMap[round.roundNumber] = true;
                    }
                  }
                });
              }
              
                      // Update local state
                      setCurrentAuction(prev => {
                        // ✅ NEW: Check localStorage for sticky payment status (survives refresh)
                        const auctionId = prev.id;
                        const paymentKey = `payment_${currentUser.id}_${auctionId}`;
                        const storedPayment = localStorage.getItem(paymentKey) === 'true';
                        const storedExpiry = parseInt(localStorage.getItem(`${paymentKey}_expiry`) || '0');
                        const isPaymentValid = storedPayment && Date.now() < storedExpiry;

                        // ✅ NEW: Sticky userHasPaidEntry logic to prevent flickering
                        // If the user already has a true status for the SAME auction, don't let it flicker back to false
                        // due to API lag/latency, especially after placing a bid.
                        let finalUserHasPaidEntry = userHasPaidEntryFromAPI;
                        
                        // ✅ CRITICAL: Once paid for THIS auction, stay paid (sticky for entire auction hour)
                        if (isPaymentValid) {
                          finalUserHasPaidEntry = true;
                        } else if (prev.userHasPaidEntry && prev.id === `auction-${result.data?.auctionHour || prev.auctionHour}`) {
                          finalUserHasPaidEntry = true;
                        } else if (!userHasPaidEntryFromAPI && recentPaymentSuccess) {
                        // Extended timeout to 60 minutes (entire auction duration)
                        const now = Date.now();
                        if (now - recentPaymentTimestamp.current < 3600000) {
                          finalUserHasPaidEntry = true;
                        } else {
                          setRecentPaymentSuccess(false);
                        }
                      } else if (!userHasPaidEntryFromAPI && (Object.keys(userBidsMap).length > 0 || Object.keys(prev.userBidsPerRound).length > 0)) {
                        // Trust either API bids or existing local bids
                        finalUserHasPaidEntry = true;
                      }

                    const updatedBoxes = prev.boxes.map(box => {

                  if (box.type === 'round') {
                    const roundBox = box as RoundBox;
                    const roundData = liveAuction.rounds?.find(
                      (r: any) => r.roundNumber === roundBox.roundNumber
                    );
                    
                    let updatedBox = { ...roundBox };
                    
                    // ✅ NEW: Set winnersAnnounced flag from live auction
                    if (liveAuction.winnersAnnounced) {
                      updatedBox.winnersAnnounced = true;
                    }
                    
                    // ✅ DYNAMIC MIN BID CALCULATION
                    if (roundBox.roundNumber === 1) {
                      updatedBox.minBid = userEntryFeeFromAPI || 10;
                    } else {
                      const previousRoundNumber = roundBox.roundNumber - 1;
                      const previousRoundData = liveAuction.rounds?.find(
                        (r: any) => r.roundNumber === previousRoundNumber
                      );
                      
                      if (previousRoundData && previousRoundData.playersData && previousRoundData.playersData.length > 0) {
                        const highestBidInPreviousRound = Math.max(
                          ...previousRoundData.playersData.map((p: any) => p.auctionPlacedAmount)
                        );
                        const currentRoundConfig = liveAuction.roundConfig?.find(
                          (rc: any) => rc.round === roundBox.roundNumber
                        );
                        const cutoffPercentage = currentRoundConfig?.roundCutoffPercentage || 0;
                        const cutoffAmount = Math.floor(highestBidInPreviousRound * cutoffPercentage / 100);
                        updatedBox.minBid = highestBidInPreviousRound - cutoffAmount;
                      } else {
                        const entryBox = prev.boxes.find(b => b.type === 'entry' && (b as EntryBox).hasPaid);
                        const userEntryFee = entryBox ? (entryBox as EntryBox).entryFee : 10;
                        updatedBox.minBid = userEntryFee || 10;
                      }
                    }
                    
                    if (roundData) {
                        if (roundData.startedAt) {
                          updatedBox.opensAt = new Date(roundData.startedAt);
                        }
                        if (roundData.completedAt) {
                          updatedBox.closesAt = new Date(roundData.completedAt);
                        } else if (roundData.startedAt) {
                        const opensAt = new Date(roundData.startedAt);
                        updatedBox.closesAt = new Date(opensAt.getTime() + 15 * 60 * 1000);
                      }
                      
                      if (roundData.status === 'COMPLETED') {
                        updatedBox.status = 'completed';
                      } else if (roundData.status === 'ACTIVE') {
                        updatedBox.status = 'active';
                        updatedBox.isOpen = true;
                      } else if (roundData.status === 'PENDING') {
                        updatedBox.status = 'upcoming';
                        updatedBox.isOpen = false;
                      }
                    }
                    
                    if (roundData && roundData.playersData && roundData.playersData.length > 0) {
                      const sortedPlayers = [...roundData.playersData].sort((a: any, b: any) => {
                        if (b.auctionPlacedAmount !== a.auctionPlacedAmount) {
                          return b.auctionPlacedAmount - a.auctionPlacedAmount;
                        }
                        return new Date(a.auctionPlacedTime).getTime() - new Date(b.auctionPlacedTime).getTime();
                      });
                      const highestBidder = sortedPlayers[0];
                      const rank1Player = sortedPlayers.find((player: any) => player.rank === 1);
                      const highestBidFromAPI = rank1Player?.auctionPlacedAmount || highestBidder.auctionPlacedAmount;
                      
                        updatedBox = {
                          ...updatedBox,
                          currentBid: highestBidder.auctionPlacedAmount,
                          bidder: highestBidder.playerUsername,
                          highestBidFromAPI: highestBidFromAPI,
                        };
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

            } else {
              setLiveAuctionData(null);
            }
          } catch (error) {
            console.error('Error fetching live auction:', error);
            } finally {
              setIsLoadingLiveAuction(false);
              hasInitiallyLoaded.current = true;
            }
          };


        // Initial fetch
        fetchCurrentAuctionId(forceRefetchTrigger === 0);

        // ✅ ADDED: High-frequency polling (3 seconds) to detect real-time updates like early completion
        const interval = setInterval(() => {
          fetchCurrentAuctionId(false); // Background refresh
        }, 3000);

        return () => clearInterval(interval);
      }, [currentUser?.id, justLoggedIn, forceRefetchTrigger, recentPaymentSuccess, isPlacingBid]);

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

    // ✅ Update browser URL to match the page
    const urlMap: { [key: string]: string } = {
        'game': '/',
        'login': '/login',
        'signup': '/signup',
        'forgot': '/forgot-password',
        'rules': '/rules',
        'participation': '/participation',
        'about': '/about',
        'terms': '/terms',
        'privacy': '/privacy',
        'support': '/support',
        'contact': '/contact',
        'profile': '/profile',
        'history': '/history',
        'leaderboard': '/leaderboard',
        'admin-login': '/d60-ctrl-x9k7',
          'admin-dashboard': '/d60-ctrl-x9k7',
        'view-guide': '/view-guide',
          'winning-tips': '/winning-tips',
          'support-chat': '/support-chat',
          'tester-feedback': '/tester-feedback',
          'transactions': '/transactions',
          'prizeshowcase': '/prizeshowcase',
        'careers': '/careers'
      };
    
    const url = urlMap[page] || '/';
    window.history.pushState({}, '', url);
  };

  const handleBackToGame = () => {
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
    setSelectedLeaderboard(null);
    setSelectedAuctionDetails(null);
  };

  const handleShowLeaderboard = (
    roundNumber: number,
  ) => {
    setSelectedLeaderboard({ roundNumber });
    setCurrentPage('leaderboard');
    window.history.pushState({}, '', '/leaderboard');
  };

  const handleLogin = async (user: any) => {
    try {
      // ✅ Amazon voucher modal pops up IMMEDIATELY on login as requested
      setShowAmazonVoucherModal(true);

      // ✅ User data is already passed from LoginForm, no need for additional API call
      const mappedUser = mapUserData(user);
      setCurrentUser(mappedUser);
      
      console.log('✅ User logged in successfully:', mappedUser.username);

      // ✅ Check if this is user's first login (tutorial not completed)
      const tutorialCompleted = localStorage.getItem('tutorial_completed_dream60-whatsnew-v2') === 'true';
      
      if (!tutorialCompleted) {
        // First time login - show tutorial after a delay
        setIsFirstLogin(true);
        setTimeout(() => {
          setTutorialStartToken(Date.now());
        }, 60000); // 1 minute delay
      }

      // ✅ CRITICAL FIX: Immediately fetch live auction to check if user has paid entry fee
      // This prevents showing incorrect "Outbid Now" buttons before data is refreshed
      try {
        console.log('🔄 [LOGIN] Fetching live auction data to verify entry fee status...');
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            const liveAuction = result.data;
            
            // Check if user is in participants array
            let userHasPaid = false;
            if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
              const userParticipant = liveAuction.participants.find(
                (p: any) => p.playerId === mappedUser.id
              );
              userHasPaid = !!userParticipant;
              console.log(`✅ [LOGIN] Entry fee status: ${userHasPaid ? 'PAID' : 'NOT PAID'}`);
            }
            
            // ✅ Set initial auction state with correct entry fee status
            setCurrentAuction(prev => ({
              ...prev,
              userHasPaidEntry: userHasPaid,
              userBidsPerRound: {},
              userQualificationPerRound: {},
              prize: liveAuction.auctionName || prev.prize,
              prizeValue: liveAuction.prizeValue || prev.prizeValue,
              totalParticipants: liveAuction.participants?.length || prev.totalParticipants,
            }));
            
            // Store live auction data
            setLiveAuctionData(liveAuction);
            if (liveAuction.hourlyAuctionId) {
              setCurrentHourlyAuctionId(liveAuction.hourlyAuctionId);
            }
          }
        }
      } catch (fetchError) {
        console.error('Error fetching auction data on login:', fetchError);
        // Still reset to safe defaults if fetch fails
        setCurrentAuction(prev => ({
          ...prev,
          userHasPaidEntry: false,
          userBidsPerRound: {},
          userQualificationPerRound: {},
        }));
      }

      // ✅ Set flag to trigger polling refresh
      setJustLoggedIn(true);
      
      // ✅ Clear hourly auction ID to force fresh fetch in polling
      // (commented out since we set it above if available)
      // setCurrentHourlyAuctionId(null);
      
      // ✅ Force immediate refetch by incrementing trigger
      setForceRefetchTrigger(prev => prev + 1);

      setCurrentPage("game");
      window.history.pushState({}, '', '/');
    } catch (error) {
      console.error("Error while login:", error);
    }
  };

  const handleSignup = async (user: any) => {
    try {
      // ✅ Amazon voucher modal pops up IMMEDIATELY on signup as requested
      setShowAmazonVoucherModal(true);

      // ✅ User data is already passed from SignupForm, map and set it directly
      const mappedUser = mapUserData(user);
      setCurrentUser(mappedUser);
      
      console.log('✅ User signed up successfully:', mappedUser.username);

      // ✅ First signup - always show tutorial
      setIsFirstLogin(true);

      setCurrentPage("game");
      window.history.pushState({}, '', '/');
    } catch (error) {
      console.error("Error while signup:", error);
    }
  };

  const handleLogout = () => {
    try {
      // Clear user session data
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_mobile");
      
      // Clear additional user fields
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      
      // Clear all Razorpay session data
      localStorage.removeItem("rzp_checkout_anon_id");
      localStorage.removeItem("rzp_device_id");
      localStorage.removeItem("rzp_stored_checkout_id");
      
      // Clear any other Razorpay keys that might exist (they follow rzp_* pattern)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rzp_')) {
          localStorage.removeItem(key);
        }
      });
      
      // ✅ CRITICAL FIX: Clear session storage flags to allow page reload for next user
      sessionStorage.removeItem('hasReloadedHistory');
      sessionStorage.removeItem('hasReloadedDetails');
      
      console.log('✅ User session, Razorpay data, and session storage flags cleared');
    } catch (error) {
      console.error("Error clearing user session:", error);
    }

    setCurrentUser(null);
    
    // ✅ Reset auction state when logging out
    setCurrentAuction(prev => ({
      ...prev,
      userHasPaidEntry: false,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: prev.boxes.map(box => {
        if (box.type === 'entry') {
          return {
            ...box,
            hasPaid: false,
            currentBid: 0,
            bidder: null
          };
        }
        return box;
      })
    }));
    
      // ✅ Clear hourly auction ID
      setCurrentHourlyAuctionId(null);
      
      // ✅ Clear sticky payment state on logout
      setRecentPaymentSuccess(false);
      recentPaymentTimestamp.current = 0;
      
      setCurrentPage("game");
    window.history.pushState({}, '', '/');
  };

  const handleShowLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  const handleSwitchToSignup = () => {
    setCurrentPage('signup');
    window.history.pushState({}, '', '/signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
    window.history.pushState({}, '', '/login');
  };

  const handleCloseEntrySuccess = useCallback(() => setShowEntrySuccess(null), []);
  const handleCloseEntryFailure = useCallback(() => setShowEntryFailure(null), []);
  const handleCloseBidSuccess = useCallback(() => setShowBidSuccess(null), []);

    const handleEntrySuccess = useCallback(() => {
      if (!showEntrySuccess || !currentUser) return;

      toast.success('Entry Fee Paid!', {
        description: `Successfully paid ₹${showEntrySuccess.entryFee}. You're now in the auction!`,
        duration: 3000,
      });

      // ✅ Store payment status in localStorage to survive refresh and prevent flickering
      // Use the auction ID to ensure it's specific to this auction
      const auctionId = currentAuction.id;
      const paymentKey = `payment_${currentUser.id}_${auctionId}`;
      localStorage.setItem(paymentKey, 'true');
      // Set an expiry for 2 hours (enough for the auction duration)
      localStorage.setItem(`${paymentKey}_expiry`, (Date.now() + 2 * 60 * 60 * 1000).toString());

      // ✅ Close modal and update state instantly
      setShowEntrySuccess(null);
      
      setCurrentAuction(prev => ({
        ...prev,
        userHasPaidEntry: true,
        // ✅ CLEAR ROUND BOXES to force fresh rendering and show "Synchronizing..." state
        boxes: prev.boxes.map(b => 
          b.type === 'entry' 
            ? { ...b, hasPaid: true } 
            : { ...b, currentBid: 0, bidder: null, status: 'upcoming' }
        )
      }));

      // ✅ NEW: Sticky optimistic payment state update
      setRecentPaymentSuccess(true);
      recentPaymentTimestamp.current = Date.now();

      // ✅ Trigger refetch immediately to sync with server
      console.log('💳 Payment successful - triggering immediate auction data refresh');
      setForceRefetchTrigger(prev => prev + 1);
      
      // Refresh user profile stats too
      if (currentUser.id) {
        fetchAndSetUser(currentUser.id);
      }
    }, [showEntrySuccess, currentUser, currentAuction.id]);

  const handleEntryFailure = useCallback(() => {
    setShowEntryFailure(null);
  }, []);

  const handleRetryPayment = useCallback(() => {
    setShowEntryFailure(null);
    // User can click the Pay button again
  }, []);

  const handleUserParticipationChange = (isParticipating: boolean) => {
    setCurrentAuction(prev => ({
      ...prev,
      userHasPaidEntry: isParticipating
    }));
  };

  const handlePlaceBid = async (boxId: number, amount: number) => {
    if (isPlacingBid) return;
    
    if (!currentUser) {
      toast.error('Please login to place a bid');
      setCurrentPage('login');
      return;
    }

    if (!currentAuction.userHasPaidEntry) {
      toast.error('Please pay the entry fee first to participate in the auction');
      return;
    }

    if (!currentHourlyAuctionId) {
      toast.error('No active auction found. Please try again.');
      return;
    }

    const roundBox = currentAuction.boxes.find(b => b.id === boxId && b.type === 'round') as RoundBox | undefined;
    if (!roundBox) {
      toast.error('Invalid round selected');
      return;
    }

    // Check if user already placed bid in this round
    if (currentAuction.userBidsPerRound[roundBox.roundNumber]) {
      toast.error('You have already placed a bid in this round. You can only bid once per round.');
      return;
    }

    // Validate bid amount against previous round
    if (roundBox.roundNumber > 1) {
      const previousRoundBid = currentAuction.userBidsPerRound[roundBox.roundNumber - 1];
      if (previousRoundBid && amount <= previousRoundBid) {
        toast.error(`Your bid must be higher than your previous round bid of ₹${previousRoundBid.toLocaleString()}`);
        return;
      }
    }

    setIsPlacingBid(true);

    try {
      const response = await fetch(API_ENDPOINTS.scheduler.placeBid, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentUser.id,
          playerUsername: currentUser.username,
          auctionValue: amount,
          hourlyAuctionId: currentHourlyAuctionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to place bid');
        return;
      }

      // Success
      toast.success('Bid Placed Successfully!', {
        description: `Your bid of ₹${amount.toLocaleString()} has been placed in Round ${roundBox.roundNumber}!`,
      });

      // Update local state
      setCurrentAuction(prev => {
        const updatedBoxes = prev.boxes.map(b => {
          if (b.id === boxId && b.type === 'round') {
            const rb = b as RoundBox;
            return {
              ...rb,
              currentBid: amount,
              bidder: currentUser.username,
            };
          }
          return b;
        });

        const updatedUserBids = {
          ...prev.userBidsPerRound,
          [roundBox.roundNumber]: amount,
        };

        return {
          ...prev,
          boxes: updatedBoxes,
          userBidsPerRound: updatedUserBids,
        };
      });

    } catch (error) {
      console.error('Error placing bid:', error);
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setIsPlacingBid(false);
    }
  };

  const handleAdminLogin = (admin: any) => {
    setAdminUser(admin);
    setCurrentPage('admin-dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_user_id');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_userType');
    localStorage.removeItem('admin_isSuperAdmin');
    setAdminUser(null);
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
  };

  // Admin routes
  if (currentPage === 'admin-login') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AdminLogin
            onLogin={handleAdminLogin}
            onSignupClick={() => {
              setCurrentPage('admin-signup');
              window.history.pushState({}, '', '/d60-ctrl-x9k7/signup');
            }}
            onBack={() => {
              setCurrentPage('game');
              window.history.pushState({}, '', '/');
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'admin-signup') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AdminSignup
            onSignupSuccess={() => {
              setCurrentPage('admin-login');
              window.history.pushState({}, '', '/d60-ctrl-x9k7');
            }}
            onBack={() => {
              setCurrentPage('admin-login');
              window.history.pushState({}, '', '/d60-ctrl-x9k7');
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'admin-dashboard' && adminUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AdminDashboard adminUser={adminUser} onLogout={handleAdminLogout} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

    // Render different pages based on currentPage state
    if (currentPage === 'leaderboard' && selectedLeaderboard) {
      // If hourlyAuctionId is provided, show AuctionLeaderboard component
      if (selectedLeaderboard.hourlyAuctionId) {
        return (
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Sonner />
              <AuctionLeaderboard
                hourlyAuctionId={selectedLeaderboard.hourlyAuctionId}
                userId={currentUser?.id}
                onBack={handleBackToGame}
              />
            </TooltipProvider>
          </QueryClientProvider>
        );
      }
      
      // Otherwise show the regular Leaderboard component
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <Leaderboard
              roundNumber={selectedLeaderboard.roundNumber}
              onBack={handleBackToGame}
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

  if (currentPage === 'profile' && currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AccountSettings
            user={currentUser}
            onBack={handleBackToGame}
            onNavigate={handleNavigate}
            onDeleteAccount={() => {
              try {
                // Clear user session data
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("user_mobile");
                
                // Clear additional user fields
                localStorage.removeItem("email");
                localStorage.removeItem("username");
                
                // Clear all Razorpay session data
                localStorage.removeItem("rzp_checkout_anon_id");
                localStorage.removeItem("rzp_device_id");
                localStorage.removeItem("rzp_stored_checkout_id");
                
                // Clear any other Razorpay keys
                Object.keys(localStorage).forEach(key => {
                  if (key.startsWith('rzp_')) {
                    localStorage.removeItem(key);
                  }
                });
                
                console.log('✅ Account deleted - all user and Razorpay data cleared');
              } catch (error) {
                console.error("Error clearing session:", error);
              }

              setCurrentUser(null);
              
              // Reset auction state
              setCurrentAuction(prev => ({
                ...prev,
                userHasPaidEntry: false,
                userBidsPerRound: {},
                userQualificationPerRound: {},
                boxes: prev.boxes.map(box => {
                  if (box.type === 'entry') {
                    return {
                      ...box,
                      hasPaid: false,
                      currentBid: 0,
                      bidder: null
                    };
                  }
                  return box;
                })
              }));
              
              setCurrentHourlyAuctionId(null);
              setCurrentPage("login");
            }}
            onLogout={handleLogout}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'history' && currentUser) {
    if (selectedAuctionDetails) {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <AuctionDetailsPage
              auction={selectedAuctionDetails}
              onBack={() => {
                setSelectedAuctionDetails(null);
                localStorage.removeItem('selectedAuctionDetails');
                window.history.pushState({}, '', '/history');
              }}
              serverTime={serverTime}
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
            <AuctionHistory
              user={currentUser}
              onBack={handleBackToGame}
              onViewDetails={(auction) => {
                setSelectedAuctionDetails(auction);
                localStorage.setItem('selectedAuctionDetails', JSON.stringify(auction));
                window.history.pushState({}, '', '/history/details');
              }}
              serverTime={serverTime}
            />

        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'login') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <LoginForm
            onLogin={handleLogin}
            onSwitchToSignup={handleSwitchToSignup}
            onBack={handleBackToGame}
            onNavigate={handleNavigate}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'signup') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <SignupForm
            onSignup={handleSignup}
            onSwitchToLogin={handleSwitchToLogin}
            onBack={handleBackToGame}
            onNavigate={handleNavigate}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'rules') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <Rules onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

    if (currentPage === 'forgot') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <ForgotPasswordPage 
              onBack={handleSwitchToLogin} 
              onNavigate={handleNavigate}
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'participation') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <Participation onBack={handleBackToGame} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

      if (currentPage === 'careers') {
        return (
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Sonner />
              <CareersForm onBack={handleBackToGame} />
            </TooltipProvider>
          </QueryClientProvider>
        );
      }

      if (currentPage === 'about') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <AboutUs onNavigate={handleNavigate} />
            <Footer onNavigate={handleNavigate} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'terms') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <TermsAndConditions onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'privacy') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <PrivacyPolicy onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'refund-cancellation') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <RefundCancellation onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

    if (currentPage === 'support') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <Support user={currentUser} onBack={handleBackToGame} onNavigate={handleNavigate} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'view-guide') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <ViewGuide onBack={handleBackToGame} onNavigate={handleNavigate} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'winning-tips') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <WinningTips onBack={handleBackToGame} onNavigate={handleNavigate} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'support-chat') {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <SupportChatPage onBack={handleBackToGame} onNavigate={handleNavigate} />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

      if (currentPage === 'tester-feedback') {
        return (
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Sonner />
              <TesterFeedback 
                user={currentUser} 
                onBack={handleBackToGame} 
              />
            </TooltipProvider>
          </QueryClientProvider>
        );
      }

      if (currentPage === 'transactions' && currentUser) {
        return (
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Sonner />
              <TransactionHistoryPage user={currentUser} onBack={handleBackToGame} />
            </TooltipProvider>
          </QueryClientProvider>
        );
      }

if (currentPage === 'prizeshowcase') {
          return (
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                <BrowserRouter>
                  <Sonner />
                  <PrizeShowcasePage 
                    onBack={handleBackToGame} 
                    onJoinAuction={() => {
                      handleBackToGame();
                      // Scroll to auction grid on next tick
                      setTimeout(() => {
                        const grid = document.getElementById('auction-grid');
                        if (grid) {
                          grid.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 100);
                    }}
                    hourlyAuctionId={selectedPrizeShowcaseAuctionId}
                  />
                </BrowserRouter>
              </TooltipProvider>
            </QueryClientProvider>
          );
        }

        if (currentPage === 'contact') {
  
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <Contact onBack={handleBackToGame} currentUser={currentUser} />
          </TooltipProvider>
        </QueryClientProvider>
        );
      }

    if (currentPage === 'success-preview') {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <PaymentSuccess
              amount={Number(searchParams.get('amount')) || 60}
              type="entry"
              transactionId={searchParams.get('txnId') || ''}
              onBackToHome={handleBackToGame}
              onClose={handleBackToGame}
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    if (currentPage === 'failure-preview') {
      const searchParams = new URLSearchParams(window.location.search);
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Sonner />
            <PaymentFailure
              amount={Number(searchParams.get('amount')) || 60}
              errorMessage={searchParams.get('message') || "Payment processing failed"}
              transactionId={searchParams.get('txnId') || ''}
              onRetry={handleBackToGame}
              onBackToHome={handleBackToGame}
              onClose={handleBackToGame}
            />
          </TooltipProvider>
        </QueryClientProvider>
      );
    }

    // Default game page
    return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Sonner />
          
            <Header
              user={currentUser}
              onNavigate={handleNavigate}
              onLogin={handleShowLogin}
              onLogout={handleLogout}
              onStartTutorial={handleStartTutorial}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
            />

            {currentUser && (
              <WinnerClaimBanner
                userId={currentUser.id}
                onNavigate={handleNavigate}
                serverTime={serverTime}
              />
            )}

            <div data-whatsnew-target="prize-showcase">
              <ChristmasHeroBanner 
                user={currentUser} 
                onJoinNow={() => {
                  if (!currentUser) {
                    handleShowLogin();
                  } else {
                    // Smooth scroll to PrizeShowcase
                    const element = document.querySelector('[data-whatsnew-target="prize-showcase-section"]');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }} 
              />
            </div>

                <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
                          {/* Auction Banners Section */}
                          {serverTime && (
                            <div className="space-y-4">
                              {/* Current Auction Time Slot Banner */}
                              {liveAuctionData && (() => {
                                const activeRound = liveAuctionData?.rounds?.find((r: any) => r.status === 'ACTIVE');
                                const activeRoundNum = activeRound ? activeRound.roundNumber : (liveAuctionData?.currentRound || 1);
                                
                                  // Use TimeSlot from API as requested
                                  const timeSlot = liveAuctionData?.TimeSlot || "00:00";
                                  const [hours, minutes] = timeSlot.split(':').map(Number);
                                  const endHours = (hours + 1) % 24;
                                  const formattedEndTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                  const displayTime = `${timeSlot} to ${formattedEndTime}`;
                                  
                                  return (
                                    <>
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] text-white rounded-2xl p-4 sm:p-6 shadow-lg overflow-hidden relative"
                                      >
                                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                          <div className="flex items-center gap-3">
                                            <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                                            <div>
                                              <div className="text-sm sm:text-base opacity-90">Current Auction</div>
                                              <div className="text-xl sm:text-2xl font-bold">
                                                {displayTime}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                              <div className="text-xs sm:text-sm opacity-90">
                                                {liveAuctionData?.winnersAnnounced ? 'Status' : 'Active Round'}
                                              </div>
                                              <div className="text-lg sm:text-xl font-bold">
                                                {liveAuctionData?.winnersAnnounced ? 'Winners Announced' : `Round ${activeRoundNum}`}
                                              </div>
                                            </div>

                                            {/* Dropdown Arrow for non-participated users */}
                                            {!currentAuction.userHasPaidEntry && (
                                              <button 
                                                onClick={() => setIsAuctionSectionsVisible(!isAuctionSectionsVisible)}
                                                className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 transform active:scale-95 flex items-center justify-center"
                                                title={isAuctionSectionsVisible ? "Hide Auction Details" : "Show Auction Details"}
                                              >
                                                <motion.div
                                                  animate={{ rotate: isAuctionSectionsVisible ? 180 : 0 }}
                                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                >
                                                  <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
                                                </motion.div>
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>

                                        {/* Current Auction Details (Expanded) - Integrated here to appear between banners */}
                                        <AnimatePresence>
                                          {isAuctionSectionsVisible && (
                                            <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                                              className="overflow-hidden"
                                            >
                                              <div id="six-box-system-container" className="space-y-6 sm:space-y-10 mt-4">
                                                <div data-whatsnew-target="prize-showcase-section">
                                                  <PrizeShowcase
                                                    currentPrize={currentAuction}
                                                    isLoggedIn={!!currentUser}
                                                    onLogin={handleShowLogin}
                                                    serverTime={serverTime}
                                                    liveAuctionData={liveAuctionData}
                                                    isLoadingLiveAuction={isLoadingLiveAuction}
                                                    onPayEntry={(_boxId, totalEntryFee, paymentData) => {
                                                      if (!currentUser) return;
                                                      
                                                      console.log('💳 Payment successful - triggering IMMEDIATE auction data refresh', paymentData);
                                                      
                                                      // Extract payment method and UPI from paymentData if available
                                                      const method = paymentData?.payment?.paymentMethod || 'UPI / Card';
                                                      const upiId = paymentData?.payment?.paymentDetails?.vpa || '';
                                                      
                                                      // ✅ Update local state immediately for instant rendering without reload
                                                      setCurrentAuction(prev => ({
                                                        ...prev,
                                                        userHasPaidEntry: true,
                                                        boxes: prev.boxes.map(box => {
                                                          if (box.type === 'entry') {
                                                            return { ...box, hasPaid: true, currentBid: (box as EntryBox).entryFee || 0, bidder: currentUser.username };
                                                          }
                                                          return box;
                                                        })
                                                      }));

                                                      // ✅ Removed artificial scroll to prevent disturbance
                                                      // Background refresh continues silently
                                                      setForceRefetchTrigger(prev => prev + 1);
                                                      if (currentUser.id) {
                                                        fetchAndSetUser(currentUser.id);
                                                      }

                                                        setShowEntrySuccess({
                                                          entryFee: totalEntryFee,
                                                          boxNumber: 0,
                                                          auctionId: currentAuction.id,
                                                          auctionNumber: liveAuctionData?.TimeSlot || currentAuction.auctionHour,
                                                          productName: liveAuctionData?.auctionName || currentAuction.prize || 'Auction Prize',
                                                          productWorth: liveAuctionData?.prizeValue || currentAuction.prizeValue,
                                                          timeSlot: liveAuctionData?.TimeSlot || currentAuction.auctionHour,
                                                          paidBy: currentUser.username || currentUser.email,
                                                          paymentMethod: upiId ? `${method} (${upiId})` : method
                                                        });
                                                      }}
                                                      onPaymentFailure={(totalEntryFee, errorMessage) => {
                                                        // ✅ NEW: Background refresh and smooth scroll to auctionBoxes on failure too
                                                        setForceRefetchTrigger(prev => prev + 1);
                                                        
                                                        // Smooth scroll to auction boxes in background
                                                        setTimeout(() => {
                                                          const element = document.getElementById('auction-grid');
                                                          if (element) {
                                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                          }
                                                        }, 100);
                                  
                                                        setShowEntryFailure({
                                                          entryFee: totalEntryFee,
                                                          errorMessage,
                                                          auctionId: currentAuction.id,
                                                          auctionNumber: liveAuctionData?.TimeSlot || currentAuction.auctionHour,
                                                          productName: liveAuctionData?.auctionName || currentAuction.prize || 'Auction Prize',
                                                          productWorth: liveAuctionData?.prizeValue || currentAuction.prizeValue,
                                                          timeSlot: liveAuctionData?.TimeSlot || currentAuction.auctionHour,
                                                          paidBy: currentUser.username || currentUser.email,
                                                          paymentMethod: 'UPI / Card'
                                                        });

                                                  }}
                                                  onUserParticipationChange={handleUserParticipationChange}
                                                />
                                              </div>

                                              {currentUser && (
                                                <WinnersAnnouncedBanner 
                                                  onBidNow={handleBidNowScroll}
                                                />
                                              )}

                                              {currentUser ? (
                                                <div ref={auctionGridRef} data-auction-grid id="auction-grid">
                                                  {/* Auction Grid */}
                                                  <AuctionGrid
                                                    auction={currentAuction}
                                                    user={currentUser}
                                                    onShowLeaderboard={handleShowLeaderboard}
                                                    onBid={handlePlaceBid}
                                                    serverTime={serverTime} // ✅ Pass server time to AuctionGrid
                                                    isJoinWindowOpen={currentAuction.currentRound === 1}
                                                  />
                                                </div>
                                              ) : (
                                                <div className="bg-purple-50/50 rounded-2xl p-6 text-center border-2 border-dashed border-purple-200">
                                                  <h3 className="text-xl font-bold text-purple-800 mb-2">Join to See Details</h3>
                                                  <p className="text-purple-600 mb-4">Log in or create an account to view and participate in this auction.</p>
                                                  <Button onClick={handleShowLogin} className="bg-purple-600 hover:bg-purple-700">
                                                    Login / Sign Up
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                  </>
                                );
                              })()}

                              {/* Upcoming Auction Banner - Only for non-participants, placed directly below Current Auction Banner */}
                              {!currentAuction.userHasPaidEntry && upcomingAuctionData && (() => {
                                // Calculate end time for upcoming auction
                                const upcomingTimeSlot = upcomingAuctionData.TimeSlot || upcomingAuctionData.startTime || "00:00";
                                const [uHours, uMinutes] = upcomingTimeSlot.split(':').map(Number);
                                const uEndHours = (uHours + 1) % 24;
                                const formattedUEndTime = `${String(uEndHours).padStart(2, '0')}:${String(uMinutes).padStart(2, '0')}`;
                                const upcomingDisplayTime = `${upcomingTimeSlot} to ${formattedUEndTime}`;

                                return (
                                    <div className="space-y-4">
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-[#2D3047] via-[#404466] to-[#555B85] text-white rounded-2xl p-4 sm:p-6 shadow-lg overflow-hidden relative"
                                      >
                                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                          <div className="flex items-center gap-3">
                                            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-300" />
                                            <div>
                                              <div className="text-sm sm:text-base opacity-90">Next Upcoming Auction</div>
                                                <div className="text-xl sm:text-2xl font-bold">
                                                  {upcomingDisplayTime}
                                                </div>
                                                <div className="text-xs sm:text-sm text-blue-200 font-medium">
                                                  Starts in: <span className="font-mono font-bold text-white">{upcomingCountdown}</span>
                                                </div>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                                              <div className="text-xs sm:text-sm opacity-90">Status</div>
                                              <div className="text-lg sm:text-xl font-bold">Upcoming</div>
                                            </div>
                                            
                                            <button 
                                              onClick={() => setIsUpcomingAuctionVisible(!isUpcomingAuctionVisible)}
                                              className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 transform active:scale-95 flex items-center justify-center"
                                              title={isUpcomingAuctionVisible ? "Hide Upcoming Details" : "Show Upcoming Details"}
                                            >
                                              <motion.div
                                                animate={{ rotate: isUpcomingAuctionVisible ? 180 : 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                              >
                                                <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8" />
                                              </motion.div>
                                            </button>
                                          </div>
                                        </div>
                                      </motion.div>

                                      {/* Upcoming PrizeShowcase */}
                                      <AnimatePresence>
                                        {isUpcomingAuctionVisible && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                          >
                                            <PrizeShowcase
                                              currentPrize={{
                                                ...currentAuction,
                                                prize: upcomingAuctionData.auctionName || upcomingAuctionData.prizeName,
                                                prizeValue: upcomingAuctionData.prizeValue,
                                                auctionHour: upcomingAuctionData.TimeSlot
                                              }}
                                              isLoggedIn={!!currentUser}
                                              onLogin={handleShowLogin}
                                              serverTime={serverTime}
                                              liveAuctionData={upcomingAuctionData}
                                              isLoadingLiveAuction={false}
                                              isUpcoming={true}
                                              onPayEntry={() => {
                                                // Scroll to current auction to join
                                                const element = document.getElementById('six-box-system-container');
                                                if (element) {
                                                  element.scrollIntoView({ behavior: 'smooth' });
                                                }
                                                toast.info("Please wait for this auction to start or join the live one!");
                                              }}
                                            />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          <AuctionSchedule user={currentUser} onNavigate={handleNavigate} serverTime={serverTime} />

                      
                          {/* ✅ NEW: "Why Join Dream60?" container relocated below schedule and visible only to guests */}
                          {!currentUser && (
                                <div className="text-center py-8 sm:py-12 md:py-16 px-4 relative overflow-hidden">
                              <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700 mb-4">Ready to Start Winning?</h2>
                            <p className="text-lg sm:text-xl text-purple-600 mb-8 px-2">
                              Create your free account and start bidding on amazing prizes with direct payment!
                            </p>
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6 shadow-lg">
                              <h3 className="text-lg sm:text-xl font-semibold text-purple-700 mb-4">Why Join Dream60?</h3>
                              <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-purple-700">Pay</div>
                                  <div className="text-sm sm:text-base text-purple-600">Per Bid</div>
                                </div>
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-purple-700">{dailyStats.totalAuctions}x</div>
                                  <div className="text-sm sm:text-base text-purple-600">Daily Auctions</div>
                                </div>
                                <div>
                                  <div className="text-xl sm:text-2xl font-bold text-purple-700">₹{dailyStats.totalPrizeValue.toLocaleString()}+</div>
                                  <div className="text-sm sm:text-base text-purple-600">Prize Values</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                        <AuctionScheduleInfo />

                  </main>

                  <HowDream60Works />



            <style>{`
              @keyframes highlight-fade {
                0% { box-shadow: 0 0 0 0px rgba(139, 92, 246, 0.7); border-radius: 1.5rem; }
                50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0.3); border-radius: 1.5rem; }
                100% { box-shadow: 0 0 0 0px rgba(139, 92, 246, 0); border-radius: 1.5rem; }
              }
              .highlight-auction-grid {
                animation: highlight-fade 2s ease-in-out infinite;
                z-index: 50;
                position: relative;
              }
            `}</style>


          <Footer onNavigate={handleNavigate} />

          <AnimatePresence mode="sync">
              {/* Payment Success Modal */}
                  {showEntrySuccess && (
                      <PaymentSuccess
                        amount={showEntrySuccess.entryFee}
                        type="entry"
                        boxNumber={showEntrySuccess.boxNumber}
                        auctionId={showEntrySuccess.auctionId}
                        auctionNumber={showEntrySuccess.auctionNumber}
                        productName={showEntrySuccess.productName}
                        productWorth={showEntrySuccess.productWorth}
                        timeSlot={showEntrySuccess.timeSlot}
                        paidBy={showEntrySuccess.paidBy}
                        paymentMethod={showEntrySuccess.paymentMethod}
                        onBackToHome={handleEntrySuccess}
                        onClose={handleCloseEntrySuccess}
                      />
                    )}
                    {showEntryFailure && (
                      <PaymentFailure
                        amount={showEntryFailure.entryFee}
                        errorMessage={showEntryFailure.errorMessage}
                        auctionId={showEntryFailure.auctionId}
                        auctionNumber={showEntryFailure.auctionNumber}
                        productName={showEntryFailure.productName}
                        productWorth={showEntryFailure.productWorth}
                        timeSlot={showEntryFailure.timeSlot}
                        paidBy={showEntryFailure.paidBy}
                        paymentMethod={showEntryFailure.paymentMethod}
                        onRetry={handleRetryPayment}
                        onBackToHome={handleCloseEntryFailure}
                        onClose={handleCloseEntryFailure}
                      />
                    )}
  
              {/* Bid Success Modal */}
              {showBidSuccess && (
                <PaymentSuccess
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
                  onBackToHome={() => {
                    setShowBidSuccess(null);
                    setCurrentPage('game');
                  }}
                  onClose={() => setShowBidSuccess(null)}
                />
              )}

          </AnimatePresence>

              {/* What's New Tutorial Overlay - Only show on first login/signup or when manually triggered */}
                {currentUser && (
                  <TutorialOverlay
                    steps={whatsNewSteps}
                    tutorialId="dream60-whatsnew-v2"
                    startToken={tutorialStartToken}
                    forceShow={forceTutorialShow}
                    onComplete={() => { 
                      setMobileMenuOpen(false); 
                      setForceTutorialShow(false);
                      handleNavigate('game'); 
                    }}
                    returnTo=""
                  />
                )}

              {/* Amazon Voucher Modal - Shows on first login/signup */}
              <AmazonVoucherModal
                isVisible={showAmazonVoucherModal}
                onClose={() => setShowAmazonVoucherModal(false)}
              />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };

export default App;