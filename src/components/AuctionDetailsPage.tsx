import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, Clock, IndianRupee, Target, Award, Crown, Users, TrendingUp, Sparkles, Box, CheckCircle2, XCircle, Lock, Medal, TrendingDown, BarChart3, Zap, Loader2, AlertCircle, CheckCircle, Gift, Timer, HourglassIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';
import { toast } from 'sonner';
import { usePrizeClaimPayment } from '../hooks/usePrizeClaimPayment';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';

interface RoundDetails {
  roundNumber: number;
  status: string;
  totalParticipants: number;
  qualifiedCount: number;
  highestBid: number;
  lowestBid: number;
  userBid: number | null;
  userRank: number | null;
  userQualified: boolean;
  startedAt: string;
  completedAt: string;
}

interface AuctionDetailsData {
  id: number;
  date: Date;
  prize: string;
  prizeValue: number;
  status: 'won' | 'lost';
  totalParticipants: number;
  myRank: number;
  auctionStartTime: string;
  auctionEndTime: string;
  entryFeePaid?: number;
  totalAmountBid?: number;
  totalAmountSpent?: number;
  roundsParticipated?: number;
  totalBidsPlaced?: number;
  hourlyAuctionId?: string;
  isWinner?: boolean;
  finalRank?: number;
  prizeClaimStatus?: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'NOT_APPLICABLE';
  claimDeadline?: number; // ✅ STORE as UTC timestamp (milliseconds)
  claimedAt?: number; // ✅ STORE as UTC timestamp (milliseconds)
  lastRoundBidAmount?: number;
  prizeAmountWon?: number;
  winnersAnnounced?: boolean;
  claimedBy?: string;
  claimUpiId?: string;
  claimedByRank?: number;
  // NEW: Priority claim fields
  currentEligibleRank?: number; // Which rank (1, 2, or 3) can currently claim
  claimWindowStartedAt?: number; // ✅ STORE as UTC timestamp (milliseconds)
}

interface AuctionDetailsPageProps {
  auction: AuctionDetailsData;
  onBack: () => void;
}

