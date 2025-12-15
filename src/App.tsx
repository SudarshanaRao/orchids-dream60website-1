import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PrizeShowcase } from "./components/PrizeShowcase";
import { AuctionBoxes } from "./components/AuctionBoxes";
import PaymentSuccess from "./components/modals/PaymentSuccess";
import PaymentFailure from "./components/modals/PaymentFailure";
import Leaderboard from "./pages/Leaderboard";
import LoginForm from "./pages/LoginForm";
import SignupForm from "./pages/SignupForm";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AccountSettings from "./pages/AccountSettings";
import AuctionHistory from "./pages/AuctionHistory";
import Rules from "./pages/Rules";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { Clock, AlertTriangle } from "lucide-react";
import Participation from "./pages/Participation";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import AuctionDetailsPage from "./pages/AuctionDetailsPage";
import {parseAPITimestamp } from './utils/timezone';
import { formatDistanceToNow } from 'date-fns';
import { API_ENDPOINTS } from '@/lib/api-config';
import { subscribeToNotifications } from './utils/notification-helpers';

const queryClient = new QueryClient();

export type User = {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  totalWinnings?: number;
  auctionsWon?: number;
  auctionsParticipated?: number;
};

export type Page =
  | "game"
  | "leaderboard"
  | "login"
  | "signup"
  | "profile"
  | "history"
  | "rules"
  | "forgot"
  | "participation"
  | "terms"
  | "privacy"
  | "support"
  | "contact";

