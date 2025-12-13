import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Header } from './components/Header';
import { AuctionGrid } from './components/AuctionGrid';
import { AuctionSchedule } from './components/AuctionSchedule';
import { PrizeShowcase } from './components/PrizeShowcase';
import { Footer } from './components/Footer';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Support } from './components/Support';
import { Contact } from './components/Contact';
import { Rules } from './components/Rules';
import { Participation } from './components/Participation';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentFailure } from './components/PaymentFailure';
import { Leaderboard } from './components/Leaderboard';
import { AccountSettings } from './components/AccountSettings';
import { AuctionHistory } from './components/AuctionHistory';
import { AuctionDetailsPage } from './components/AuctionDetailsPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { PushNotificationPermission } from './components/PushNotificationPermission';
import { AmazonVoucherModal } from './components/AmazonVoucherModal';
import { toast } from 'sonner';
import { parseAPITimestamp } from './utils/timezone';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Sonner } from '@/components/ui/sonner';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { BrowserRouter } from 'react-router-dom';
import { API_ENDPOINTS } from '@/lib/api-config';

const queryClient = new QueryClient();

import type {
  Auction,
  AnyBox,
  EntryBox,
  RoundBox,
  BoxStatus,
} from "./types/auction";

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

let serverTimeOffset: number = 0;