export function AuctionDetailsPage({ auction: initialAuction, onBack }: AuctionDetailsPageProps) {
  const [auction, setAuction] = useState(initialAuction);
  const [isLoading, setIsLoading] = useState(true);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { initiatePrizeClaimPayment, loading: globalPaymentLoading } = usePrizeClaimPayment();
  
  // Get user info - state for dynamic updates
  const [userInfo, setUserInfo] = useState({
    userId: localStorage.getItem('user_id') || '',
    userName: localStorage.getItem('user_name') || 'User',
    userEmail: localStorage.getItem('user_email') || '',
    userMobile: localStorage.getItem('user_mobile') || '',
  });

  // ✅ Fetch user data from backend if mobile is missing
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userInfo.userMobile && userInfo.userId) {
        try {
          console.log('📱 Mobile number not found in localStorage, fetching from backend...');
          const response = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${userInfo.userId}`);
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const mobile = result.data.mobile || result.data.phone || result.data.contact || '';
              const name = result.data.name || userInfo.userName;
              const email = result.data.email || userInfo.userEmail;
              
              console.log('✅ User data fetched from backend:', { name, email, mobile });
              
              // Update state
              setUserInfo(prev => ({
                ...prev,
                userName: name,
                userEmail: email,
                userMobile: mobile,
              }));
              
              // Also update localStorage for future use
              if (mobile) localStorage.setItem('user_mobile', mobile);
              if (name) localStorage.setItem('user_name', name);
              if (email) localStorage.setItem('user_email', email);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [userInfo.userId]);

  // ✅ Fetch detailed data on mount
  useEffect(() => {
    fetchDetailedData(true); // Initial load with loading state
  }, []);

  // ✅ UPDATED: Poll for auction status updates - silent background refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDetailedData(false); // Background refresh without loading state
    }, 5000);

    return () => clearInterval(interval);
  }, [auction.hourlyAuctionId, userInfo.userId]);

  // ✅ UPDATED: Add isInitialLoad parameter to control loading state
  const fetchDetailedData = async (isInitialLoad = false) => {
    if (!auction.hourlyAuctionId || !userInfo.userId) {
      if (isInitialLoad) setIsLoading(false);
      return;
    }

    try {
      // ✅ Only show loading spinner on initial load
      if (isInitialLoad) {
        setIsLoading(true);
      }
      
      const queryString = buildQueryString({
        hourlyAuctionId: auction.hourlyAuctionId,
        userId: userInfo.userId
      });
      const response = await fetch(
        `${API_ENDPOINTS.scheduler.auctionDetails}${queryString}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch auction details');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setDetailedData(result.data);
        
        // ✅ Only log on initial load to reduce console spam
        if (isInitialLoad) {
          console.log('✅ Auction details loaded:', result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching detailed auction data:', error);
      // ✅ Only show error toast on initial load
      if (isInitialLoad) {
        toast.error('Could not load detailed auction information');
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  // ✅ NEW: Poll for auction status updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDetailedData(false);
    }, 5000); // ✅ CHANGED: Poll every 5 seconds for faster updates

    return () => clearInterval(interval);
  }, [auction.hourlyAuctionId, userInfo.userId]);

  // ✅ NEW: Check if prize has been claimed by checking hourly auction winners array
  const checkPrizeClaimedStatus = () => {
    if (!detailedData || !detailedData.hourlyAuction) return null;
    
    const hourlyAuction = detailedData.hourlyAuction;
    
    // Check if there are any winners who have claimed
    if (hourlyAuction.winners && hourlyAuction.winners.length > 0) {
      const claimedWinner = hourlyAuction.winners.find((w: any) => w.isPrizeClaimed);
      
      if (claimedWinner) {
        return {
          claimed: true,
          claimedByRank: claimedWinner.rank,
          claimedBy: claimedWinner.playerUsername,
          claimedAt: claimedWinner.prizeClaimedAt,
        };
      }
    }
    
    return null;
  };

  // ✅ NEW: Determine if current user is eligible to claim based on priority system
  const isCurrentlyEligibleToClaim = () => {
    if (!auction.isWinner || auction.prizeClaimStatus !== 'PENDING') return false;
    
    // ✅ NEW: Check if someone already claimed from overall auction status
    const claimStatus = checkPrizeClaimedStatus();
    if (claimStatus && claimStatus.claimed) {
      // If someone with better rank claimed, not user's turn
      if (auction.finalRank && claimStatus.claimedByRank < auction.finalRank) {
        return false;
      }
    }
    
    // ✅ ALSO check auction object for claim data (from user's participation record)
    if (auction.claimedByRank && auction.finalRank && auction.claimedByRank < auction.finalRank) {
      return false;
    }
    
    // ✅ STRICT MODE: Require currentEligibleRank to be set (no fallback for old data)
    if (!auction.currentEligibleRank || !auction.finalRank) return false;
    
    // Check if user's rank matches the currently eligible rank
    return auction.finalRank === auction.currentEligibleRank;
  };

  // ✅ NEW: Check if user is in waiting queue (winner but not their turn yet)
  const isInWaitingQueue = () => {
    if (!auction.isWinner || auction.prizeClaimStatus !== 'PENDING') return false;
    
    // ✅ NEW: Check if someone already claimed from overall auction status
    const claimStatus = checkPrizeClaimedStatus();
    if (claimStatus && claimStatus.claimed) {
      // If someone with better rank claimed, not in waiting queue anymore
      if (auction.finalRank && claimStatus.claimedByRank < auction.finalRank) {
        return false;
      }
    }
    
    // ✅ ALSO check auction object for claim data (from user's participation record)
    if (auction.claimedByRank && auction.finalRank && auction.claimedByRank < auction.finalRank) {
      return false;
    }
    
    // If no priority system, no queue
    if (!auction.currentEligibleRank || !auction.finalRank) return false;
    
    // In queue if user's rank is higher than current eligible rank
    return auction.finalRank > auction.currentEligibleRank;
  };

  // ✅ NEW: Get position in waiting queue
  const getQueuePosition = () => {
    if (!auction.finalRank || !auction.currentEligibleRank) return 0;
    return auction.finalRank - auction.currentEligibleRank;
  };
  
  // ✅ NEW: Check if prize was claimed by someone with better rank than current user
  const isPrizeClaimedByBetterRank = () => {
    if (!auction.isWinner) return false;
    
    // First check overall auction status
    const claimStatus = checkPrizeClaimedStatus();
    if (claimStatus && claimStatus.claimed && auction.finalRank) {
      if (claimStatus.claimedByRank < auction.finalRank) {
        return {
          claimed: true,
          ...claimStatus
        };
      }
    }
    
    // Also check user's participation record
    if (auction.claimedByRank && auction.finalRank) {
      if (auction.claimedByRank < auction.finalRank) {
        return {
          claimed: true,
          claimedByRank: auction.claimedByRank,
          claimedBy: auction.claimedBy,
          claimedAt: auction.claimedAt
        };
      }
    }
    
    return false;
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Countdown timer for prize claim
  useEffect(() => {
    if (!auction.isWinner || auction.prizeClaimStatus !== 'PENDING') return;

    const updateTimer = () => {
      // ✅ Current UTC time in milliseconds
      const now = Date.now();
      
      // ✅ NEW: If in waiting queue, show time until claim window opens
      if (isInWaitingQueue() && auction.claimWindowStartedAt) {
        // ✅ Already UTC timestamp (number), no conversion needed
        const windowStart = auction.claimWindowStartedAt;
        let diff = windowStart - now;
        
        // ✅ SUBTRACT 330 MINUTES (330 * 60 * 1000 milliseconds)
        diff = diff - (330 * 60 * 1000);
        
        if (diff > 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Opens in ${minutes}m ${seconds}s`);
          return;
        }
      }
      
      // ✅ Show time left until deadline when it's user's turn
      if (auction.claimDeadline) {
        // ✅ Already UTC timestamp (number), no conversion needed
        const deadline = auction.claimDeadline;
        let diff = deadline - now;

        // ✅ SUBTRACT 330 MINUTES (330 * 60 * 1000 milliseconds)
        diff = diff - (330 * 60 * 1000);

        if (diff <= 0) {
          setTimeLeft('EXPIRED');
          return;
        }

        // ✅ Calculate remaining time directly in minutes and seconds
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction.claimDeadline, auction.prizeClaimStatus, auction.claimWindowStartedAt, auction.finalRank, auction.currentEligibleRank]);

  const handleClaimPrize = async () => {
    if (timeLeft === 'EXPIRED') {
      toast.error('Claim window has expired');
      return;
    }

    if (!isCurrentlyEligibleToClaim()) {
      toast.error('It is not your turn to claim yet. Please wait for the previous winner.');
      return;
    }

    // ✅ CRITICAL: Validate all required data before proceeding
    if (!auction.hourlyAuctionId) {
      toast.error('Missing auction information. Please refresh and try again.');
      return;
    }

    if (!auction.lastRoundBidAmount || auction.lastRoundBidAmount <= 0) {
      toast.error('Invalid bid amount. Please contact support.');
      return;
    }

    if (!userInfo.userEmail) {
      toast.error('Email not found. Please update your profile.');
      return;
    }

    // ✅ NEW: Enhanced mobile number validation with retry
    if (!userInfo.userMobile) {
      toast.error('Mobile number not found. Attempting to fetch from server...');
      
      try {
        const response = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${userInfo.userId}`);
        if (response.ok) {
          const result = await response.json();
          const mobile = result.data?.mobile || result.data?.phone || result.data?.contact;
          
          if (mobile) {
            setUserInfo(prev => ({ ...prev, userMobile: mobile }));
            localStorage.setItem('user_mobile', mobile);
            toast.success('Mobile number retrieved successfully! Click "Pay Now" again.');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch mobile:', error);
      }
      
      toast.error('Mobile number not found. Please update your profile with a valid mobile number.');
      return;
    }

    setIsProcessing(true);

    try {
      initiatePrizeClaimPayment(
        {
          userId: userInfo.userId,
          hourlyAuctionId: auction.hourlyAuctionId,
          amount: auction.lastRoundBidAmount,
          currency: 'INR',
          username: userInfo.userName,
        },
        {
          name: userInfo.userName,
          email: userInfo.userEmail,
          contact: userInfo.userMobile,
          upiId: userInfo.userEmail,
        },
        async (response) => {
          console.log('Prize claim payment successful:', response);
          
          // ✅ FIXED: No need to call updatePrizeClaim - verification endpoint already handles this
          // The response from verification already contains all claim data
          console.log('✅ Prize claim data received from verification:', response.data);
          
          // ✅ Update local state immediately - no page reload
          setAuction(prev => ({
            ...prev,
            prizeClaimStatus: 'CLAIMED',
            claimedAt: Date.now(),
            claimedBy: userInfo.userName,
            claimUpiId: userInfo.userEmail,
            claimedByRank: auction.finalRank
          }));
          
          toast.success('🎉 Prize Claimed Successfully!', {
            description: `Amazon voucher details will be sent to ${userInfo.userEmail}`,
            duration: 5000,
          });
          
          setShowClaimForm(false);
          setIsProcessing(false);
          
          // ✅ Refresh auction details data in background without reload
          setTimeout(() => {
            fetchDetailedData();
          }, 1000);
        },
        (error) => {
          console.error('Prize claim payment failed:', error);
          toast.error('Payment Failed', {
            description: error || 'Failed to process prize claim payment',
          });
          setIsProcessing(false);
        }
      );
    } catch (error) {
      console.error('Error initiating prize claim payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    }
  };

  // Calculate net profit properly (only final round bid amount matters)
  const calculateNetProfit = () => {
    if (!auction.isWinner || !auction.lastRoundBidAmount || !auction.prizeValue) {
      return 0;
    }
    // Net profit = Prize Value - Final Round Bid Amount
    return auction.prizeValue - auction.lastRoundBidAmount;
  };

  const netProfit = calculateNetProfit();

  // Get rank display
  const getRankSuffix = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏆';
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Premium Header */}
      <motion.div 
        className="relative z-10 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: 'radial-gradient(circle, #C4B5FD, #8B5CF6)',
              top: '-40%',
              right: '-10%',
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-violet-700 text-white shadow-2xl">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 sm:gap-2 text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all mb-3 sm:mb-4 border border-white/20 text-xs sm:text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Back to History</span>
            </button>
            
            <div className="flex items-start gap-3 sm:gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl border-2 sm:border-3 border-white/40 ${
                  auction.status === 'won'
                    ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700'
                    : 'bg-gradient-to-br from-purple-500 to-purple-700'
                }`}
              >
                {auction.status === 'won' ? (
                  <Crown className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                ) : (
                  <Trophy className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                )}
              </motion.div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{auction.prize}</h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-white/90 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{auction.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <span className="text-white/60">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{auction.auctionStartTime}</span>
                  </div>
                  {auction.auctionEndTime && (
                    <>
                      <span className="text-white/60">→</span>
                      <span>{auction.auctionEndTime}</span>
                    </>
                  )}
                  <span className="text-white/60">•</span>
                  <Badge className={`border backdrop-blur-sm text-[10px] sm:text-xs ${
                    auction.status === 'won' 
                      ? 'bg-gradient-to-r from-violet-100/90 to-fuchsia-100/90 text-violet-900 border-violet-300/60' 
                      : 'bg-purple-100/80 text-purple-700 border-purple-300/50'
                  }`}>
                    {auction.status === 'won' ? (
                      <><Trophy className="w-3 h-3 mr-1" /> Won</>
                    ) : (
                      <><Target className="w-3 h-3 mr-1" /> Lost</>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 w-fit">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
                  <span className="text-xs sm:text-sm">Prize Value:</span>
                  <div className="flex items-center gap-0.5 font-bold">
                    <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-sm sm:text-base">{auction.prizeValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 relative z-10">
        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-purple-700 font-semibold">Loading detailed auction information...</p>
            </div>
          </motion.div>
        )}

        {!isLoading && (
          <>
            {/* ✅ Winners Announced Banner */}
            {auction.winnersAnnounced && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-green-300/70 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-green-900 flex items-center gap-2">
                          🏆 Winners Announced
                        </h2>
                        <p className="text-sm text-green-700">Auction completed early with ≤3 qualified players</p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            Early Completion Triggered
                          </p>
                          <p className="text-xs text-green-700">
                            The auction ended early because there were 3 or fewer qualified players. Winners have been announced and can now claim their prizes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ✅ NEW: Waiting Queue Banner - Show if user is winner but not their turn yet */}
            {isInWaitingQueue() && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-blue-300/70 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <HourglassIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-blue-900 flex items-center gap-2">
                          {getRankEmoji(auction.finalRank || 1)} You're in the Waiting Queue
                        </h2>
                        <p className="text-sm text-blue-700">Rank {getRankSuffix(auction.finalRank || 1)} - Your turn will come if previous winners don't claim</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-start gap-2 mb-3">
                          <Timer className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              Priority Claim System Active
                            </p>
                            <p className="text-xs text-blue-700 mb-2">
                              Currently: <span className="font-bold">{getRankSuffix(auction.currentEligibleRank || 1)} place winner</span> has 30 minutes to claim the prize.
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                          <p className="text-xs text-blue-800 font-medium mb-1">⏰ How it works:</p>
                          <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                            <li>Each winner gets 30 minutes to claim</li>
                            <li>If they don't claim, next winner gets their turn</li>
                            <li>You're #{getQueuePosition()} in the waiting queue</li>
                            <li>You'll be notified when it's your turn</li>
                          </ul>
                        </div>
                      </div>

                      {timeLeft && timeLeft !== 'EXPIRED' && (
                        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg p-3 border border-blue-300">
                          <Clock className="w-5 h-5 text-blue-700" />
                          <div className="text-center">
                            <p className="text-xs text-blue-600 font-medium">Time left for {getRankSuffix(auction.currentEligibleRank || 1)} winner</p>
                            <p className="text-lg font-bold text-blue-900">{timeLeft}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Winner Prize Claim Section - Only show if currently eligible */}
            {auction.isWinner && auction.prizeClaimStatus === 'PENDING' && isCurrentlyEligibleToClaim() && auction.lastRoundBidAmount && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="border-2 border-amber-300/70 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        animate={{ 
                          rotate: [0, -10, 10, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-amber-900">
                          {getRankEmoji(auction.finalRank || 1)} Your Turn to Claim! Rank {getRankSuffix(auction.finalRank || 1)}
                        </h2>
                        <p className="text-sm text-amber-700">Claim your prize by paying your final round bid amount</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-900">Final Round Bid Amount</p>
                            <p className="text-[10px] text-amber-700">Pay this to claim your prize</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="w-5 h-5 text-amber-900 font-bold" />
                          <span className="text-xl font-bold text-amber-900">
                            {auction.lastRoundBidAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg p-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className={`font-bold text-sm ${timeLeft === 'EXPIRED' ? 'text-red-600' : 'text-purple-900'}`}>
                          Time Left to Claim: {timeLeft}
                        </span>
                      </div>

                      {!showClaimForm ? (
                        <Button
                          onClick={() => setShowClaimForm(true)}
                          disabled={timeLeft === 'EXPIRED' || globalPaymentLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          {globalPaymentLoading ? 'Processing...' : `Pay ₹${auction.lastRoundBidAmount.toLocaleString('en-IN')} & Claim Prize`}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                            <Label className="text-purple-900 font-semibold text-sm flex items-center gap-2 mb-2">
                              <Gift className="w-4 h-4" />
                              Prize Delivery Email
                            </Label>
                            <Input
                              type="email"
                              value={userInfo.userEmail}
                              disabled
                              className="bg-white/70 border-purple-300 text-purple-900 font-medium cursor-not-allowed"
                            />
                            <p className="text-xs text-purple-700 mt-2 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>Amazon voucher worth ₹{auction.prizeValue.toLocaleString('en-IN')} will be sent to this email after payment</span>
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowClaimForm(false);
                              }}
                              variant="outline"
                              className="flex-1"
                              disabled={globalPaymentLoading || isProcessing}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleClaimPrize}
                              disabled={globalPaymentLoading || timeLeft === 'EXPIRED' || isProcessing}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <IndianRupee className="w-4 h-4 mr-1" />
                                  Pay ₹{auction.lastRoundBidAmount.toLocaleString('en-IN')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ✅ NEW: Green Banner - Prize Claimed (Check claimedBy and claimedByRank) */}
            {auction.claimedBy && auction.claimedByRank && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-green-300/70 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-green-900 flex items-center gap-2">
                          {getRankEmoji(auction.claimedByRank)} Prize Claimed by {getRankSuffix(auction.claimedByRank)} Winner
                        </h2>
                        <p className="text-sm text-green-700">
                          {auction.claimUpiId === userInfo.userEmail 
                            ? `Congratulations! You claimed this prize`
                            : `This prize has been claimed`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            {auction.claimUpiId === userInfo.userEmail 
                              ? 'Prize Claimed Successfully!'
                              : 'Winner Details'
                            }
                          </p>
                          <p className="text-xs text-green-700 mb-2">
                            {auction.claimUpiId === userInfo.userEmail 
                              ? `Amazon voucher worth ₹${auction.prizeValue.toLocaleString('en-IN')} has been sent to ${userInfo.userEmail}`
                              : `Claimed by ${auction.claimedBy}`
                            }
                          </p>
                          {auction.claimedAt && (
  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded px-2 py-1 w-fit">
    <Clock className="w-3 h-3" />
    <span>
      {(() => {
        const date = new Date(auction.claimedAt);
        const correctedDate = new Date(date.getTime() - 5.5 * 60 * 60 * 1000);

        return `Claimed on ${correctedDate.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}`;
      })()}
    </span>
  </div>
)}

                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Claimed Status - Only show if claimedBy is NOT set (to avoid duplicate) */}
            {auction.prizeClaimStatus === 'CLAIMED' && auction.claimUpiId === userInfo.userEmail && !auction.claimedBy && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-green-300/70 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-green-900 flex items-center gap-2">
                          {getRankEmoji(auction.finalRank || 1)} Prize Claimed Successfully!
                        </h2>
                        <p className="text-sm text-green-700">Congratulations on your win, Rank {getRankSuffix(auction.finalRank || 1)}</p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            Amazon Voucher Delivered
                          </p>
                          <p className="text-xs text-green-700 mb-2">
                            Your prize worth ₹{auction.prizeValue.toLocaleString('en-IN')} has been sent to <span className="font-semibold">{userInfo.userEmail}</span>
                          </p>
                          {auction.claimedAt && (
  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded px-2 py-1 w-fit">
    <Clock className="w-3 h-3" />
    <span>
      {(() => {
        const date = new Date(auction.claimedAt);
        const corrected = new Date(date.getTime() - 5.5 * 60 * 60 * 1000);

        return `Claimed on ${corrected.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;
      })()}
    </span>
  </div>
)}

                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Prize claimed by another winner - Only show if claimedBy is NOT set */}
            {auction.prizeClaimStatus === 'CLAIMED' && auction.claimUpiId && auction.claimUpiId !== userInfo.userEmail && !auction.claimedBy && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-green-300/70 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-green-900 flex items-center gap-2">
                          {getRankEmoji(auction.claimedByRank || 1)} Prize Claimed by {getRankSuffix(auction.claimedByRank || 1)} Winner
                        </h2>
                        <p className="text-sm text-green-700">This prize has been claimed</p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            Winner Details
                          </p>
                          <p className="text-xs text-green-700 mb-1">
                            Claimed by {auction.claimedBy || 'Winner'}
                          </p>
                          {auction.claimedAt && (
  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded px-2 py-1 w-fit">
    <Clock className="w-3 h-3" />
    <span>
      {(() => {
        const original = new Date(auction.claimedAt);
        const adjusted = new Date(original.getTime() - 5.5 * 60 * 60 * 1000);

        return `Claimed on ${adjusted.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;
      })()}
    </span>
  </div>
)}

                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Prize claimed but no email info - Generic claimed banner - Only show if claimedBy is NOT set */}
            {auction.prizeClaimStatus === 'CLAIMED' && !auction.claimUpiId && !auction.claimedBy && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-green-300/70 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 backdrop-blur-xl shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-green-900 flex items-center gap-2">
                          🎉 Prize Claimed Successfully!
                        </h2>
                        <p className="text-sm text-green-700">This auction prize has been claimed</p>
                      </div>
                    </div>

                    <div className="bg-white/60 rounded-lg p-3 border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 mb-1">
                            Prize Successfully Claimed
                          </p>
                          <p className="text-xs text-green-700 mb-2">
                            Amazon voucher worth ₹{auction.prizeValue.toLocaleString('en-IN')} has been delivered
                          </p>
                          {auction.claimedAt && (
  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded px-2 py-1 w-fit">
    <Clock className="w-3 h-3" />
    <span>
      Claimed on {(() => {
        const d = new Date(auction.claimedAt);
        const adjusted = new Date(d.getTime() - 5.5 * 60 * 60 * 1000);

        return adjusted.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      })()}
    </span>
  </div>
)}

                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Expired Status - no one claimed */}
            {auction.prizeClaimStatus === 'EXPIRED' && !auction.claimedBy && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-red-300/70 bg-gradient-to-r from-red-50 to-rose-50 backdrop-blur-xl shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                          {getRankEmoji(auction.finalRank || 1)} Your Claim Window Expired
                        </p>
                        <p className="text-xs text-red-700">
                          30-minute deadline passed. Prize may have been offered to the next winner in queue.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Round-by-Round Breakdown */}
            {detailedData && detailedData.rounds && detailedData.rounds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-4 sm:mb-6"
              >
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                    <Box className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-purple-900 text-base sm:text-lg">Round-by-Round Breakdown</h2>
                    <p className="text-[10px] sm:text-xs text-purple-600">Detailed performance for each round</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {detailedData.rounds.map((round: RoundDetails, index: number) => (
                    <motion.div
                      key={round.roundNumber}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    >
                      <Card className={`relative overflow-hidden border-2 backdrop-blur-2xl shadow-xl ${
                        round.userBid 
                          ? round.userQualified
                            ? 'border-green-300/70 bg-gradient-to-br from-green-50/95 via-emerald-50/80 to-green-50/70'
                            : 'border-purple-300/60 bg-gradient-to-br from-white/90 via-purple-50/70 to-violet-50/60'
                          : 'border-gray-300/60 bg-gradient-to-br from-white/90 to-gray-50/70'
                      }`}>
                        <CardContent className="p-3 sm:p-5 relative z-10">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/60 ${
                                round.userBid
                                  ? round.userQualified
                                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                    : 'bg-gradient-to-br from-purple-500 to-purple-700'
                                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
                              }`}>
                                {round.userBid ? (
                                  round.userQualified ? (
                                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                  ) : (
                                    <Target className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                  )
                                ) : (
                                  <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                )}
                              </div>
                              
                              <div>
                                <h3 className="font-bold text-purple-900 text-sm sm:text-base mb-1">Round {round.roundNumber}</h3>
                                <Badge variant="outline" className="text-[10px] sm:text-xs bg-purple-100/80 text-purple-700 border-purple-300">
                                  {round.status}
                                </Badge>
                              </div>
                            </div>

                            {round.userQualified && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Qualified
                              </Badge>
                            )}
                          </div>

                          {round.userBid ? (
                            <>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
                                <Card className="border-2 border-purple-200/60 bg-white/70 backdrop-blur-xl">
                                  <CardContent className="p-2 sm:p-3">
                                    <div className="flex items-center gap-1 text-[10px] text-purple-600 mb-1">
                                      <Users className="w-3 h-3" />
                                      <span>Participants</span>
                                    </div>
                                    <div className="font-bold text-purple-900 text-sm">{round.totalParticipants}</div>
                                  </CardContent>
                                </Card>

                                <Card className="border-2 border-green-200/60 bg-white/70 backdrop-blur-xl">
                                  <CardContent className="p-2 sm:p-3">
                                    <div className="flex items-center gap-1 text-[10px] text-green-600 mb-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Qualified</span>
                                    </div>
                                    <div className="font-bold text-green-900 text-sm">{round.qualifiedCount}</div>
                                  </CardContent>
                                </Card>

                                <Card className="border-2 border-blue-200/60 bg-white/70 backdrop-blur-xl">
                                  <CardContent className="p-2 sm:p-3">
                                    <div className="flex items-center gap-1 text-[10px] text-blue-600 mb-1">
                                      <TrendingUp className="w-3 h-3" />
                                      <span>My Bid</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 font-bold text-blue-900">
                                      <IndianRupee className="w-3 h-3" />
                                      <span className="text-sm">{round.userBid?.toLocaleString('en-IN')}</span>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="border-2 border-violet-200/60 bg-white/70 backdrop-blur-xl">
                                  <CardContent className="p-2 sm:p-3">
                                    <div className="flex items-center gap-1 text-[10px] text-violet-600 mb-1">
                                      <Award className="w-3 h-3" />
                                      <span>My Rank</span>
                                    </div>
                                    <div className="font-bold text-violet-900 text-sm">#{round.userRank || 'N/A'}</div>
                                  </CardContent>
                                </Card>
                              </div>

                              <Card className="border-2 border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-violet-50/60 backdrop-blur-xl">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-purple-900 text-xs sm:text-sm">Bid Range</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/80 rounded-lg p-2 border border-green-200/50">
                                      <div className="flex items-center gap-1 mb-1">
                                        <TrendingDown className="w-3 h-3 text-green-600" />
                                        <span className="text-[10px] text-purple-600 font-medium">Lowest</span>
                                      </div>
                                      <div className="flex items-center gap-0.5 font-bold text-purple-900">
                                        <IndianRupee className="w-3 h-3" />
                                        <span className="text-sm">{round.lowestBid.toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>

                                    <div className="bg-white/80 rounded-lg p-2 border border-red-200/50">
                                      <div className="flex items-center gap-1 mb-1">
                                        <TrendingUp className="w-3 h-3 text-red-600" />
                                        <span className="text-[10px] text-purple-600 font-medium">Highest</span>
                                      </div>
                                      <div className="flex items-center gap-0.5 font-bold text-purple-900">
                                        <IndianRupee className="w-3 h-3" />
                                        <span className="text-sm">{round.highestBid.toLocaleString('en-IN')}</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </>
                          ) : (
                            <Card className="border-2 border-gray-200/60 bg-gray-50/50">
                              <CardContent className="p-4 text-center">
                                <Lock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm font-medium text-gray-600">You did not participate in this round</p>
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Net Profit Card for Winners */}
            {auction.isWinner && auction.lastRoundBidAmount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="border-2 border-violet-300/70 backdrop-blur-xl bg-gradient-to-br from-violet-100/90 via-fuchsia-100/80 to-purple-100/70 shadow-2xl">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        animate={{ 
                          rotate: [0, -10, 10, -10, 0],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </motion.div>
                      
                      <div className="flex-1">
                        <h3 className="font-bold text-violet-900 text-lg sm:text-xl">🎉 Your Net Profit</h3>
                        <p className="text-sm text-violet-700">Prize Value - Final Round Bid</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-violet-300/50 shadow-md">
                        <span className="text-xs text-violet-700 font-medium">Prize Value</span>
                        <div className="flex items-center gap-0.5 font-bold text-violet-900">
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-lg">{auction.prizeValue.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-300/50 shadow-md">
                        <span className="text-xs text-purple-700 font-medium">Final Round Bid</span>
                        <div className="flex items-center gap-0.5 font-bold text-purple-900">
                          <span className="text-lg">-</span>
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-lg">{auction.lastRoundBidAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-3 shadow-lg">
                        <span className="text-xs font-medium">Net Profit</span>
                        <div className="flex items-center gap-0.5 font-bold">
                          <span className="text-lg">=</span>
                          <IndianRupee className="w-4 h-4" />
                          <span className="text-lg">{netProfit.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg p-3">
                      <p className="text-xs text-violet-700 text-center">
                        💡 <strong>Note:</strong> Net profit is calculated only from your final round bid amount, not the total spent across all rounds.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}