// ✅ NEW: ServerTime interface
export interface ServerTime {
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

export interface EntryBox {
  id: number;
  type: 'entry';
  entryFee: number;
  hasPaid: boolean;
}

export interface RoundBox {
  id: number;
  type: 'round';
  roundNumber: number;
  bidAmount: number;
  hasBid: boolean;
  currentBid: number;
  bidder: string | null;
  isOpen: boolean;
  isQualified?: boolean;
}

// Type guard functions
function isEntryBox(box: EntryBox | RoundBox): box is EntryBox {
  return box.type === 'entry';
}

function isRoundBox(box: EntryBox | RoundBox): box is RoundBox {
  return box.type === 'round';
}

// ✅ Add function to format countdown timer
function formatCountdown(serverTime: ServerTime): string {
  const minutesLeft = 60 - serverTime.minute - 1;
  const secondsLeft = 60 - serverTime.second;
  return `${minutesLeft.toString().padStart(2, '0')}:${secondsLeft.toString().padStart(2, '0')}`;
}

// ✅ Add function to get current auction time slot
function getCurrentAuctionSlot(serverTime: ServerTime): string {
  const currentHour = serverTime.hour;
  const nextHour = (currentHour + 1) % 24;
  return `${currentHour.toString().padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("game");
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<{ roundNumber: number } | null>(null);
  const [selectedAuctionDetails, setSelectedAuctionDetails] = useState<any>(null);

  // ✅ NEW: Server time state
  const [serverTime, setServerTime] = useState<ServerTime | null>(null);

  // ✅ NEW: Live auction data state
  const [liveAuctionData, setLiveAuctionData] = useState<any>(null);
  const [isLoadingLiveAuction, setIsLoadingLiveAuction] = useState(true);

  const [currentAuction, setCurrentAuction] = useState<{
    prize: string;
    prizeValue: number;
    totalParticipants: number;
    userHasPaidEntry: boolean;
    userBidsPerRound: { [roundNumber: number]: number };
    userQualificationPerRound: { [roundNumber: number]: boolean };
    boxes: Array<EntryBox | RoundBox>;
  }>({
    prize: "iPhone 15 Pro",
    prizeValue: 120000,
    totalParticipants: 245,
    userHasPaidEntry: false,
    userBidsPerRound: {},
    userQualificationPerRound: {},
    boxes: []
  });

  const [showEntrySuccess, setShowEntrySuccess] = useState<{ entryFee: number; boxNumber: number } | null>(null);
  const [showEntryFailure, setShowEntryFailure] = useState<{ entryFee: number; errorMessage: string } | null>(null);
  const [showBidSuccess, setShowBidSuccess] = useState<{ bidAmount: number; roundNumber: number } | null>(null);
  const [showBidFailure, setShowBidFailure] = useState<{ bidAmount: number; roundNumber: number; errorMessage: string } | null>(null);

  // Track current auction ID to re-fetch on new auction
  const [currentHourlyAuctionId, setCurrentHourlyAuctionId] = useState<string | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");
    const userEmail = localStorage.getItem("user_email") || localStorage.getItem("email");
    const userMobile = localStorage.getItem("user_mobile");

    if (userId && userName && userEmail) {
      setCurrentUser({
        id: userId,
        name: userName,
        email: userEmail,
        mobile: userMobile || undefined,
      });
    }
  }, []);

  // ✅ NEW: Fetch server time every second
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.SERVER_TIME}`);
        if (!res.ok) throw new Error('Failed to fetch server time');
        const data = await res.json();
        setServerTime(data);
      } catch (error) {
        console.error('❌ [APP] Failed to fetch server time:', error);
      }
    };

    // Initial fetch
    fetchServerTime();

    // Update every second
    const interval = setInterval(fetchServerTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ NEW: Fetch live auction data every 5 seconds
  useEffect(() => {
    const fetchLiveAuction = async () => {
      try {
        console.log('📡 [APP] Fetching live auction data...');
        const res = await fetch(`${API_ENDPOINTS.LIVE_AUCTION}`);
        if (!res.ok) {
          if (res.status === 404) {
            console.log('⚠️ [APP] No live auction found');
            setLiveAuctionData(null);
            setIsLoadingLiveAuction(false);
            return;
          }
          throw new Error('Failed to fetch live auction');
        }
        const data = await res.json();
        console.log('✅ [APP] Live auction data received:', data);
        setLiveAuctionData(data);
        
        // ✅ Check if auction ID changed (new auction started)
        if (currentHourlyAuctionId && data.hourlyAuctionId !== currentHourlyAuctionId) {
          console.log('🔄 [APP] New auction detected, resetting state');
          // Reset state for new auction
          setCurrentAuction(prev => ({
            ...prev,
            userHasPaidEntry: false,
            userBidsPerRound: {},
            userQualificationPerRound: {},
            boxes: []
          }));
        }
        
        setCurrentHourlyAuctionId(data.hourlyAuctionId);
        setIsLoadingLiveAuction(false);
      } catch (error) {
        console.error('❌ [APP] Failed to fetch live auction:', error);
        setIsLoadingLiveAuction(false);
      }
    };

    // Initial fetch
    fetchLiveAuction();

    // Poll every 5 seconds
    const interval = setInterval(fetchLiveAuction, 5000);

    return () => clearInterval(interval);
  }, [currentHourlyAuctionId]);

  const handleNavigate = (page: Page) => {
    if (page === "leaderboard") {
      setSelectedLeaderboard({ roundNumber: 1 }); // Or get roundNumber from active round
    }
    setCurrentPage(page);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage("game");
    
    // ✅ Subscribe to push notifications after login
    subscribeToNotifications(user.id);
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    setCurrentPage("game");
    
    // ✅ Subscribe to push notifications after signup
    subscribeToNotifications(user.id);
  };

  const handleLogout = () => {
    // Clear user session
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
    setCurrentUser(null);
    // Reset auction state
    setCurrentAuction(prev => ({
      ...prev,
      userHasPaidEntry: false,
      userBidsPerRound: {},
      userQualificationPerRound: {},
      boxes: prev.boxes.map(box => {
        if (isEntryBox(box)) {
          return {
            ...box,
            hasPaid: false
          };
        }
        return box;
      })
    }));
    setCurrentHourlyAuctionId(null);
    setCurrentPage("game");
  };

  const handleBackToGame = () => {
    setCurrentPage("game");
    setSelectedLeaderboard(null);
  };

  const handleShowLogin = () => {
    setCurrentPage("login");
  };

  const handleSwitchToSignup = () => {
    setCurrentPage("signup");
  };

  const handleSwitchToLogin = () => {
    setCurrentPage("login");
  };

  const handlePayEntry = (boxId: number, entryFee: number) => {
    // When user pays entry successfully, refetch live auction data
    console.log('💰 [APP] Entry payment callback triggered, refetching auction data');
    
    // Force immediate refetch
    fetch(`${API_ENDPOINTS.LIVE_AUCTION}`)
      .then(res => res.json())
      .then(data => {
        console.log('✅ [APP] Refetched live auction after payment:', data);
        setLiveAuctionData(data);
        setCurrentAuction(prev => ({
          ...prev,
          userHasPaidEntry: true,
          boxes: prev.boxes.map(box => {
            if (isEntryBox(box) && box.id === boxId) {
              return {
                ...box,
                hasPaid: true
              };
            }
            return box;
          })
        }));
        setShowEntrySuccess({ entryFee, boxNumber: boxId });
      })
      .catch(error => {
        console.error('❌ [APP] Failed to refetch auction after payment:', error);
      });
  };

  const handlePaymentFailure = (entryFee: number, errorMessage: string) => {
    setShowEntryFailure({ entryFee, errorMessage });
  };

  const handleUserParticipationChange = (isParticipating: boolean) => {
    // This callback can be used to update parent state based on user's participation
    console.log('User participation status changed:', isParticipating);
    setCurrentAuction(prev => ({
      ...prev,
      userHasPaidEntry: isParticipating
    }));
  };

  const handleEntrySuccess = () => {
    setShowEntrySuccess(null);
  };

  const handleEntryFailure = () => {
    setShowEntryFailure(null);
  };

  const handleBidSuccess = () => {
    setShowBidSuccess(null);
  };

  const handleBidFailure = () => {
    setShowBidFailure(null);
  };

  const handleRetryPayment = () => {
    // In a real implementation, this would initiate the payment flow again
    console.log("Retry payment clicked");
    setShowEntryFailure(null);
    setShowBidFailure(null);
  };

  // Handle popstate for browser back button
  useEffect(() => {
    // Detect initial path
    const path = window.location.pathname;
    if (path === '/history/details') {
      const savedDetails = localStorage.getItem('selectedAuctionDetails');
      if (savedDetails) {
        try {
          const details = JSON.parse(savedDetails);
          setSelectedAuctionDetails(details);
          setCurrentPage('history');
        } catch (error) {
          console.error('Failed to parse saved auction details:', error);
          setCurrentPage('game');
        }
      } else {
        setCurrentPage('game');
      }
    } else if (path === '/history') {
      setCurrentPage('history');
    }

    const handlePopState = () => {
      const path = window.location.pathname;
      
      if (path === '/history/details') {
        // Do nothing, let the component handle it
      } else if (path === '/history') {
        setSelectedAuctionDetails(null);
        localStorage.removeItem('selectedAuctionDetails');
      } else {
        setCurrentPage('game');
        setSelectedAuctionDetails(null);
        localStorage.removeItem('selectedAuctionDetails');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ Handle auction participation data from liveAuctionData
  useEffect(() => {
    if (!liveAuctionData) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    // Check if user is participating in current auction
    const isUserParticipating = liveAuctionData.participants?.some(
      (p: any) => p.playerId === userId
    );

    if (isUserParticipating) {
      console.log('✅ [APP] User is participating in current auction');
      setCurrentAuction(prev => ({
        ...prev,
        userHasPaidEntry: true
      }));
    }

    // Process rounds data to build auction boxes
    if (liveAuctionData.rounds && liveAuctionData.rounds.length > 0) {
      console.log('📊 [APP] Processing rounds data:', liveAuctionData.rounds);

      const userId = localStorage.getItem('user_id');

      // ✅ Create entry box - Box 0 (Entry Fee)
      const entryBox: EntryBox = {
        id: 0,
        type: 'entry',
        entryFee: (liveAuctionData.FeeSplits?.BoxA || 0) + (liveAuctionData.FeeSplits?.BoxB || 0),
        hasPaid: isUserParticipating
      };

      // ✅ Create round boxes - Boxes 1-4 based on rounds data
      const roundBoxes: RoundBox[] = liveAuctionData.rounds.map((round: any) => {
        // Check if user has placed a bid in this round
        const userBid = userId ? round.playersData?.find((p: any) => p.playerId === userId) : null;
        const hasBid = !!userBid;
        const currentBid = userBid?.bidAmount || 0;

        // Check if user qualified for this round
        const isQualified = userId ? round.qualifiedPlayers?.some((p: any) => p.playerId === userId) : false;

        // Determine if box is open based on round status and server time
        let isOpen = false;
        if (serverTime) {
          const roundStartMinute = (round.roundNumber - 1) * 15; // Round 1: 0, Round 2: 15, Round 3: 30, Round 4: 45
          const roundEndMinute = round.roundNumber * 15; // Round 1: 15, Round 2: 30, Round 3: 45, Round 4: 60

          // Box is open if current time is within the round's time window AND user has paid entry
          isOpen = isUserParticipating && 
                   serverTime.minute >= roundStartMinute && 
                   serverTime.minute < roundEndMinute &&
                   round.status === 'ACTIVE';
        }

        return {
          id: round.roundNumber,
          type: 'round' as const,
          roundNumber: round.roundNumber,
          bidAmount: 0, // This will be set by the component based on user input
          hasBid,
          currentBid,
          bidder: userBid?.playerUsername || null,
          isOpen,
          isQualified
        };
      });

      setCurrentAuction(prev => ({
        ...prev,
        userHasPaidEntry: isUserParticipating,
        boxes: [entryBox, ...roundBoxes]
      }));
    } else {
      console.log('⚠️ [APP] No rounds data available');


      const entryBox1: EntryBox = {
        id: 1,
        type: "entry",
        entryFee: (liveAuctionData?.FeeSplits?.BoxA || 0) +
                  (liveAuctionData?.FeeSplits?.BoxB || 0),
        hasPaid: isUserParticipating,
      };

      setCurrentAuction((prev) => ({
        ...prev,
        userHasPaidEntry: isUserParticipating,
        boxes: [entryBox1],
      }));
    }
  }, [liveAuctionData, serverTime]);

  // Render different pages based on currentPage state
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
          />

          <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 px-2 sm:px-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold 
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] 
  bg-clip-text text-transparent">
  DREAM60
</h1>

              <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4
  bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC]
  bg-clip-text text-transparent">
  The ultimate 60-minute auction experience. Enter, bid, and win amazing prizes in our hourly auctions!
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

            {/* Current Auction Time Slot Banner */}
            {/* ✅ Only show banner after server time is loaded */}
            {serverTime && getCurrentAuctionSlot(serverTime) && (
              <div className="relative group/banner">
                {/* Animated gradient background glow */}
                <div className="absolute -inset-[2px] bg-gradient-to-r from-[#8456BC]/40 via-[#9F7ACB]/30 to-[#8456BC]/40 rounded-2xl blur-xl opacity-50 group-hover/banner:opacity-70 transition-opacity duration-500 animate-pulse"></div>
                
                {/* Main banner container */}
                <div className="relative backdrop-blur-2xl bg-gradient-to-r from-purple-50/90 via-white/95 to-purple-50/90 rounded-2xl border-2 border-purple-200/50 p-3 sm:p-4 md:p-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Left section - Current Auction Label */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8456BC] to-[#B99FD9] rounded-xl blur-md opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-[#8456BC] to-[#B99FD9] p-2 sm:p-2.5 rounded-xl shadow-lg">
                          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-purple-600 font-medium">Current Auction</p>
                        <p className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#53317B] to-[#8456BC] bg-clip-text text-transparent">
                          {getCurrentAuctionSlot(serverTime)}
                        </p>
                      </div>
                    </div>

                    {/* Middle section - Time Left */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-center px-3 sm:px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200/50 shadow-sm">
                        <p className="text-xs text-red-600 font-medium mb-0.5">Time Left</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-mono font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent tracking-tight">
                          {formatCountdown(serverTime)}
                        </p>
                      </div>
                    </div>

                    {/* Right section - Join Window Status */}
                    <div className="flex items-center gap-2">
                      {serverTime.minute < 15 ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50 shadow-sm">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-md shadow-emerald-500/50"></div>
                          <span className="text-xs sm:text-sm md:text-base font-bold text-emerald-700 whitespace-nowrap">
                            Join Window Open
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200/50 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                          <span className="text-xs sm:text-sm md:text-base font-bold text-red-700 whitespace-nowrap">
                            Auction in Progress
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <PrizeShowcase
              currentPrize={{
                title: currentAuction.prize,
                prize: currentAuction.prize,
                prizeValue: currentAuction.prizeValue,
                totalParticipants: currentAuction.totalParticipants,
                userHasPaidEntry: currentAuction.userHasPaidEntry,
                boxes: currentAuction.boxes
              }}
              onPayEntry={handlePayEntry}
              onPaymentFailure={handlePaymentFailure}
              onUserParticipationChange={handleUserParticipationChange}
              isLoggedIn={!!currentUser}
              serverTime={serverTime}
              liveAuctionData={liveAuctionData}
              isLoadingLiveAuction={isLoadingLiveAuction}
            />

            <AuctionBoxes
              boxes={currentAuction.boxes}
              userBidsPerRound={currentAuction.userBidsPerRound}
              userQualificationPerRound={currentAuction.userQualificationPerRound}
              onBidSuccess={(roundNumber, bidAmount) => {
                setShowBidSuccess({ roundNumber, bidAmount });
                setCurrentAuction(prev => ({
                  ...prev,
                  userBidsPerRound: {
                    ...prev.userBidsPerRound,
                    [roundNumber]: bidAmount
                  },
                  boxes: prev.boxes.map(box => {
                    if (isRoundBox(box) && box.roundNumber === roundNumber) {
                      return {
                        ...box,
                        hasBid: true,
                        currentBid: bidAmount,
                        bidder: currentUser?.name || 'You'
                      };
                    }
                    return box;
                  })
                }));
              }}
              onBidFailure={(roundNumber, bidAmount, errorMessage) => {
                setShowBidFailure({ roundNumber, bidAmount, errorMessage });
              }}
              onViewLeaderboard={(roundNumber) => {
                setSelectedLeaderboard({ roundNumber });
                setCurrentPage('leaderboard');
              }}
              isLoggedIn={!!currentUser}
              currentUser={currentUser}
              serverTime={serverTime}
              liveAuctionData={liveAuctionData}
            />
          </main>

          <Footer onNavigate={handleNavigate} />

          {/* Payment Success Modal */}
          {showEntrySuccess && (
            <PaymentSuccess
              amount={showEntrySuccess.entryFee}
              type="entry"
              boxNumber={showEntrySuccess.boxNumber}
              onBackToHome={() => {
                handleEntrySuccess();
                setCurrentPage('game');
              }}
              onClose={() => setShowEntrySuccess(null)}
            />
          )}

          {/* Payment Failure Modal */}
          {showEntryFailure && (
            <PaymentFailure
              amount={showEntryFailure.entryFee}
              errorMessage={showEntryFailure.errorMessage}
              onRetry={handleRetryPayment}
              onBackToHome={() => {
                handleEntryFailure();
                setCurrentPage('game');
              }}
              onClose={() => setShowEntryFailure(null)}
            />
          )}

          {/* Bid Success Modal */}
          {showBidSuccess && (
            <PaymentSuccess
              amount={showBidSuccess.bidAmount}
              type="bid"
              roundNumber={showBidSuccess.roundNumber}
              onBackToHome={() => {
                handleBidSuccess();
                setCurrentPage('game');
              }}
              onClose={() => setShowBidSuccess(null)}
            />
          )}

          {/* Bid Failure Modal */}
          {showBidFailure && (
            <PaymentFailure
              amount={showBidFailure.bidAmount}
              errorMessage={showBidFailure.errorMessage}
              onRetry={handleRetryPayment}
              onBackToHome={() => {
                handleBidFailure();
                setCurrentPage('game');
              }}
              onClose={() => setShowBidFailure(null)}
            />
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}