import { Gift, IndianRupee, Users, CreditCard, Sparkles, TrendingUp, Trophy, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { parseAPITimestamp, getCurrentIST } from '../utils/timezone';
import { API_ENDPOINTS } from '@/lib/api-config';

interface AuctionConfig {
  auctionNumber: number;
  auctionId: string;
  TimeSlot: string;
  auctionName: string;
  imageUrl?: string;
  prizeValue: number;
  Status: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  FeeSplits?: {
    BoxA: number;
    BoxB: number;
  };
}

// ✅ NEW: Round interface to match API response
interface Round {
  roundNumber: number;
  startedAt: string | null;
  completedAt: string | null;
  totalParticipants: number;
  playersData: any[];
  qualifiedPlayers: any[];
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
}

interface Participant {
  playerId: string;
  playerUsername: string;
  entryFee: number;
  joinedAt: string;
  currentRound: number;
  isEliminated: boolean;
  eliminatedInRound: number | null;
  totalBidsPlaced: number;
  totalAmountBid: number;
}

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

interface PrizeShowcaseProps {
  currentPrize: {
    title: string;
    prize: string;
    prizeValue: number;
    totalParticipants: number;
    userHasPaidEntry?: boolean;
    boxes: Array<{
      id: number;
      type: 'entry' | 'round';
      entryFee?: number;
      hasPaid?: boolean;
    }>;
  };
  onPayEntry?: (boxId: number, entryFee: number) => void;
  onPaymentFailure?: (entryFee: number, errorMessage: string) => void;
  onUserParticipationChange?: (isParticipating: boolean) => void;
  isLoggedIn?: boolean;
  serverTime?: ServerTime | null; // ✅ Server time from parent
  liveAuctionData?: any; // ✅ NEW: Live auction data from parent
  isLoadingLiveAuction?: boolean; // ✅ NEW: Loading state from parent
}

export function PrizeShowcase({ currentPrize, onPayEntry, onPaymentFailure, onUserParticipationChange, isLoggedIn, serverTime, liveAuctionData, isLoadingLiveAuction = true }: PrizeShowcaseProps) {
  const [liveAuctions, setLiveAuctions] = useState<AuctionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // ✅ NEW: Track if this is the initial load
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [boxAFee, setBoxAFee] = useState<number>(0);
  const [boxBFee, setBoxBFee] = useState<number>(0);
  const { initiatePayment, loading: paymentLoading } = useRazorpayPayment();
  const [participantsCount, setParticipantsCount] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isUserParticipating, setIsUserParticipating] = useState(false);
  const [isJoinWindowOpen, setIsJoinWindowOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [auctionEndTime, setAuctionEndTime] = useState<Date | null>(null);
  const [noLiveAuction, setNoLiveAuction] = useState(false);
  // ✅ NEW: Store initial fallback time to prevent recalculation
  const [fallbackEndTime, setFallbackEndTime] = useState<Date | null>(null);
  // ✅ NEW: Track current auction ID to detect auction changes
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null);

  // ✅ Calculate current server time based on passed serverTime
  const getCurrentServerTime = (): number => {
    if (!serverTime) {
      return getCurrentIST().getTime();
    }
    return serverTime.timestamp;
  };

  // ✅ UPDATED: Calculate auction end time from rounds data - use last round's completedAt
  const calculateAuctionEndTime = (rounds: Round[]) => {
    console.log('🔍 [CALCULATE END TIME] Starting calculation with rounds:', rounds.length);
    
    if (!rounds || rounds.length === 0) {
      console.log('⚠️ [CALCULATE END TIME] No rounds data, using fallback');
      // ✅ CRITICAL FIX: Use stored fallback time instead of recalculating
      if (!fallbackEndTime) {
        const newFallbackTime = new Date(getCurrentServerTime() + 60 * 60 * 1000);
        setFallbackEndTime(newFallbackTime);
        return newFallbackTime;
      }
      return fallbackEndTime;
    }

    // ✅ Find the last round (round 4) and use its completedAt time
    const lastRound = rounds[rounds.length - 1];
    
    console.log('📊 [CALCULATE END TIME] Last round details:', {
      roundNumber: lastRound.roundNumber,
      startedAt: lastRound.startedAt,
      completedAt: lastRound.completedAt,
      status: lastRound.status
    });
    
    if (lastRound && lastRound.completedAt) {
      // ✅ Parse the UTC timestamp and convert to IST
      const endTime = parseAPITimestamp(lastRound.completedAt);
      
      const endTimeIST = endTime.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      console.log(`✅ [CALCULATE END TIME] Round ${lastRound.roundNumber} ends at:`, {
        utcTime: lastRound.completedAt,
        istTime: endTimeIST,
        timestamp: endTime.getTime()
      });
      
      return endTime;
    }
    
    // Fallback: use stored fallback time
    console.log('⚠️ [CALCULATE END TIME] No completedAt found, using fallback');
    if (!fallbackEndTime) {
      const newFallbackTime = new Date(getCurrentServerTime() + 60 * 60 * 1000);
      setFallbackEndTime(newFallbackTime);
      return newFallbackTime;
    }
    return fallbackEndTime;
  };

  // ✅ UPDATED: Process live auction data from parent - only show loading on initial load
  useEffect(() => {
    // ✅ CRITICAL FIX: Only show loading state on initial load, not on subsequent polls
    if (isLoadingLiveAuction && !hasInitiallyLoaded) {
      setIsLoading(true);
      setNoLiveAuction(false);
      return;
    }

    // ✅ FIX: If data is loading but we already have data, just wait for new data
    if (isLoadingLiveAuction && hasInitiallyLoaded) {
      // Don't change any state - keep showing existing data
      return;
    }

    // ✅ FIX: Don't clear state if data is temporarily undefined during refetch
    if (!liveAuctionData) {
      // Only show "No Live Auction" if we don't have existing data
      if (liveAuctions.length === 0 && hasInitiallyLoaded) {
        setNoLiveAuction(true);
        setIsLoading(false);
      }
      return;
    }

    console.log('📊 [PRIZE SHOWCASE] Received live auction data from parent');
    setNoLiveAuction(false);
    setIsLoading(false);
    setHasInitiallyLoaded(true); // ✅ Mark as loaded after first data

    const a = liveAuctionData;

    // ✅ CRITICAL FIX: Update participants count separately without affecting loading state
    const participantsList = a.participants || [];
    setParticipants(participantsList);
    setParticipantsCount(participantsList.length);

    // Check if current user is in participants list
    const userId = localStorage.getItem('user_id');
    if (userId) {
      const userInParticipants = participantsList.some(
        (p: Participant) => p.playerId === userId
      );
      setIsUserParticipating(userInParticipants);
      
      // Notify parent component about participation status
      if (onUserParticipationChange) {
        onUserParticipationChange(userInParticipants);
      }
    }

    const liveAuction: AuctionConfig = {
      auctionNumber: a.auctionNumber,
      auctionId: a.hourlyAuctionId,
      TimeSlot: a.TimeSlot,
      auctionName: a.auctionName,
      imageUrl: a.imageUrl,
      prizeValue: a.prizeValue,
      Status: a.Status,
      FeeSplits: a.FeeSplits,
    };

    setLiveAuctions([liveAuction]);
    setBoxAFee(a.FeeSplits?.BoxA || 0);
    setBoxBFee(a.FeeSplits?.BoxB || 0);

    // ✅ CRITICAL FIX: Only recalculate end time if auction ID changes or is new
    const isNewAuction = !currentAuctionId || a.hourlyAuctionId !== currentAuctionId;
    
    if (isNewAuction && a.rounds && a.rounds.length > 0) {
      console.log('🔄 [PRIZE SHOWCASE] New auction detected, calculating end time');
      setCurrentAuctionId(a.hourlyAuctionId);
      const endTime = calculateAuctionEndTime(a.rounds);
      setAuctionEndTime(endTime);
      // Reset fallback time for new auction
      setFallbackEndTime(null);
    } else if (!isNewAuction) {
      console.log('⏭️ [PRIZE SHOWCASE] Same auction, keeping existing end time');
    }
  }, [liveAuctionData, onUserParticipationChange, isLoadingLiveAuction, hasInitiallyLoaded]);

  // ✅ Update join window status from serverTime
  useEffect(() => {
    if (!serverTime) return;
    
    const isWithinJoinWindow = serverTime.minute < 15;
    setIsJoinWindowOpen(isWithinJoinWindow);
  }, [serverTime]);

  // ✅ Update countdown timer every second using server time
  useEffect(() => {
    if (!auctionEndTime) return;

    const updateTimer = () => {
      // ✅ CRITICAL FIX: If winners are announced, show 00:00:00 immediately
      if (liveAuctionData?.winnersAnnounced) {
        setTimeLeft('00:00:00');
        return;
      }

      // ✅ Use calculated server time instead of browser local time
      const now = getCurrentServerTime();
      const distance = auctionEndTime.getTime() - now;
      
      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('00:00:00');
      }
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [auctionEndTime, serverTime, liveAuctionData?.winnersAnnounced]);

  const handlePayEntry = () => {
    if (!isLoggedIn || liveAuctions.length === 0) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const currentAuction = liveAuctions[0];
    const totalEntryFee = boxAFee + boxBFee;

    // Get user details
    const userName = localStorage.getItem('user_name') || 'Guest User';
    const userEmail = localStorage.getItem('user_email') || localStorage.getItem('email') || 'user@dream60.com';
    const userMobile = localStorage.getItem('user_mobile') || '9999999999';

    initiatePayment(
      {
        userId,
        hourlyAuctionId: currentAuction.auctionId,
        amount: totalEntryFee,
        currency: 'INR',
        username: userName,
      },
      {
        name: userName,
        email: userEmail,
        contact: userMobile,
      },
      (response) => {
        // Payment success - update local state
        console.log('Payment verified successfully:', response);
        setIsUserParticipating(true);
        
        // Notify parent to refetch auction data
        onPayEntry?.(0, totalEntryFee);
      },
      (error) => {
        // Payment failure
        console.error('Payment failed:', error);
        onPaymentFailure?.(totalEntryFee, error);
      }
    );
  };

  const entryBoxes = currentPrize.boxes.filter(box => box.type === 'entry');
  const hasAnyPaidEntry =
    isUserParticipating || currentPrize.userHasPaidEntry || entryBoxes.some(box => box.hasPaid);

  const totalEntryFee = boxAFee + boxBFee;

  const displayPrize =
    liveAuctions.length > 0 ? liveAuctions[0].auctionName : currentPrize.prize;
  const displayPrizeValue =
    liveAuctions.length > 0 ? liveAuctions[0].prizeValue : currentPrize.prizeValue;
  const displayImage = liveAuctions.length > 0 ? liveAuctions[0].imageUrl : null;

  // ✅ UPDATED: Simplified disable logic - removed timeLoading dependency
  const isPayButtonDisabled = isLoading || totalEntryFee === 0 || paymentLoading || !isJoinWindowOpen;

  // Show "No Live Auction" state when there's no auction
  if (noLiveAuction && !isLoading) {
    return (
      <div className="relative group/main">
        {/* Outer gradient glow */}
        <div className="absolute -inset-[2px] bg-gradient-to-br from-[#9F7ACB]/30 via-[#B99FD9]/20 to-[#8456BC]/30 rounded-[26px] blur-xl opacity-60 group-hover/main:opacity-80 transition-opacity duration-700"></div>

        {/* Main glassmorphism container */}
        <div className="relative">
          {/* Layered glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white/90 to-purple-100/60 rounded-[24px]"></div>
          <div className="absolute inset-0 backdrop-blur-2xl bg-white/50 rounded-[24px]"></div>

          {/* Content container */}
          <div className="relative backdrop-blur-md bg-white/30 rounded-[24px] p-4 sm:p-6 md:p-8 border border-white/60 shadow-2xl">
            <div className="text-center py-12 sm:py-16">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900 mb-2 sm:mb-3">
                No Live Auction
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-purple-700 mb-4 sm:mb-6 max-w-md mx-auto">
                There are currently no active auctions. New auctions start every hour at the beginning of the hour.
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Clock className="w-5 h-5" />
                <span className="text-sm sm:text-base">Check back soon for the next auction!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group/main">
      {/* Outer gradient glow */}
      <div className="absolute -inset-[2px] bg-gradient-to-br from-[#9F7ACB]/30 via-[#B99FD9]/20 to-[#8456BC]/30 rounded-[26px] blur-xl opacity-60 group-hover/main:opacity-80 transition-opacity duration-700"></div>

      {/* Main glassmorphism container */}
      <div className="relative">
        {/* Layered glass background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-white/90 to-purple-100/60 rounded-[24px]"></div>
        <div className="absolute inset-0 backdrop-blur-2xl bg-white/50 rounded-[24px]"></div>

        {/* Content container */}
        <div className="relative backdrop-blur-md bg-white/30 rounded-[24px] p-2 sm:p-3 md:p-4 border border-white/60 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 items-stretch">
            {/* Left Content Section */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {/* Header with Icon */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8456BC] to-[#B99FD9] rounded-xl blur-lg opacity-50 group-hover/icon:opacity-70 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-[#8456BC] to-[#B99FD9] p-1.5 sm:p-2 rounded-xl shadow-lg">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3A2257] via-[#53317B] to-[#6B3FA0] bg-clip-text text-transparent">
                  Current Prize
                </h2>
              </div>

              {/* Stats Row - Prize Value with Time Left */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Prize Value */}
                <div className="group/stat relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8456BC]/10 to-[#9F7ACB]/10 rounded-xl blur group-hover/stat:blur-md transition-all"></div>
                  <div className="relative backdrop-blur-xl bg-white/70 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 border border-purple-200/40 shadow-sm inline-flex items-center space-x-1.5 sm:space-x-2">
                    {isLoading ? (
                      <div className="w-20 h-5 bg-gradient-to-r from-purple-200 to-purple-300 rounded animate-pulse"></div>
                    ) : (
                      <span className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-[#53317B] to-[#6B3FA0] bg-clip-text text-transparent">
                        ₹{displayPrizeValue.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Time Left Until Auction Ends */}
                {!isLoading && auctionEndTime && (
                  <div className="group/stat relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl blur group-hover/stat:blur-md transition-all"></div>
                    <div className="relative backdrop-blur-xl bg-white/70 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 border border-red-200/40 shadow-sm inline-flex items-center space-x-1.5 sm:space-x-2">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                      <span className="text-sm sm:text-base md:text-lg font-bold font-mono bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent tracking-tight">
                        {timeLeft}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {/* Entry Fee Payment Section - Show only if user hasn't paid */}
                {!hasAnyPaidEntry && (
                  <div className="relative group/entry">
                    {/* Animated glow effect */}
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-[#8456BC]/30 via-[#9F7ACB]/30 to-[#B99FD9]/30 rounded-[18px] blur-md opacity-30 group-hover/entry:opacity-50 transition-opacity duration-500"></div>

                    <div className="relative backdrop-blur-2xl bg-white/85 rounded-2xl p-2.5 sm:p-3 md:p-4 border border-purple-200/50 shadow-xl">
                      {/* Header */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <div className="bg-gradient-to-br from-[#8456BC] to-[#B99FD9] p-1 sm:p-1.5 rounded-xl shadow-md">
                          <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-[#3A2257] to-[#6B3FA0] bg-clip-text text-transparent">
                          Pay Entry Fee to Join
                        </span>
                      </div>

                      {/* Entry Fee Breakdown - BoxA and BoxB */}
                      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-3">
                        {/* Box 1 - BoxA */}
                        <div className="group/box relative backdrop-blur-lg bg-gradient-to-r from-purple-50/70 to-white/70 rounded-xl p-2 sm:p-2.5 border border-purple-100/40 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-[#53317B]">
                              Box 1 (BoxA):
                            </span>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8456BC]" />
                              {isLoading ? (
                                <div className="w-12 h-4 bg-gradient-to-r from-purple-200 to-purple-300 rounded animate-pulse"></div>
                              ) : (
                                <span className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">
                                  {boxAFee.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Box 2 - BoxB */}
                        <div className="group/box relative backdrop-blur-lg bg-gradient-to-r from-purple-50/70 to-white/70 rounded-xl p-2 sm:p-2.5 border border-purple-100/40 transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-semibold text-[#53317B]">
                              Box 2 (BoxB):
                            </span>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8456BC]" />
                              {isLoading ? (
                                <div className="w-12 h-4 bg-gradient-to-r from-purple-200 to-purple-300 rounded animate-pulse"></div>
                              ) : (
                                <span className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">
                                  {boxBFee.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Total = BoxA + BoxB */}
                        <div className="relative mt-2 sm:mt-3 group/total">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#8456BC]/15 to-[#B99FD9]/15 rounded-xl blur-sm"></div>
                          <div className="relative backdrop-blur-xl bg-gradient-to-r from-purple-100/85 to-purple-50/85 rounded-xl p-2 sm:p-2.5 md:p-3 border-2 border-[#9F7ACB]/40 shadow-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 sm:gap-1.5">
                                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8456BC] animate-pulse" />
                                <span className="text-xs sm:text-sm md:text-base font-bold text-[#3A2257]">
                                  Total Entry Fee:
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <IndianRupee className="w-4  sm:w-5 h-5 text-[#6B3FA0]" />
                                {isLoading ? (
                                  <div className="w-16 h-6 bg-gradient-to-r from-purple-200 to-purple-300 rounded animate-pulse"></div>
                                ) : (
                                  <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-[#53317B] to-[#8456BC] bg-clip-text text-transparent">
                                    {totalEntryFee.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Join Window Status & Pay Button */}
                      {!isJoinWindowOpen ? (
                        <div className="relative group/closed">
                          <div className="absolute -inset-[1px] bg-gradient-to-r from-red-400/30 to-orange-500/30 rounded-xl blur-md opacity-40"></div>
                          <div className="relative backdrop-blur-xl bg-gradient-to-br from-red-50/90 to-orange-50/85 border-2 border-red-300/50 rounded-xl p-2.5 sm:p-3 shadow-lg">
                            <div className="flex items-center gap-1.5 sm:gap-2 text-red-700">
                              <div className="bg-gradient-to-br from-red-500 to-orange-600 p-1 sm:p-1.5 rounded-lg shadow-md">
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                              </div>
                              <span className="text-xs sm:text-sm md:text-base font-bold">
                                Join Window Closed
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-red-600 mt-1 ml-6 sm:ml-8 font-medium">
                              You can only join within the first 15 minutes of each hour.
                            </p>
                            
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Pay Now Button */}
                          {isLoggedIn ? (
                            <>
                              <Button
                                onClick={handlePayEntry}
                                disabled={isPayButtonDisabled}
                                className="w-full relative overflow-hidden bg-gradient-to-r from-[#6B3FA0] via-[#8456BC] to-[#9F7ACB] text-white hover:from-[#8456BC] hover:via-[#9F7ACB] hover:to-[#B99FD9] shadow-xl text-xs sm:text-sm md:text-base py-2 sm:py-2.5 md:py-3 rounded-xl font-bold transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] group/button disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>
                                    {paymentLoading ? 'Processing...' : `Pay Now - ₹${totalEntryFee.toLocaleString('en-IN')}`}
                                  </span>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000"></div>
                              </Button>

                              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                                <p className="text-[10px] sm:text-xs text-[#6B3FA0] text-center font-medium flex-1">
                                  💡 Pay once to unlock all Auction rounds!
                                </p>
                                {serverTime && isJoinWindowOpen && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    <p className="text-[10px] text-emerald-600 font-semibold whitespace-nowrap">
                                      {15 - serverTime.minute} min left
                                    </p>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-[10px] sm:text-xs text-[#6B3FA0] mt-1.5 sm:mt-2 text-center font-medium">
                              🔒 Login to pay entry fee and start Auction!
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Entry Paid Success */}
                {hasAnyPaidEntry && (
                  <div className="relative group/success">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-400/30 to-green-500/30 rounded-[18px] blur-md opacity-40"></div>
                    <div className="relative backdrop-blur-2xl bg-gradient-to-br from-emerald-50/90 to-green-50/85 border-2 border-emerald-300/50 rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-xl">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-700">
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-1 sm:p-1.5 rounded-xl shadow-md">
                          <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <span className="text-xs sm:text-sm md:text-base font-bold">
                          ✓ Entry Paid - Auction Unlocked!
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-emerald-600 mt-1 ml-6 sm:ml-8 font-medium">
                        Round boxes are now available. Good luck!
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="relative group/info">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-50/50 rounded-xl blur-sm"></div>
                  <div className="relative backdrop-blur-xl bg-purple-50/50 rounded-xl p-2 sm:p-2.5 md:p-3 border border-purple-100/40 shadow-sm">
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8456BC] mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] sm:text-xs md:text-sm text-[#53317B] font-medium leading-relaxed">
                        Round boxes open every 15 minutes. Highest Auction Amount in the final round wins this amazing prize!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Prize Image Section */}
            <div className="relative order-first md:order-last space-y-2 sm:space-y-3 md:space-y-4 h-full flex flex-col">
              {/* Header – displayPrize heading aligned with Current Prize */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8456BC] to-[#B99FD9] rounded-xl blur-lg opacity-50 group-hover/icon:opacity-70 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-[#8456BC] to-[#B99FD9] p-1.5 sm:p-2 rounded-xl shadow-lg">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3A2257] via-[#53317B] to-[#6B3FA0] bg-clip-text text-transparent text-right">
                  {isLoading ? 'Loading...' : displayPrize}
                </h2>
              </div>

              {/* Participants + Status Row */}
              <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                {/* Participants Count */}
                <div className="group/stat relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9F7ACB]/10 to-[#B99FD9]/10 rounded-xl blur group-hover/stat:blur-md transition-all"></div>
                  <div className="relative backdrop-blur-xl bg-white/70 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 border border-purple-200/40 shadow-sm inline-flex items-center space-x-1.5 sm:space-x-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B3FA0]" />
                    <span className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-[#53317B] to-[#6B3FA0] bg-clip-text text-transparent">
                      {participantsCount} participants
                    </span>
                  </div>
                </div>

                {/* Participation Status Badge */}
                {isLoggedIn && isUserParticipating && (
                  <div className="group/stat relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl blur group-hover/stat:blur-md transition-all"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-50/90 to-green-50/85 border-2 border-emerald-300/50 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm inline-flex items-center space-x-1.5 sm:space-x-2">
                      <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 sm:p-1 rounded-lg shadow-md">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm md:text-base font-bold text-emerald-700">
                        Participating
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Card */}
              <div className="relative group/image flex-1 flex flex-col">
                <div className="absolute -inset-[2px] bg-gradient-to-br from-[#8456BC]/40 via-[#9F7ACB]/30 to-[#B99FD9]/40 rounded-[20px] blur-xl opacity-30 group-hover/image:opacity-50 transition-all duration-700 animate-pulse"></div>

                <div className="relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/75 border border-purple-200/50 p-2 sm:p-3 md:p-4 shadow-2xl flex-1 flex">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={displayImage}
                      alt={displayPrize}
                      className="w-full h-40 sm:h-56 md:h-72 lg:h-80 object-contain transform group-hover/image:scale-105 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}