const fetchServerTime = async (): Promise<ServerTime | null> => {
  try {
    const response = await fetch(API_ENDPOINTS.serverTime);
    const data = await response.json();
    
    if (data.success && data.data) {
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

export default function App() {
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;

    if (path === '/admin' || path === '/admin/') {
      const adminUserId = localStorage.getItem('admin_user_id');
      return adminUserId ? 'admin-dashboard' : 'admin-login';
    }
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot';
    if (path === '/rules') return 'rules';
    if (path === '/participation') return 'participation';
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/support') return 'support';
    if (path === '/contact') return 'contact';
    if (path === '/profile') return 'profile';
    if (path === '/history') return 'history';
    if (path.startsWith('/history/')) return 'history';
    if (path === '/leaderboard') return 'leaderboard';

    return 'game';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      
      if (path === '/admin' || path === '/admin/') {
        const adminUserId = localStorage.getItem('admin_user_id');
        setCurrentPage(adminUserId ? 'admin-dashboard' : 'admin-login');
      } else if (path === '/login') setCurrentPage('login');
      else if (path === '/signup') setCurrentPage('signup');
      else if (path === '/forgot-password') setCurrentPage('forgot');
      else if (path === '/rules') setCurrentPage('rules');
      else if (path === '/participation') setCurrentPage('participation');
      else if (path === '/terms') setCurrentPage('terms');
      else if (path === '/privacy') setCurrentPage('privacy');
      else if (path === '/support') setCurrentPage('support');
      else if (path === '/contact') setCurrentPage('contact');
      else if (path === '/profile') setCurrentPage('profile');
      else if (path === '/history' || path.startsWith('/history/')) {
        setCurrentPage('history');
        if (path === '/history') {
          setSelectedAuctionDetails(null);
        }
      } else if (path === '/leaderboard') setCurrentPage('leaderboard');
      else setCurrentPage('game');
    };

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

    const syncInterval = setInterval(async () => {
      const time = await fetchServerTime();
      if (time) {
        setServerTime(time);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
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

  const mapUserData = (userData: any) => {
    return {
      id: userData.user_id || userData.id,
      username: userData.username,
      mobile: userData.mobile,
      email: userData.email,
      isDeleted: userData.isDeleted || false,
      totalAuctions: userData.stats?.totalAuctions ?? userData.totalAuctions ?? 0,
      totalWins: userData.stats?.totalWins ?? userData.totalWins ?? 0,
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
      console.log('🔄 Fetching user data from API for userId:', userId);
      const response = await fetch(`${API_ENDPOINTS.auth.me}?user_id=${userId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch user data:', response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.user) {
        console.log('✅ User data fetched from API:', result.user);
        const mappedUser = mapUserData(result.user);
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

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/history/details' || path.startsWith('/history/details')) {
      const storedAuction = localStorage.getItem('selectedAuctionDetails');
      if (storedAuction) {
        try {
          const parsedAuction = JSON.parse(storedAuction);
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
  } | null>(null);

  const [showEntryFailure, setShowEntryFailure] = useState<{
    entryFee: number;
    errorMessage: string;
  } | null>(null);

  const [showBidSuccess, setShowBidSuccess] = useState<{
    amount: number;
    boxNumber: number;
  } | null>(null);

  const [selectedLeaderboard, setSelectedLeaderboard] = useState<{
    roundNumber: number;
  } | null>(null);

  const generateRandomEntryFee = () => Math.floor(Math.random() * 2501) + 1000;

  const [currentAuction, setCurrentAuction] = useState<Auction>(() => {
    const entryFee1 = generateRandomEntryFee();
    const entryFee2 = generateRandomEntryFee();
    const auctionHour = 11;
    const today = new Date();

    const activeHour = auctionHour;
    
    const startTime = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      activeHour,
      0,
      0
    );
    
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const roundBoxes: RoundBox[] = [1, 2, 3, 4].map((roundNum) => {
      const startMinutes = (roundNum - 1) * 15;
      const endMinutes = roundNum * 15;
      
      const opensAt = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        activeHour,
        startMinutes,
        0
      );
      
      const closesAt = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        activeHour,
        endMinutes,
        0
      );

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
      id: `auction-${activeHour}`,
      title: "Loading...",
      prize: "Loading...",
      prizeValue: 0,
      startTime,
      endTime,
      currentRound: 1,
      totalParticipants: 0,
      userHasPaidEntry: false,
      auctionHour: activeHour,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: [entryBox1, entryBox2, ...roundBoxes],
    };
  });

  useEffect(() => {
    if (!serverTime) return;
    
    const currentHour = getCurrentAuctionSlot(serverTime);
    if (!currentHour) return;
    
    if (currentAuction.auctionHour !== currentHour) {
      const entryFee1 = generateRandomEntryFee();
      const entryFee2 = generateRandomEntryFee();
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
  }, [serverTime]);

  const [currentHourlyAuctionId, setCurrentHourlyAuctionId] = useState<string | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [previousRound, setPreviousRound] = useState<number>(1);
  const [forceRefetchTrigger, setForceRefetchTrigger] = useState<number>(0);
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);
  const [liveAuctionData, setLiveAuctionData] = useState<any>(null);
  const [isLoadingLiveAuction, setIsLoadingLiveAuction] = useState<boolean>(true);

  useEffect(() => {
    const fetchInitialLiveAuction = async () => {
      setIsLoadingLiveAuction(true);
      
      try {
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        
        if (!response.ok) {
          console.log('⚠️ No live auction available');
          setIsLoadingLiveAuction(false);
          return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Initial live auction data loaded');
          setLiveAuctionData(result.data);
          
          setCurrentAuction(prev => ({
            ...prev,
            prize: result.data.auctionName || prev.prize,
            prizeValue: result.data.prizeValue || prev.prizeValue,
            totalParticipants: result.data.participants?.length || prev.totalParticipants,
          }));
        }
      } catch (error) {
        console.error('Error fetching initial live auction:', error);
      } finally {
        setIsLoadingLiveAuction(false);
      }
    };
    
    fetchInitialLiveAuction();
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const adminUserId = localStorage.getItem("admin_user_id");
        if (adminUserId && (currentPage === 'admin-login' || currentPage === 'admin-dashboard')) {
          const adminEmail = localStorage.getItem("admin_email");
          setAdminUser({
            user_id: adminUserId,
            username: 'admin_dream60',
            email: adminEmail || 'dream60@gmail.com',
            userType: 'ADMIN',
            userCode: '#ADMIN',
          });
          if (currentPage === 'admin-login') {
            setCurrentPage("admin-dashboard");
          }
          return;
        }

        const userId = localStorage.getItem("user_id");
        const username = localStorage.getItem("username");
        const email = localStorage.getItem("email");

        if (!userId || !username) return;

        const user = mapUserData({
          user_id: userId,
          username: username,
          email: email || '',
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

  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 User logged in - fetching updated user data from API');
      fetchAndSetUser(currentUser.id);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentPage === 'game' && currentUser?.id) {
      console.log('🔄 Navigated to homepage - refreshing user data from API');
      fetchAndSetUser(currentUser.id);
    }
  }, [currentPage, currentUser?.id]);

  useEffect(() => {
    if (!serverTime || !currentUser?.id || !currentAuction.userHasPaidEntry) return;
    
    const currentRound = getCurrentRoundByTime(serverTime);
    
    if (currentRound !== previousRound) {
      console.log(`🔄 Round changed from ${previousRound} to ${currentRound} - triggering auction data refresh`);
      setPreviousRound(currentRound);
      
      setForceRefetchTrigger(prev => prev + 1);
      
      toast.info(`Round ${currentRound} Started`, {
        description: 'Auction data refreshed with latest information',
        duration: 3000,
      });
    }
  }, [serverTime, currentUser?.id, currentAuction.userHasPaidEntry, previousRound]);

  useEffect(() => {
    const fetchBasicAuctionInfo = async () => {
      if (!currentUser?.id || currentAuction.userHasPaidEntry) return;
      
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
          
          setCurrentAuction(prev => ({
            ...prev,
            prize: liveAuction.auctionName || prev.prize,
            prizeValue: liveAuction.prizeValue || prev.prizeValue,
            totalParticipants: liveAuction.participants?.length || prev.totalParticipants,
          }));
          
          setJustLoggedIn(false);
        }
      } catch (error) {
        console.error('Error fetching basic auction info:', error);
        setJustLoggedIn(false);
      }
    };
    
    fetchBasicAuctionInfo();
  }, [currentUser?.id, justLoggedIn, currentAuction.userHasPaidEntry]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!serverTime) return;
      
      const currentHour = getCurrentAuctionSlot(serverTime);
      const currentRound = getCurrentRoundByTime(serverTime);

      setCurrentAuction((prev) => {
        if (currentHour && currentHour !== prev.auctionHour) {
          const entryFee1 = generateRandomEntryFee();
          const entryFee2 = generateRandomEntryFee();
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
  }, [serverTime]);

  useEffect(() => {
    const fetchCurrentAuctionId = async () => {
      if (!currentUser?.id) return;
      
      if (!currentAuction.userHasPaidEntry && !justLoggedIn) return;
      
      if (justLoggedIn) {
        console.log('🔄 User just logged in - forcing immediate auction data refresh');
        setJustLoggedIn(false);
      }
      
      setIsLoadingLiveAuction(true);
      
      try {
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.success && result.data?.hourlyAuctionId) {
          setCurrentHourlyAuctionId(result.data.hourlyAuctionId);
          console.log('✅ Live auction ID set:', result.data.hourlyAuctionId);
          
          setLiveAuctionData(result.data);
          
          const liveAuction = result.data;
          const userBidsMap: { [roundNumber: number]: number } = {};
          const userQualificationMap: { [roundNumber: number]: boolean } = {};
          
          let userEntryFeeFromAPI: number | undefined = undefined;
          let userHasPaidEntryFromAPI = false;
          
          if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
            const userParticipant = liveAuction.participants.find(
              (participant: any) => participant.playerId === currentUser.id
            );
            
            if (userParticipant) {
              userHasPaidEntryFromAPI = true;
              userEntryFeeFromAPI = userParticipant.entryFee;
              console.log(`✅ User found in participants - entry fee paid: ₹${userEntryFeeFromAPI}`);
            } else {
              console.log(`⚠️ User NOT found in participants - entry fee not paid`);
            }
          }
          
          let userParticipant = null;
          if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
            userParticipant = liveAuction.participants.find(
              (participant: any) => participant.playerId === currentUser.id
            );
            
            if (userParticipant) {
              console.log(`👤 Found user in participants:`, {
                username: userParticipant.playerUsername,
                isEliminated: userParticipant.isEliminated,
                eliminatedInRound: userParticipant.eliminatedInRound,
                currentRound: userParticipant.currentRound
              });
            }
          }
          
          if (liveAuction.rounds && Array.isArray(liveAuction.rounds)) {
            liveAuction.rounds.forEach((round: any) => {
              if (round.playersData && Array.isArray(round.playersData)) {
                const userBid = round.playersData.find(
                  (player: any) => player.playerId === currentUser.id
                );
                
                if (userBid && userBid.auctionPlacedAmount) {
                  userBidsMap[round.roundNumber] = userBid.auctionPlacedAmount;
                  console.log(`✅ Found existing bid in Round ${round.roundNumber}: ₹${userBid.auctionPlacedAmount}`);
                }
              }
            });
            
            liveAuction.rounds.forEach((round: any) => {
              if (round.roundNumber === 1) {
                userQualificationMap[1] = true;
                console.log(`✅ Round 1: User is eligible (entry fee paid)`);
              }
              
              if (round.roundNumber > 1) {
                if (userParticipant && userParticipant.isEliminated === true) {
                  userQualificationMap[round.roundNumber] = false;
                  console.log(`❌ Round ${round.roundNumber}: User is ELIMINATED (isEliminated=true from participants array)`);
                } else if (userParticipant && userParticipant.isEliminated === false) {
                  userQualificationMap[round.roundNumber] = true;
                  console.log(`✅ Round ${round.roundNumber}: User is QUALIFIED (isEliminated=false from participants array)`);
                } else {
                  console.log(`⏳ Round ${round.roundNumber}: No participant data found, waiting...`);
                }
              }
            });
          }
          
          setCurrentAuction(prev => {
            const updatedBoxes = prev.boxes.map(box => {
              if (box.type === 'round') {
                const roundBox = box as RoundBox;
                const roundData = liveAuction.rounds?.find(
                  (r: any) => r.roundNumber === roundBox.roundNumber
                );
                
                let updatedBox = { ...roundBox };
                
                if (liveAuction.winnersAnnounced) {
                  updatedBox.winnersAnnounced = true;
                }
                
                if (roundBox.roundNumber === 1) {
                  updatedBox.minBid = userEntryFeeFromAPI || 10;
                  console.log(`✅ Round 1 minBid = ₹${updatedBox.minBid} (entry fee from API)`);
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
                  
                  console.log(`✅ Round ${roundBox.roundNumber} highest bid from API: ₹${highestBidFromAPI}`);
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
              userHasPaidEntry: userHasPaidEntryFromAPI,
            };
          });
        } else {
          console.log('⚠️ No live auction found in response');
        }
      } catch (error) {
        console.error('Error fetching live auction:', error);
      } finally {
        setIsLoadingLiveAuction(false);
      }
    };

    fetchCurrentAuctionId();
    
    const hasActiveRound = currentAuction.boxes.some(
      box => box.type === 'round' && box.isOpen
    );
    const pollInterval = hasActiveRound ? 5000 : 10000;
    
    const interval = setInterval(fetchCurrentAuctionId, pollInterval);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentAuction.userHasPaidEntry, justLoggedIn, forceRefetchTrigger]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    
    const urlMap: { [key: string]: string } = {
      'game': '/',
      'login': '/login',
      'signup': '/signup',
      'forgot': '/forgot-password',
      'rules': '/rules',
      'participation': '/participation',
      'terms': '/terms',
      'privacy': '/privacy',
      'support': '/support',
      'contact': '/contact',
      'profile': '/profile',
      'history': '/history',
      'leaderboard': '/leaderboard',
      'admin-login': '/admin',
      'admin-dashboard': '/admin'
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
      const mappedUser = mapUserData(user);
      setCurrentUser(mappedUser);
      
      console.log('✅ User logged in successfully:', mappedUser.username);

      try {
        console.log('🔄 [LOGIN] Fetching live auction data to verify entry fee status...');
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            const liveAuction = result.data;
            
            let userHasPaid = false;
            if (liveAuction.participants && Array.isArray(liveAuction.participants)) {
              const userParticipant = liveAuction.participants.find(
                (p: any) => p.playerId === mappedUser.id
              );
              userHasPaid = !!userParticipant;
              console.log(`✅ [LOGIN] Entry fee status: ${userHasPaid ? 'PAID' : 'NOT PAID'}`);
            }
            
            setCurrentAuction(prev => ({
              ...prev,
              userHasPaidEntry: userHasPaid,
              userBidsPerRound: {},
              userQualificationPerRound: {},
              prize: liveAuction.auctionName || prev.prize,
              prizeValue: liveAuction.prizeValue || prev.prizeValue,
              totalParticipants: liveAuction.participants?.length || prev.totalParticipants,
            }));
            
            setLiveAuctionData(liveAuction);
            if (liveAuction.hourlyAuctionId) {
              setCurrentHourlyAuctionId(liveAuction.hourlyAuctionId);
            }
          }
        }
      } catch (fetchError) {
        console.error('Error fetching auction data on login:', fetchError);
        setCurrentAuction(prev => ({
          ...prev,
          userHasPaidEntry: false,
          userBidsPerRound: {},
          userQualificationPerRound: {},
        }));
      }

      setJustLoggedIn(true);
      setForceRefetchTrigger(prev => prev + 1);

      setCurrentPage("game");
      window.history.pushState({}, '', '/');
    } catch (error) {
      console.error("Error while login:", error);
    }
  };

  const handleSignup = async (user: any) => {
    try {
      const mappedUser = mapUserData(user);
      setCurrentUser(mappedUser);
      
      console.log('✅ User signed up successfully:', mappedUser.username);

      setCurrentPage("game");
      window.history.pushState({}, '', '/');
    } catch (error) {
      console.error("Error while signup:", error);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_mobile");
      
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      
      localStorage.removeItem("rzp_checkout_anon_id");
      localStorage.removeItem("rzp_device_id");
      localStorage.removeItem("rzp_stored_checkout_id");
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rzp_')) {
          localStorage.removeItem(key);
        }
      });
      
      sessionStorage.removeItem('hasReloadedHistory');
      sessionStorage.removeItem('hasReloadedDetails');
      
      console.log('✅ User session, Razorpay data, and session storage flags cleared');
    } catch (error) {
      console.error("Error clearing user session:", error);
    }

    setCurrentUser(null);
    
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

  const handleEntrySuccess = () => {
    if (!showEntrySuccess || !currentUser) return;

    toast.success('Entry Fee Paid!', {
      description: `Successfully paid ₹${showEntrySuccess.entryFee}. You're now in the auction!`,
    });

    setCurrentAuction(prev => {
      const now = new Date();

      const updatedBoxes: AnyBox[] = prev.boxes.map((b) => {
        if (b.type === 'entry') {
          const entry = b as EntryBox;
          return {
            ...entry,
            currentBid: entry.entryFee || 0,
            bidder: currentUser.username,
            hasPaid: true,
          };
        }
        if (b.type === 'round') {
          const roundBox = b as RoundBox;
          const isNowOpen = now >= roundBox.opensAt && now < roundBox.closesAt;
          return { ...roundBox, isOpen: isNowOpen };
        }
        return b;
      });

      return {
        ...prev,
        boxes: updatedBoxes,
        userHasPaidEntry: true
      };
    });

    console.log('💳 Payment successful - triggering IMMEDIATE auction data refresh');
    setForceRefetchTrigger(prev => prev + 1);

    setShowEntrySuccess(null);
  };

  const handleEntryFailure = () => {
    setShowEntryFailure(null);
  };

  const handleRetryPayment = () => {
    setShowEntryFailure(null);
  };

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

    if (currentAuction.userBidsPerRound[roundBox.roundNumber]) {
      toast.error('You have already placed a bid in this round. You can only bid once per round.');
      return;
    }

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

      toast.success('Bid Placed Successfully!', {
        description: `Your bid of ₹${amount.toLocaleString()} has been placed in Round ${roundBox.roundNumber}!`,
      });

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
    setAdminUser(null);
    setCurrentPage('game');
    window.history.pushState({}, '', '/');
  };

  if (currentPage === 'admin-login') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <AdminLogin
            onLogin={handleAdminLogin}
            onBack={() => {
              setCurrentPage('game');
              window.history.pushState({}, '', '/');
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

  if (currentPage === 'leaderboard' && selectedLeaderboard) {
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
                localStorage.removeItem("user_id");
                localStorage.removeItem("user_name");
                localStorage.removeItem("user_email");
                localStorage.removeItem("user_mobile");
                
                localStorage.removeItem("email");
                localStorage.removeItem("username");
                
                localStorage.removeItem("rzp_checkout_anon_id");
                localStorage.removeItem("rzp_device_id");
                localStorage.removeItem("rzp_stored_checkout_id");
                
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
          <ForgotPasswordPage onBack={handleSwitchToLogin} />
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

  if (currentPage === 'support') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <Support onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (currentPage === 'contact') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <Contact onBack={handleBackToGame} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

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
          />

          <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            <div className="text-center space-y-4 px-2 sm:px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold 
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] 
  bg-clip-text text-transparent">
  DREAM60
</h1>

              <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC]
  bg-clip-text text-transparent">
  The ultimate 60-minute auction game. Enter, bid, and win amazing prizes in our hourly auctions!
</p>

              {!currentUser && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 px-4">
                  <button
                    onClick={handleShowLogin}
                    className="bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] text-white font-semibold px-6 sm:px-8 py-3 rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg w-full sm:w-auto"
                  >
                    Join Now & Start Playing
                  </button>
                  <button
                    onClick={handleSwitchToSignup}
                    className="border border-purple-600 text-purple-700 font-semibold px-6 sm:px-8 py-3 rounded-xl hover:bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] hover:text-white transition-all w-full sm:w-auto"
                  >
                    Create Account
                  </button>
                </div>
              )}
            </div>

            {serverTime && getCurrentAuctionSlot(serverTime) && (
              <div className="bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] text-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                    <div>
                      <div className="text-sm sm:text-base opacity-90">Current Auction (IST)</div>
                      <div className="text-xl sm:text-2xl font-bold">
                        {currentAuction.startTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })} - {currentAuction.endTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                    <div className="text-xs sm:text-sm opacity-90">Active Round</div>
                    <div className="text-lg sm:text-xl font-bold">Round {currentAuction.currentRound}</div>
                  </div>
                </div>
              </div>
            )}

            <PrizeShowcase
              currentPrize={currentAuction as any}
              isLoggedIn={!!currentUser}
              serverTime={serverTime}
              liveAuctionData={liveAuctionData}
              isLoadingLiveAuction={isLoadingLiveAuction}
              onPayEntry={(_boxId, totalEntryFee) => {
                if (!currentUser) return;
                
                console.log('💳 Payment successful - triggering IMMEDIATE auction data refresh');
                setForceRefetchTrigger(prev => prev + 1);
              }}
            />

            <AuctionGrid
              auction={currentAuction}
              onPlaceBid={handlePlaceBid}
              isLoggedIn={!!currentUser}
              onShowLeaderboard={handleShowLeaderboard}
              currentRound={currentAuction.currentRound}
            />

            <AuctionSchedule
              serverTime={serverTime}
              onShowLeaderboard={handleShowLeaderboard}
              currentUser={currentUser}
            />

            <Footer onNavigate={handleNavigate} />
          </main>
          
          {currentUser && <AmazonVoucherModal userId={currentUser.id} />}
          {currentUser && <PushNotificationPermission userId={currentUser.id} username={currentUser.username} />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
