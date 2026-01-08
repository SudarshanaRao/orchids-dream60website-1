import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, TrendingUp, Award, Clock, Target, Sparkles, Crown, IndianRupee, Users, TrendingDown, Gift, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { usePrizeClaimPayment } from '../hooks/usePrizeClaimPayment';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';
import { LoadingProfile } from './LoadingProfile';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentFailure } from './PaymentFailure';

  interface AuctionHistoryProps {
    user: {
      id: string;
      username: string;
    };
    onBack: () => void;
    onViewDetails: (auction: AuctionHistoryItem) => void;
    serverTime: any;
  }


// Box slot interface with detailed information
interface BoxSlot {
  boxNumber: number;
  type: 'entry' | 'bidding';
  status: 'won' | 'lost' | 'not_participated';
  entryFee?: number;
  myBid?: number;
  winningBid?: number;
  winnerName?: string;
  myRank?: number;
  totalParticipants: number;
  minBid: number;
  maxBid: number;
  openTime: string;
  closeTime: string;
  isLocked: boolean;
}

// Extended auction interface with box details
interface AuctionHistoryItem {
  id: number;
  date: Date;
  prize: string;
  prizeValue: number;
  myBid: number;
  winningBid: number;
  status: 'won' | 'lost';
  totalParticipants: number;
  myRank: number;
  auctionStartTime: string;
  auctionEndTime: string;
  boxes: BoxSlot[];
  // Additional participation details
  entryFeePaid?: number;
  totalAmountBid?: number;
  totalAmountSpent?: number;
  roundsParticipated?: number;
  totalBidsPlaced?: number;
    // Prize claim fields (for all winners)
    isWinner?: boolean;
    finalRank?: number;
    prizeClaimStatus?: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'NOT_APPLICABLE';
    claimDeadline?: number; // ✅ CHANGED: Store as UTC timestamp (milliseconds)
    claimedAt?: number; // ✅ CHANGED: Store as UTC timestamp (milliseconds)
    claimUpiId?: string;
    remainingProductFees?: number;
    remainingFeesPaid?: boolean;
    hourlyAuctionId?: string;
    lastRoundBidAmount?: number;
    prizeAmountWon?: number;
    // Claimant information (who actually claimed the prize)
    claimedBy?: string;
    claimedByRank?: number;
    claimNotes?: string;
    // ✅ NEW: Priority claim system fields
    claimWindowStartedAt?: number; // ✅ CHANGED: Store as UTC timestamp (milliseconds)
    currentEligibleRank?: number; // Which rank can currently claim
    winnersAnnouncedAt?: number; // When winners were declared (UTC ms)
  }

// Circular Progress Component
const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, id = "win-rate-gradient" }: { percentage: number, size?: number, strokeWidth?: number, id?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90 overflow-visible">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-purple-200/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
        </defs>
      </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">{percentage}%</span>
          <span className="text-[10px] sm:text-xs text-purple-600 font-semibold uppercase tracking-wider">Success</span>
        </div>
    </div>
  );
};

// Separate AuctionCard Component (fixes hooks error)
  const AuctionCard = ({ 
    auction, 
    index, 
    tabPrefix, 
    user, 
    onViewDetails,
    onClaimSuccess,
    userProfile,
    serverTime
  }: { 
    auction: AuctionHistoryItem; 
    index: number; 
    tabPrefix: string;
    user: { id: string; username: string };
    onViewDetails: (auction: AuctionHistoryItem) => void;
    onClaimSuccess: () => void;
    userProfile: { mobile: string; email: string; username: string } | null;
    serverTime: any;
  }) => {
    const { initiatePrizeClaimPayment, loading: globalPaymentLoading } = usePrizeClaimPayment();
    const [timeLeft, setTimeLeft] = useState('');
    const [showClaimForm, setShowClaimForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [localAuction, setLocalAuction] = useState(auction);
    
    // NEW: Modal states for prize claim
    const [showSuccessModal, setShowSuccessModal] = useState<any | null>(null);
    const [showFailureModal, setShowFailureModal] = useState<any | null>(null);

  
  // ✅ REMOVED: Individual fetch logic - now using prop
  
  // Get user info from localStorage as fallback
  const userId = localStorage.getItem('user_id');
  const userEmail = userProfile?.email || localStorage.getItem('user_email') || localStorage.getItem('email') || '';

  // Update local auction when prop changes
  useEffect(() => {
    setLocalAuction(auction);
  }, [auction]);

  // ✅ REMOVED: useEffect for fetching user profile - no longer needed

  // Check if user didn't pay entry fee
  const didNotPayEntry = localAuction.boxes.slice(0, 2).some(box => box.status === 'not_participated');
  
  // Reset form and processing state when claim status changes
  useEffect(() => {
    if (localAuction.prizeClaimStatus !== 'PENDING') {
      setShowClaimForm(false);
      setIsProcessing(false);
    }
  }, [localAuction.prizeClaimStatus]);

  // ✅ NEW: Check if user is in waiting queue (winner but not their turn yet)
  const isInWaitingQueue = () => {
    if (!localAuction.isWinner || localAuction.prizeClaimStatus !== 'PENDING') return false;
    
    // ✅ NEW: If someone with better rank already claimed, not in waiting queue anymore
    if (localAuction.claimedByRank && localAuction.finalRank && localAuction.claimedByRank < localAuction.finalRank) {
      return false; // Prize already claimed by someone with better rank
    }
    
    // ✅ CRITICAL: Must have currentEligibleRank to determine waiting queue
    if (!localAuction.currentEligibleRank || !localAuction.finalRank) {
      return false; // If no currentEligibleRank, can't determine waiting status
    }
    
    // User is in waiting queue if their rank is higher than current eligible rank
    return localAuction.finalRank > localAuction.currentEligibleRank;
  };

  // ✅ NEW: Check if it's currently user's turn to claim
  const isCurrentlyMyTurn = () => {
    if (!localAuction.isWinner || localAuction.prizeClaimStatus !== 'PENDING') return false;
    
    // ✅ NEW: If someone with better rank already claimed, not user's turn anymore
    if (localAuction.claimedByRank && localAuction.finalRank && localAuction.claimedByRank < localAuction.finalRank) {
      return false; // Prize already claimed by someone with better rank
    }
    
    // ✅ CRITICAL: Must have currentEligibleRank to determine turn
    if (!localAuction.currentEligibleRank || !localAuction.finalRank) {
      return false; // If no currentEligibleRank, assume not user's turn
    }
    
    // User can claim only if their rank equals current eligible rank
    const isMyRankEligible = localAuction.finalRank === localAuction.currentEligibleRank;
    
    // Also check deadline hasn't passed
    const now = Date.now();
    const beforeDeadline = !localAuction.claimDeadline || now < localAuction.claimDeadline;
    
    // ✅ CRITICAL FIX: Check if we're still in the backend delay period (1 min)
    // If claim window just started (within 1 min), don't show claim form yet
    if (isMyRankEligible && localAuction.claimWindowStartedAt) {
      const windowStart = localAuction.claimWindowStartedAt;
      let diff = windowStart - now;
      diff = diff - (330 * 60 * 1000);
      
      // If within 1 minute of window start time (backend delay), return false
      if (diff <= 0 && diff > -(60 * 1000)) {
        return false; // Still in "Claim Window Soon" period
      }
    }
    
    return isMyRankEligible && beforeDeadline;
  };

  // ✅ NEW: Check if prize was claimed by someone with better rank than current user
  const isPrizeClaimedByBetterRank = () => {
    if (!localAuction.isWinner) return false;
    
    // Check if someone claimed and their rank is better (lower number) than mine
    if (localAuction.claimedByRank && localAuction.finalRank) {
      return localAuction.claimedByRank < localAuction.finalRank;
    }
    
    return false;
  };

  // ✅ NEW: Check if we're in the "Claim Window Soon" period (1 min backend delay)
  const isInClaimWindowSoonPeriod = () => {
    if (!localAuction.isWinner || localAuction.prizeClaimStatus !== 'PENDING') return false;
    if (!localAuction.claimWindowStartedAt || !localAuction.finalRank || !localAuction.currentEligibleRank) return false;
    
    // Only show for the user whose turn it's supposed to be
    if (localAuction.finalRank !== localAuction.currentEligibleRank) return false;
    
    const now = Date.now();
    const windowStart = localAuction.claimWindowStartedAt;
    let diff = windowStart - now;
    diff = diff - (330 * 60 * 1000);
    
    // If within 1 minute of window start time (backend delay period)
    return diff <= 0 && diff > -(60 * 1000);
  };

  // Get rank suffix and emoji
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

    // Countdown timer for this auction
    useEffect(() => {
      if (!localAuction.isWinner || localAuction.prizeClaimStatus !== 'PENDING') return;

      const updateTimer = () => {
        // ✅ Use server time from prop if available, otherwise fallback to local time
        // Match AuctionDetails page logic exactly
        const now = (serverTime as any)?.timestamp || Date.now();

        // ✅ FIXED: Calculate claim windows based on winnersAnnouncedAt and rank
        // Each winner gets exactly 15 minutes
        // 1st winner: starts immediately after winners announced
        // 2nd winner: starts 15 mins after winners announced  
        // 3rd winner: starts 30 mins after winners announced
        const getActiveWindow = () => {
          const activeRank = localAuction.currentEligibleRank || 1;
          const userRank = localAuction.finalRank || 1;
          
          // Use winnersAnnouncedAt as base time (must exist for claim system to work)
          const winnersAnnouncedTime = localAuction.winnersAnnouncedAt;
          if (!winnersAnnouncedTime) return null;
          
          // Calculate when current active rank's window started
          const activeWindowStart = winnersAnnouncedTime + ((activeRank - 1) * 15 * 60 * 1000);
          const activeWindowEnd = activeWindowStart + (15 * 60 * 1000); // Each window is 15 mins
          
          // Calculate user's own window
          const userWindowStart = winnersAnnouncedTime + ((userRank - 1) * 15 * 60 * 1000);
          const userWindowEnd = userWindowStart + (15 * 60 * 1000);

          return {
            start: activeWindowStart,
            end: activeWindowEnd,
            userStart: userWindowStart,
            userEnd: userWindowEnd,
          };
        };

        const activeWindow = getActiveWindow();

        // ✅ If in waiting queue, show time remaining until user's claim window starts
        if (isInWaitingQueue() && activeWindow) {
          // Show time until user's window starts (not current active window end)
          let diff = activeWindow.userStart - now;

          if (diff > 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}m ${seconds}s`);
            return;
          }

          setTimeLeft('Claim Window Soon');
          return;
        }

        // ✅ Check if in "Claim Window Soon" period (backend delay)
        if (localAuction.finalRank && localAuction.currentEligibleRank && activeWindow) {
          // If it should be user's turn but within 1 min of window start
          if (localAuction.finalRank === localAuction.currentEligibleRank) {
            let diff = activeWindow.start - now;
            if (diff <= 0 && diff > -(60 * 1000)) {
              setTimeLeft('Claim Window Soon');
              return;
            }
          }
        }

        // ✅ Show time left in user's claim window (when it's their turn)
        if (activeWindow && localAuction.finalRank === localAuction.currentEligibleRank) {
          // Use user's window end as deadline (15 min window)
          const deadline = activeWindow.userEnd;
          let diff = deadline - now;

          if (diff <= 0) {
            setTimeLeft('EXPIRED');
            return;
          }

          // Cap at 15 minutes max
          const maxClaimTime = 15 * 60 * 1000;
          if (diff > maxClaimTime) {
            diff = maxClaimTime;
          }

          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }, [localAuction.claimDeadline, localAuction.prizeClaimStatus, localAuction.claimWindowStartedAt, localAuction.finalRank, localAuction.currentEligibleRank, localAuction.winnersAnnouncedAt, serverTime]);


  const handleClaimPrize = async () => {
    if (timeLeft === 'EXPIRED') {
      toast.error('Claim window has expired');
      return;
    }

    // ✅ CRITICAL: Validate all required data before proceeding
    if (!localAuction.hourlyAuctionId) {
      toast.error('Missing auction information. Please refresh and try again.');
      return;
    }

    if (!localAuction.lastRoundBidAmount || localAuction.lastRoundBidAmount <= 0) {
      toast.error('Invalid bid amount. Please contact support.');
      return;
    }

    // ✅ FIXED: Get mobile number from fetched profile or localStorage (OPTIONAL - not required)
    let userMobile = userProfile?.mobile || localStorage.getItem('user_mobile') || '';
    const currentUserEmail = userProfile?.email || userEmail;
    const currentUserName = userProfile?.username || localStorage.getItem('user_name') || user.username;
    
    // ✅ FIXED: Mobile is now optional - only validate email
    if (!currentUserEmail) {
      toast.error('Email not found. Please update your profile.');
      return;
    }
    
    // ✅ NEW: If no mobile, try to fetch from API but don't block payment
    if (!userMobile) {
      try {
        const response = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${userId}`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.profile && result.profile.mobile) {
            userMobile = result.profile.mobile;
            
            // Update state and localStorage for future use
            setUserProfile({
              mobile: result.profile.mobile,
              email: result.profile.email || currentUserEmail,
              username: result.profile.username || currentUserName,
            });
            localStorage.setItem('user_mobile', result.profile.mobile);
          }
        }
      } catch (error) {
        // Silently handle error - mobile is optional
      }
      
      // ✅ Use placeholder if mobile still not available
      if (!userMobile) {
        userMobile = '9999999999'; // Placeholder for payment gateway
      }
    }

    setIsProcessing(true);

    try {
      initiatePrizeClaimPayment(
        {
          userId: user.id,
          hourlyAuctionId: localAuction.hourlyAuctionId,
          amount: localAuction.lastRoundBidAmount,
          currency: 'INR',
          username: currentUserName,
        },
        {
          name: currentUserName,
          email: currentUserEmail,
          contact: userMobile, // ✅ Use fetched or placeholder mobile number
          upiId: currentUserEmail,
        },
          async (response) => {
            console.log('Prize claim payment successful:', response);
            
            // ✅ Show Success Modal
            setShowSuccessModal({
              amount: localAuction.lastRoundBidAmount,
              type: 'claim',
              productName: localAuction.prize,
              productWorth: localAuction.prizeValue,
              auctionId: localAuction.hourlyAuctionId,
              paidBy: currentUserName,
              paymentMethod: response.data?.upiId ? `UPI (${response.data.upiId})` : 'UPI / Card'
            });

            // ✅ Update local state immediately - no page reload
            setLocalAuction(prev => ({
              ...prev,
              prizeClaimStatus: 'CLAIMED',
              claimedAt: Date.now(),
              claimedBy: currentUserName,
              claimUpiId: currentUserEmail,
              claimedByRank: prev.finalRank
            }));
            
              toast.success('🎉 Prize Claimed Successfully!', {
                description: `Amazon voucher details will be sent to ${currentUserEmail}`,
                duration: 3000,
              });
            
            setShowClaimForm(false);
            setIsProcessing(false);
            
            // ✅ Refetch history data in background without reload
            setTimeout(() => {
              onClaimSuccess();
            }, 1000);
          },
          (error) => {
            console.error('Prize claim payment failed:', error);
            
            setShowFailureModal({
              amount: localAuction.lastRoundBidAmount,
              type: 'claim',
              errorMessage: error || 'Failed to process prize claim payment',
              productName: localAuction.prize,
              auctionId: localAuction.hourlyAuctionId,
              paidBy: currentUserName
            });

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

  return (
    <motion.div
      key={`${tabPrefix}-${localAuction.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="cursor-pointer"
    >
        <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-xl bg-white/70 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-purple-300/80">
                
        {/* Subtle Background Gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div
            className="absolute w-32 h-32 rounded-full blur-3xl"
            style={{
              background: localAuction.status === 'won' 
                ? 'radial-gradient(circle, #A78BFA, #7C3AED)' 
                : 'radial-gradient(circle, #DDD6FE, #C4B5FD)',
              top: '-20%',
              right: '-10%',
            }}
          />
        </div>

        <CardContent className="p-2.5 sm:p-6 relative z-10">
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-2" onClick={() => onViewDetails(localAuction)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div
                    className={`w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg border border-white/60 sm:border-2 ${
                      localAuction.status === 'won'
                        ? 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700'
                        : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                    }`}
                  >
                    {localAuction.status === 'won' ? (
                      <Crown className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    ) : (
                      <Target className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-purple-900 text-xs sm:text-base md:text-lg truncate">{localAuction.prize}</h3>
                    <div className="flex items-center gap-1 text-[9px] sm:text-xs text-purple-600 sm:hidden">
                      <Calendar className="w-2.5 h-2.5 shrink-0" />
                      <span>{localAuction.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden sm:flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-purple-600">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {localAuction.date.toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <span className="text-purple-400">•</span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                      {localAuction.auctionStartTime}
                    </span>
                  </div>
                  {localAuction.auctionEndTime && (
                    <>
                      <span className="text-purple-400">→</span>
                      <span className="whitespace-nowrap">{localAuction.auctionEndTime}</span>
                    </>
                  )}
                </div>
              </div>
              
              <Badge className={`
                shrink-0 border backdrop-blur-sm font-semibold text-[9px] sm:text-xs px-1 sm:px-2 py-0.5
                ${localAuction.status === 'won' 
                  ? 'bg-gradient-to-r from-violet-100/90 to-fuchsia-100/90 text-violet-900 border-violet-300/60' 
                  : 'bg-purple-50/80 text-purple-700 border-purple-200/50'
                }
              `}>
                <div className="flex items-center gap-0.5">
                  {localAuction.status === 'won' ? (
                    <>
                      <Trophy className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span>Won</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span>Lost</span>
                    </>
                  )}
                </div>
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 md:gap-3" onClick={() => onViewDetails(localAuction)}>
              <div className="bg-gradient-to-br from-purple-50/80 to-violet-50/60 backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-purple-200/50 shadow-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-purple-600 mb-0.5">
                  <Trophy className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Prize</span>
                </div>
                <div className="flex items-center gap-0.5 font-bold text-purple-900">
                  <IndianRupee className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="text-[10px] sm:text-sm md:text-base truncate">{localAuction.prizeValue.toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className={`backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border shadow-sm ${
                localAuction.status === 'won'
                  ? 'bg-gradient-to-br from-violet-50/80 to-fuchsia-50/60 border-violet-200/50'
                  : 'bg-gradient-to-br from-purple-50/80 to-purple-100/60 border-purple-200/50'
              }`}>
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-purple-600 mb-0.5">
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Total Spent</span>
                </div>
                <div className="flex items-center gap-0.5 font-bold text-purple-900">
                  <IndianRupee className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="text-[10px] sm:text-sm md:text-base truncate">{(localAuction.totalAmountSpent || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/80 to-violet-50/60 backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-purple-200/50 shadow-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-purple-600 mb-0.5">
                  <Target className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Rank</span>
                </div>
                <div className="font-bold text-purple-900 text-[10px] sm:text-sm md:text-base">#{localAuction.myRank || 'N/A'}</div>
              </div>

              <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-amber-200/50 shadow-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-amber-700 mb-0.5">
                  <IndianRupee className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Entry Fee</span>
                </div>
                <div className="flex items-center gap-0.5 font-bold text-amber-900">
                  <IndianRupee className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                  <span className="text-[10px] sm:text-sm md:text-base truncate">{(localAuction.entryFeePaid || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50/80 to-cyan-50/60 backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-blue-200/50 shadow-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-blue-700 mb-0.5">
                  <Target className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Rounds</span>
                </div>
                <div className="font-bold text-blue-900 text-[10px] sm:text-sm md:text-base">{localAuction.roundsParticipated || 0} / 4</div>
              </div>

              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/60 backdrop-blur-xl rounded-md sm:rounded-xl p-1.5 sm:p-3 border border-green-200/50 shadow-sm">
                <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs text-green-700 mb-0.5">
                  <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Bids</span>
                </div>
                <div className="font-bold text-green-900 text-[10px] sm:text-sm md:text-base">{localAuction.totalBidsPlaced || 0}</div>
              </div>
            </div>

            {/* Winner's Last Round Bid & Claim Section */}
            <div onClick={(e) => e.stopPropagation()}>
              {/* Not Qualified Message */}
              {!localAuction.isWinner && localAuction.winnersAnnouncedAt && (
                <div className="p-2 sm:p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs font-bold text-red-900">
                        You are not qualified, sorry!
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-red-700">
                        Try participating in the next auction to win exciting prizes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Green Banner - Prize Claimed (Check claimedBy and claimedByRank) - Show for everyone */}
              {localAuction.claimedBy && localAuction.claimedByRank && (
                <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] sm:text-xs font-semibold text-green-900">
                        {getRankEmoji(localAuction.claimedByRank)} Prize Claimed by {getRankSuffix(localAuction.claimedByRank)} Winner
                      </p>
                      <p className="text-[8px] sm:text-[10px] text-green-700">
                        {localAuction.claimUpiId === userEmail 
                          ? `Congratulations! You claimed this prize`
                          : `Claimed by ${localAuction.claimedBy}`
                        }
                      </p>
                      {localAuction.claimedAt && (
                        <p className="text-[8px] sm:text-[10px] text-green-600 mt-0.5">
                          Claimed on {
                            (() => {
                              const date = new Date(localAuction.claimedAt);
                              const correctedDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000)); 
                              return correctedDate.toLocaleString('en-IN', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'Asia/Kolkata'
                              });
                            })()
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {localAuction.isWinner && localAuction.lastRoundBidAmount !== undefined && localAuction.lastRoundBidAmount > 0 && (
                <>
                  {/* Prize claimed by current user */}
                  {localAuction.prizeClaimStatus === 'CLAIMED' && localAuction.claimUpiId === userEmail && !localAuction.claimedBy && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] sm:text-xs font-semibold text-green-900">
                          {getRankEmoji(localAuction.finalRank || 1)} Prize Claimed Successfully!
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-green-700">
                          Amazon voucher sent to {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prize claimed by another winner */}
                {localAuction.prizeClaimStatus === 'CLAIMED' && localAuction.claimUpiId && localAuction.claimUpiId !== userEmail && !localAuction.claimedBy && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] sm:text-xs font-semibold text-green-900">
                          {getRankEmoji(localAuction.claimedByRank || 1)} Prize Claimed by {getRankSuffix(localAuction.claimedByRank || 1)} Winner
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-green-700">
                          Claimed by {localAuction.claimedBy || 'Winner'}
                        </p>
                        {localAuction.claimedAt && (
  <p className="text-[8px] sm:text-[10px] text-green-600 mt-0.5">
    Claimed on {
      (() => {
        const d = new Date(localAuction.claimedAt);
        const adjusted = new Date(d.getTime() - 5.5 * 60 * 60 * 1000);

        return adjusted.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        });
      })()
    }
  </p>
)}

                      </div>
                    </div>
                  </div>
                )}

                {/* Prize claimed but no email info - Generic claimed banner */}
                {localAuction.prizeClaimStatus === 'CLAIMED' && !localAuction.claimUpiId && !localAuction.claimedBy && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] sm:text-xs font-semibold text-green-900">
                          🎉 Prize Claimed Successfully!
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-green-700">
                          Amazon voucher worth ₹{localAuction.prizeValue.toLocaleString('en-IN')} delivered
                        </p>
                        {localAuction.claimedAt && (
  <p className="text-[8px] sm:text-[10px] text-green-600 mt-0.5">
    Claimed on {
      (() => {
        const d = new Date(localAuction.claimedAt);
        const adjusted = new Date(d.getTime() - 5.5 * 60 * 60 * 1000);

        return adjusted.toLocaleString('en-IN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata'
        });
      })()
    }
  </p>
)}

                      </div>
                    </div>
                  </div>
                )}

                {/* Claim window expired - show who claimed if available */}
                {localAuction.prizeClaimStatus === 'EXPIRED' && !(localAuction.claimedByRank && localAuction.claimedByRank < (localAuction.finalRank || 0)) && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] sm:text-xs font-semibold text-red-900">
                          {getRankEmoji(localAuction.finalRank || 1)} Your Claim Window Expired
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-red-700 font-medium mt-0.5">
                          {localAuction.claimNotes || (localAuction.finalRank === 1 
                            ? '15-minute deadline passed. Prize may be offered to 2nd place winner.'
                            : '15-minute deadline passed. Prize not claimed.'
                          )}
                        </p>
                        {localAuction.claimedBy && !localAuction.claimNotes && (
                          <p className="text-[8px] sm:text-[9px] text-red-600 mt-1 italic bg-white/40 p-1 rounded border border-red-100">
                            Prize was claimed by Rank {localAuction.claimedByRank || 'N/A'} ({localAuction.claimedBy})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Waiting Queue Banner - Show when winner is waiting for their turn */}
                {localAuction.prizeClaimStatus === 'PENDING' && isInWaitingQueue() && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-xs font-semibold text-blue-900">
                            {getRankEmoji(localAuction.finalRank || 1)} Waiting Queue - Rank {getRankSuffix(localAuction.finalRank || 1)}
                          </p>
                          <p className="text-[8px] sm:text-[10px] text-blue-700">Your claim window opens soon</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <p className="text-[10px] text-blue-800 leading-relaxed mb-1.5">
                          <strong>⏰ Waiting time:</strong> {localAuction.finalRank === 2 ? '15 mins' : '30 mins'} wait + 15 mins claim window
                        </p>
                        <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg p-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold text-xs text-blue-900">Wait: {timeLeft || 'Updating...'}</span>
                        </div>

                    </div>

                    <div className="bg-white/60 rounded-lg p-2 border border-blue-200">
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        💡 You'll be able to claim if previous {localAuction.finalRank === 2 ? 'winner' : 'winners'} don't claim within their 15-minute window{localAuction.finalRank === 3 ? 's' : ''}.
                      </p>
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Claim Window Soon Banner - Show during 1 min backend delay */}
                {localAuction.prizeClaimStatus === 'PENDING' && isInClaimWindowSoonPeriod() && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border-2 border-amber-400 rounded-lg space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center animate-pulse">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-xs font-semibold text-amber-900">
                            {getRankEmoji(localAuction.finalRank || 1)} Claim Window Opening Soon
                          </p>
                          <p className="text-[8px] sm:text-[10px] text-amber-700">Your turn to claim is almost here!</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-amber-100/60 rounded-lg p-2 border border-amber-200">
                      <div className="animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                      <span className="font-bold text-sm text-amber-800">Claim Window Soon</span>
                    </div>

                    <div className="bg-white/60 rounded-lg p-2 border border-amber-200">
                      <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                        ⏳ Please wait a moment. The claim button will appear shortly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending claim - current user's turn (only show when it's their turn) */}
                {localAuction.prizeClaimStatus === 'PENDING' && isCurrentlyMyTurn() && (
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] sm:text-xs font-semibold text-amber-900">
                            {getRankEmoji(localAuction.finalRank || 1)} Final Round Bid
                          </p>
                          <p className="text-[8px] sm:text-[10px] text-amber-700">Pay to claim prize</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900 font-bold" />
                        <span className="text-base sm:text-lg md:text-xl font-bold text-amber-900">
                          {localAuction.lastRoundBidAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 bg-white/60 rounded-lg p-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className={`font-bold text-sm ${timeLeft === 'EXPIRED' ? 'text-red-600' : 'text-purple-900'}`}>
                        Time Left: {timeLeft}
                      </span>
                    </div>

                    {!showClaimForm ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInWaitingQueue()) {
                            toast.info('Please wait for your turn', {
                              description: 'Previous winners are being given their chance to claim first.'
                            });
                            return;
                          }
                          setShowClaimForm(true);
                        }}
                        disabled={timeLeft === 'EXPIRED' || globalPaymentLoading || isInWaitingQueue()}
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold py-2 rounded-xl text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        {globalPaymentLoading ? 'Processing...' : isInWaitingQueue() ? 'Waiting for Your Turn...' : 'Pay Now & Claim Prize'}
                      </Button>
                    ) : (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                          <Label className="text-purple-900 font-semibold text-xs flex items-center gap-1.5 mb-2">
                            <Gift className="w-4 h-4" />
                            Your Registered Email
                          </Label>
                          <Input
                            type="email"
                            value={userEmail}
                            disabled
                            className="bg-white/70 border-purple-300 text-purple-900 font-medium text-sm cursor-not-allowed"
                          />
                          <p className="text-[10px] text-purple-700 mt-2 flex items-start gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>Amazon voucher details will be sent to this email after successful payment</span>
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowClaimForm(false);
                            }}
                            disabled={globalPaymentLoading}
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={handleClaimPrize}
                            disabled={globalPaymentLoading || timeLeft === 'EXPIRED' || isProcessing || isInWaitingQueue()}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1"
                                />
                                Processing...
                              </>
                            ) : (
                              <>
                                <IndianRupee className="w-4 h-4 mr-1" />
                                Pay ₹{localAuction.lastRoundBidAmount.toLocaleString('en-IN')}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </>
              )}
            </div>

          {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 pt-1.5 sm:pt-2 border-t border-purple-100" onClick={() => onViewDetails(localAuction)}>
              <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm text-purple-600">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">{localAuction.totalParticipants} participants</span>
                <span className="sm:hidden">{localAuction.totalParticipants} users</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {didNotPayEntry && (
                  <Badge className="bg-red-100/80 text-red-700 border-red-300 text-[8px] sm:text-[10px] px-1.5 py-0.5">
                    <span className="hidden sm:inline">No Entry Fee</span>
                    <span className="sm:hidden">No Entry</span>
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-[9px] sm:text-xs text-purple-700 font-medium bg-purple-100/60 px-2 py-0.5 sm:py-1 rounded-full border border-purple-200/50">
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span>View Details</span>
                </div>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Payment Success Modal */}
        {showSuccessModal && (
            <PaymentSuccess
              amount={showSuccessModal.amount}
              type={showSuccessModal.type}
              productName={showSuccessModal.productName}
              productWorth={showSuccessModal.productWorth}
              auctionId={showSuccessModal.auctionId}
              paidBy={showSuccessModal.paidBy}
              paymentMethod={showSuccessModal.paymentMethod}
              onBackToHome={() => {
                setShowSuccessModal(null);
                // ✅ REFRESH PAGE after a small delay to ensure everything is perfectly synced
                // This matches the behavior of the entry fee success modal
                console.log('🔄 Reloading page after prize claim success to ensure fresh state');
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }}
              onClose={() => {
                setShowSuccessModal(null);
                window.location.reload();
              }}
            />
        )}

        {/* NEW: Payment Failure Modal */}
        {showFailureModal && (
          <PaymentFailure
            amount={showFailureModal.amount}
            type={showFailureModal.type}
            errorMessage={showFailureModal.errorMessage}
            productName={showFailureModal.productName}
            auctionId={showFailureModal.auctionId}
            paidBy={showFailureModal.paidBy}
            onRetry={() => {
              setShowFailureModal(null);
              setShowClaimForm(true);
            }}
            onBackToHome={() => setShowFailureModal(null)}
            onClose={() => setShowFailureModal(null)}
          />
        )}
      </motion.div>
    );
  };


export function AuctionHistory({ user, onBack, onViewDetails, serverTime }: AuctionHistoryProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [history, setHistory] = useState<AuctionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NEW: User profile state - fetch once for all cards
  const [userProfile, setUserProfile] = useState<{
    mobile: string;
    email: string;
    username: string;
  } | null>(null);
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  
  // Stats from API (not calculated locally)
  const [stats, setStats] = useState({
    totalAuctions: 0,
    totalWins: 0,
    totalLosses: 0,
    totalSpent: 0,
    totalWon: 0,
    winRate: 0,
    netGain: 0,
  });
  
    // ✅ Computed values from stats and history
    const wonAuctions = history.filter(a => a.status === 'won');
    const lostAuctions = history.filter(a => a.status === 'lost');
    const claimedAuctions = history.filter(a => a.prizeClaimStatus === 'CLAIMED');
    
    // ✅ Calculate success rate based on claims as requested
    const successRate = history.length > 0 
      ? Math.round((claimedAuctions.length / history.length) * 100) 
      : 0;
      
    const { totalSpent, totalWon, netGain } = stats;
  
    const formatDateTime = (value?: string | number | Date) => {
      if (!value) return '--';
      const date = new Date(value);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };
  
  // ✅ NEW: Fetch user profile once on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId || userProfile || isFetchingProfile) return;
      
      setIsFetchingProfile(true);
      
      try {
        const response = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${userId}`);
        
        if (!response.ok) {
          console.warn('❌ [AUCTION_HISTORY] Failed to fetch user profile:', response.status);
          setIsFetchingProfile(false);
          return;
        }
        
        const result = await response.json();
        console.log('✅ [AUCTION_HISTORY] User profile fetched once for all cards:', result);
        
        if (result.success && result.profile) {
          setUserProfile({
            mobile: result.profile.mobile || '',
            email: result.profile.email || localStorage.getItem('user_email') || '',
            username: result.profile.username || user.username,
          });
          
          // ✅ Update localStorage with fresh data
          if (result.profile.mobile) {
            localStorage.setItem('user_mobile', result.profile.mobile);
          }
          if (result.profile.email) {
            localStorage.setItem('user_email', result.profile.email);
          }
          if (result.profile.username) {
            localStorage.setItem('user_name', result.profile.username);
          }
        }
      } catch (error) {
        console.error('❌ [AUCTION_HISTORY] Failed to fetch user profile:', error);
      } finally {
        setIsFetchingProfile(false);
      }
    };
    
    fetchUserProfile();
  }, [user.username]); // Only depend on user.username, not on userProfile to avoid loops
  
  // ✅ Fetch auction history on mount
  useEffect(() => {
    fetchAuctionHistory(true); // Initial load with loading state
  }, []);

  // ✅ UPDATED: Poll for auction history updates - silent background refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAuctionHistory(false); // Background refresh without loading state
    }, 2000); // ✅ CHANGED: Reduced from 5000ms to 2000ms (2 seconds) for faster updates

    return () => clearInterval(interval);
  }, [user.id]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ✅ UPDATED: Add isInitialLoad parameter to control loading state
  const fetchAuctionHistory = async (isInitialLoad = false) => {
    // ✅ Only show loading spinner on initial load
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const queryString = buildQueryString({ userId: user.id });
      const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}${queryString}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch auction history');
      }
      
      const result = await response.json();
      
      // ✅ Only log on initial load to reduce console spam
      if (isInitialLoad) {
        console.log('📊 [AUCTION_HISTORY] API Response:', result);
      }
      
      if (result.success && result.data) {
        const transformedHistory: AuctionHistoryItem[] = result.data.map((auction: any) => {
          // ✅ Only log on initial load to reduce console spam
          if (isInitialLoad) {
            console.log(`🔍 [AUCTION_HISTORY] Auction ${auction.auctionName}:`, {
              'totalParticipants from API': auction.totalParticipants,
              'Full auction data': auction
            });
          }
          
          return {
            id: auction.hourlyAuctionId,
            hourlyAuctionId: auction.hourlyAuctionId,
            date: new Date(auction.auctionDate),
            prize: auction.auctionName,
            prizeValue: auction.prizeValue,
            myBid: auction.totalAmountSpent || 0,
            winningBid: auction.totalAmountSpent || 0,
            status: auction.isWinner ? 'won' : 'lost',
            totalParticipants: auction.totalParticipants || 0,
            myRank: auction.finalRank || 0,
            auctionStartTime: auction.TimeSlot || '',
            auctionEndTime: auction.completedAt 
      ? new Date(new Date(auction.completedAt).getTime() - (5 * 60 + 30) * 60 * 1000)
          .toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata'
          })
      : '',
            boxes: [],
            entryFeePaid: auction.entryFeePaid,
            totalAmountBid: auction.totalAmountBid,
            totalAmountSpent: auction.totalAmountSpent,
            roundsParticipated: auction.roundsParticipated,
            totalBidsPlaced: auction.totalBidsPlaced,
            isWinner: auction.isWinner,
            finalRank: auction.finalRank,
            prizeClaimStatus: auction.prizeClaimStatus,
            // ✅ CRITICAL FIX: Convert datetime strings to UTC timestamps immediately
            claimDeadline: auction.claimDeadline ? Date.parse(auction.claimDeadline) : undefined,
            claimedAt: auction.claimedAt ? Date.parse(auction.claimedAt) : undefined,
            claimUpiId: auction.claimUpiId,
            remainingProductFees: auction.remainingProductFees,
            remainingFeesPaid: auction.remainingFeesPaid,
            lastRoundBidAmount: auction.lastRoundBidAmount,
            prizeAmountWon: auction.prizeAmountWon,
            claimedBy: auction.claimedBy,
            claimedByRank: auction.claimedByRank,
            claimNotes: auction.claimNotes,
            // ✅ NEW: Priority claim system fields - converted to UTC timestamps
              claimWindowStartedAt: auction.claimWindowStartedAt ? Date.parse(auction.claimWindowStartedAt) : undefined,
              winnersAnnouncedAt: auction.completedAt ? Date.parse(auction.completedAt) : undefined,
              currentEligibleRank: auction.currentEligibleRank,
            };

        });
        
        // ✅ Only log on initial load to reduce console spam
        if (isInitialLoad) {
          console.log('✅ [AUCTION_HISTORY] Transformed History:', transformedHistory);
        }
        
        setHistory(transformedHistory);
        
        if (result.stats) {
          setStats({
            totalAuctions: result.stats.totalAuctions || 0,
            totalWins: result.stats.totalWins || 0,
            totalLosses: result.stats.totalLosses || 0,
            totalSpent: result.stats.totalSpent || 0,
            totalWon: result.stats.totalWon || 0,
            winRate: result.stats.winRate || 0,
            netGain: result.stats.netGain || 0,
          });
        }
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching auction history:', err);
      // ✅ Only show error toast on initial load
      if (isInitialLoad) {
        setError('Failed to load auction history. Please try again later.');
        toast.error('Failed to load auction history');
      }
      setHistory([]);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        <LoadingProfile 
          message="Loading Auction History" 
          subMessage="Fetching your activities" 
        />
      </div>
    );
  }


  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        
        {/* Header with Logo - matching Support page style */}
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
                  <Trophy className="w-6 h-6 text-purple-600" />
                  <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Auction History</h1>
                </div>
              </div>
              
              {/* Logo */}
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

        {/* Mobile Title */}
        <motion.div 
          className="flex sm:hidden items-center space-x-2 mb-4 px-3 pt-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Trophy className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold text-purple-800">Auction History</h1>
        </motion.div>

        <main className="container mx-auto px-3 sm:px-4 py-6 relative z-10">
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-2">⚠️</div>
              <p className="text-red-700 font-semibold mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Header with Logo - matching Support page style */}
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
                <Trophy className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Auction History</h1>
              </div>
            </div>
            
            {/* Logo */}
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

      {/* Mobile Title */}
      <motion.div 
        className="flex sm:hidden items-center space-x-2 mb-4 px-3 pt-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Trophy className="w-5 h-5 text-purple-600" />
        <h1 className="text-xl font-bold text-purple-800">Auction History</h1>
      </motion.div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-6 md:py-8 relative z-10">
        {/* Important Rule Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3 sm:mb-4 md:mb-6"
        >
          <Card className="relative overflow-hidden border-2 border-purple-300/60 bg-gradient-to-r from-purple-50/90 via-violet-50/80 to-fuchsia-50/70 backdrop-blur-xl shadow-lg">
                  
            <CardContent className="p-2.5 sm:p-3 md:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-purple-900 text-[10px] sm:text-xs md:text-sm mb-0.5 sm:mb-1">How Dream60 Auctions Work</h3>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-700 leading-relaxed">
                    Each auction has <span className="font-semibold">4 rounds (15 min each)</span>. Entry fee payment in <span className="font-semibold">Boxes 1 & 2</span> unlocks bidding in <span className="font-semibold">Boxes 3 & 4</span>. Winners must pay their final round bid amount within 15 minutes to claim their prize.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mobile: Premium Stats Card - Desktop: Full Stats */}
        <motion.div 
          className="mb-3 sm:mb-6 md:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Mobile: Beautiful Premium Stats Card */}
            <Card className="sm:hidden relative overflow-hidden border-2 border-purple-300/60 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-purple-50/60 to-violet-50/70 shadow-2xl">
                    
              {/* Animated Background Orb */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-40 h-40 rounded-full blur-3xl opacity-20"
                style={{
                  background: 'radial-gradient(circle, #A78BFA, #7C3AED)',
                  top: '-20%',
                  right: '-20%',
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </div>

            <CardContent className="p-4 relative z-10">
              {/* Circular Win Rate - Centered */}
              <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                    >
                      <CircularProgress percentage={successRate} size={100} strokeWidth={8} id="win-rate-mobile" />
                    </motion.div>
                </div>

                  {/* Financial Stats - 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {/* Total Claimed */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="relative overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-emerald-100/80 via-emerald-50/60 to-white/40 backdrop-blur-xl rounded-2xl p-2.5 border-2 border-emerald-200/60 shadow-lg relative overflow-hidden h-full">
                        <div className="flex items-center gap-1.5 mb-1 relative z-10">
                          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-md">
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight">Claimed</div>
                        </div>
                        <div className="flex items-center justify-center py-1">
                          <span className="text-xl font-black text-emerald-900">{claimedAuctions.length}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Total Invested */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45, duration: 0.5 }}
                      className="relative overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-purple-100/80 via-purple-50/60 to-white/40 backdrop-blur-xl rounded-2xl p-2.5 border-2 border-purple-200/60 shadow-lg relative overflow-hidden h-full">
                              
                        <div className="flex items-center gap-1.5 mb-1 relative z-10">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-md">
                            <TrendingDown className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="text-[10px] text-purple-700 font-bold uppercase tracking-tight">Spent</div>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 py-1">
                          <IndianRupee className="w-4 h-4 text-purple-900 font-black" />
                          <span className="text-xl font-black text-purple-900 truncate">{totalSpent.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Total Won */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="relative overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-violet-100/80 via-fuchsia-50/60 to-white/40 backdrop-blur-xl rounded-2xl p-2.5 border-2 border-violet-200/60 shadow-lg h-full">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-md">
                            <TrendingUp className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="text-[10px] text-violet-700 font-bold uppercase tracking-tight">Won</div>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 py-1">
                          <IndianRupee className="w-4 h-4 text-violet-900 font-black" />
                          <span className="text-xl font-black text-violet-900 truncate">{totalWon.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Net Profit/Loss */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55, duration: 0.5 }}
                      className="relative overflow-hidden"
                    >
                      <div className={`bg-gradient-to-br backdrop-blur-xl rounded-2xl p-2.5 border-2 shadow-lg h-full ${
                        netGain >= 0 
                          ? 'from-blue-100/80 via-cyan-50/60 to-white/40 border-blue-200/60' 
                          : 'from-orange-100/80 via-red-50/60 to-white/40 border-orange-200/60'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-md ${
                            netGain >= 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 'bg-gradient-to-br from-orange-500 to-red-600'
                          }`}>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className={`text-[10px] font-bold uppercase tracking-tight ${
                            netGain >= 0 ? 'text-blue-700' : 'text-orange-700'
                          }`}>
                            {netGain >= 0 ? 'Profit' : 'Loss'}
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-0.5 py-1">
                          <span className={`text-base font-black ${netGain >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                            {netGain >= 0 ? '+' : '-'}
                          </span>
                          <IndianRupee className={`w-4 h-4 font-black ${netGain >= 0 ? 'text-blue-900' : 'text-orange-900'}`} />
                          <span className={`text-xl font-black truncate ${netGain >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                            {Math.abs(netGain).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
            </CardContent>
          </Card>

          {/* Desktop: Full Premium Layout */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Win Rate - Large Featured Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:row-span-2"
            >
                <Card className="relative overflow-hidden border-2 border-purple-300/60 backdrop-blur-2xl bg-gradient-to-br from-white/80 via-purple-50/50 to-violet-50/60 shadow-2xl h-full">
                        
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
                    style={{
                      background: 'radial-gradient(circle, #A78BFA, #7C3AED)',
                      top: '-30%',
                      right: '-30%',
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 15,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center h-full relative z-10">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }}
                      className="mb-6"
                    >
                      <CircularProgress percentage={successRate} size={140} strokeWidth={10} id="win-rate-desktop" />
                    </motion.div>
                  
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-bold text-purple-900">Success Rate</h3>
                    </div>
                    <p className="text-sm text-purple-600">Calculated based on prizes claimed</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 w-full mt-6 pt-6 border-t border-purple-200/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{claimedAuctions.length}</div>
                      <div className="text-xs text-purple-600 mt-1">Claimed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-violet-900">{wonAuctions.length}</div>
                      <div className="text-xs text-purple-600 mt-1">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-900">{lostAuctions.length}</div>
                      <div className="text-xs text-purple-600 mt-1">Losses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Side Stats Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Total Auctions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-2xl bg-gradient-to-br from-white/80 to-purple-50/60 shadow-xl">
                        
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/10" />
                  <CardContent className="p-6 relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.3,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    >
                      <Calendar className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="text-sm text-purple-700 mb-2 font-medium">Total Auctions</div>
                    <div className="text-4xl font-bold text-purple-900">{history.length}</div>
                    <div className="text-xs text-purple-600 mt-2">Participated in</div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Spent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-2xl bg-gradient-to-br from-white/80 to-purple-50/60 shadow-xl">
                        
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/10" />
                  <CardContent className="p-6 relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.35,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className="w-14 h-14 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    >
                      <TrendingDown className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="text-sm text-purple-700 mb-2 font-medium">Total Spent</div>
                    <div className="flex items-center gap-1 text-3xl font-bold text-purple-900">
                      <IndianRupee className="w-6 h-6" />
                      <span>{totalSpent.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-2">All bids combined</div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Total Won */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-2xl bg-gradient-to-br from-white/80 via-violet-50/50 to-fuchsia-50/60 shadow-xl">
                        
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/10" />
                  <CardContent className="p-6 relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.4,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                    >
                      <TrendingUp className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className="text-sm text-violet-700 mb-2 font-medium">Total Won</div>
                    <div className="flex items-center gap-1 text-3xl font-bold text-violet-900">
                      <IndianRupee className="w-6 h-6" />
                      <span>{totalWon.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-xs text-violet-600 mt-2">Prize value earned</div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Net Gain/Loss */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className={`relative overflow-hidden border-2 backdrop-blur-2xl shadow-xl ${
                  netGain >= 0 
                    ? 'border-violet-200/60 bg-gradient-to-br from-white/80 via-violet-50/50 to-fuchsia-50/60'
                    : 'border-purple-200/60 bg-gradient-to-br from-white/80 to-purple-50/60'
                }`}>
                        
                  <div className={`absolute inset-0 ${
                    netGain >= 0
                      ? 'bg-gradient-to-br from-violet-500/5 to-fuchsia-500/10'
                      : 'bg-gradient-to-br from-purple-500/5 to-violet-500/10'
                  }`} />
                  <CardContent className="p-6 relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.45,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                        netGain >= 0
                          ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600'
                          : 'bg-gradient-to-br from-purple-500 to-purple-700'
                      }`}
                    >
                      <Sparkles className="w-7 h-7 text-white" />
                    </motion.div>
                    <div className={`text-sm mb-2 font-medium ${
                      netGain >= 0 ? 'text-violet-700' : 'text-purple-700'
                    }`}>
                      Net {netGain >= 0 ? 'Gain' : 'Loss'}
                    </div>
                    <div className={`flex items-center gap-1 text-3xl font-bold ${
                      netGain >= 0 ? 'text-violet-900' : 'text-purple-900'
                    }`}>
                      {netGain >= 0 ? '+' : ''}
                      <IndianRupee className="w-6 h-6" />
                      <span>{Math.abs(netGain).toLocaleString('en-IN')}</span>
                    </div>
                    <div className={`text-xs mt-2 ${
                      netGain >= 0 ? 'text-violet-600' : 'text-purple-600'
                    }`}>
                      {netGain >= 0 ? 'Profit earned' : 'Investment made'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
          </motion.div>

            {/* History List/Tabs */}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="relative overflow-hidden border-2 border-purple-200/60 backdrop-blur-2xl bg-white/80 shadow-2xl">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl opacity-10"
                style={{
                  background: 'radial-gradient(circle, #A78BFA, #7C3AED)',
                  bottom: '-40%',
                  left: '-10%',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  x: [0, -15, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Desktop: Full Header with Icon */}
            <CardHeader className="hidden sm:block relative bg-gradient-to-r from-purple-50/90 via-violet-50/80 to-purple-50/90 border-b-2 border-purple-200/50 backdrop-blur-xl p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl sm:rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-base sm:text-xl md:text-2xl font-bold text-purple-900">Your Activity</h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-purple-600 mt-0.5">Detailed bid history</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-2 sm:p-4 md:p-6 relative z-10">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                  <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full grid-cols-3 mb-3 sm:mb-6 bg-purple-100/60 backdrop-blur-xl p-0.5 sm:p-1 rounded-xl sm:rounded-xl border border-purple-200/50 shadow-inner">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      <Trophy className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5" />
                      All ({history.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="won"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      <Crown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5" />
                      Won ({wonAuctions.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="lost"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-md sm:rounded-xl text-[9px] sm:text-sm md:text-base font-semibold py-1.5 sm:py-2 whitespace-nowrap px-3 sm:px-4"
                    >
                      <TrendingDown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mr-1 sm:mr-1.5" />
                      Lost ({lostAuctions.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="all" className="space-y-2 sm:space-y-3 md:space-y-4 mt-0">
                  {history.length > 0 ? (
                  history.map((auction, index) => <AuctionCard 
                        key={`${activeTab}-${auction.id}`}
                        auction={auction}
                        index={index}
                        tabPrefix={activeTab}
                        user={user}
                        onViewDetails={onViewDetails}
                        onClaimSuccess={() => fetchAuctionHistory()}
                        userProfile={userProfile}
                        serverTime={serverTime}
                      />)
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 sm:py-12"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl"
                      >
                        <Trophy className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                      </motion.div>
                      <p className="text-sm sm:text-base font-semibold text-purple-800">No auction history yet</p>
                      <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-purple-600">Start bidding to see your history here!</p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="won" className="space-y-2 sm:space-y-3 md:space-y-4 mt-0">
                  {wonAuctions.length > 0 ? (
                  wonAuctions.map((auction, index) => <AuctionCard 
                        key={`${activeTab}-${auction.id}`}
                        auction={auction}
                        index={index}
                        tabPrefix={activeTab}
                        user={user}
                        onViewDetails={onViewDetails}
                        onClaimSuccess={() => fetchAuctionHistory()}
                        userProfile={userProfile}
                        serverTime={serverTime}
                      />)
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 sm:py-12"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl"
                      >
                        <Crown className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                      </motion.div>
                      <p className="text-sm sm:text-base font-semibold text-purple-800">No wins yet</p>
                      <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-purple-600">Keep bidding to win amazing prizes!</p>
                    </motion.div>
                  )}
                </TabsContent>

                <TabsContent value="lost" className="space-y-2 sm:space-y-3 md:space-y-4 mt-0">
                  {lostAuctions.length > 0 ? (
                    lostAuctions.map((auction, index) => <AuctionCard 
                      key={`${activeTab}-${auction.id}`}
                      auction={auction}
                      index={index}
                      tabPrefix={activeTab}
                      user={user}
                      onViewDetails={onViewDetails}
                      onClaimSuccess={() => fetchAuctionHistory()}
                      userProfile={userProfile}
                    />)
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 sm:py-12"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        className="w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-xl"
                      >
                        <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                      </motion.div>
                      <p className="text-sm sm:text-base font-semibold text-purple-800">Perfect record!</p>
                      <p className="text-[10px] sm:text-xs mt-1 sm:mt-2 text-purple-600">You haven't lost any auctions yet!</p>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}