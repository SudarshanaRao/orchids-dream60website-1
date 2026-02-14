import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Trophy, Calendar, Clock, IndianRupee, Target, Award, Crown, Users, TrendingUp, Sparkles, Box, CheckCircle2, XCircle, Lock, Medal, TrendingDown, BarChart3, Zap, Loader2, AlertCircle, CheckCircle, Gift, Timer, HourglassIcon, ChevronDown, ChevronUp, Eye, EyeOff, Shield, Flame, Hash, Activity } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { usePayment } from '../hooks/usePayment';
import { AirpayForm } from './AirpayForm';
import { API_ENDPOINTS, buildQueryString } from '@/lib/api-config';
import { LoadingProfile } from './LoadingProfile';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentFailure } from './PaymentFailure';

const maskEmail = (email: string) => {
  if (!email) return '';
  const [local = '', domain = ''] = email.split('@');
  const maskedLocal = local.length <= 2
    ? `${local.slice(0, 1)}***`
    : `${local.slice(0, 1)}***${local.slice(-1)}`;
  const [domainName = '', ...restDomain] = domain.split('.');
  const maskedDomain = domainName.length <= 2
    ? `${domainName.slice(0, 1)}***`
    : `${domainName.slice(0, 1)}***${domainName.slice(-1)}`;
  const domainSuffix = restDomain.join('.');
  return `${maskedLocal}@${maskedDomain}${domainSuffix ? `.${domainSuffix}` : ''}`;
};

const maskMobile = (mobile: string) => {
  if (!mobile) return '';
  if (mobile.length <= 4) return '****';
  return mobile.slice(0, 2) + '****' + mobile.slice(-2);
};

const maskUsername = (name: string) => {
  if (!name) return '';
  if (name.length <= 2) return name[0] + '***';
  return name[0] + '***' + name.slice(-1);
};

const formatTimestamp = (ts: string | number | undefined) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

const formatTime = (ts: string | number | undefined) => {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
};

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
  cutoffPercentage?: number;
  eliminatedCount?: number;
  participants?: Array<{
    username: string;
    email?: string;
    mobile?: string;
    bidAmount: number;
    rank: number;
    qualified: boolean;
    eliminationReason?: string;
    bidPlacedAt?: string;
  }>;
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
  auctionStatus?: string;
  entryFeePaid?: number;
  totalAmountBid?: number;
  totalAmountSpent?: number;
  roundsParticipated?: number;
  totalBidsPlaced?: number;
  hourlyAuctionId?: string;
  isWinner?: boolean;
  finalRank?: number;
  prizeClaimStatus?: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'NOT_APPLICABLE';
  claimDeadline?: number;
  claimedAt?: number;
  lastRoundBidAmount?: number;
  prizeAmountWon?: number;
  winnersAnnounced?: boolean;
  claimedBy?: string;
  claimUpiId?: string;
  claimedByRank?: number;
  currentEligibleRank?: number;
  claimWindowStartedAt?: number;
  winnersAnnouncedAt?: number;
  imageUrl?: string;
}

interface AuctionDetailsPageProps {
  auction: AuctionDetailsData;
  onBack: () => void;
  serverTime: any;
}

export function AuctionDetailsPage({ auction: initialAuction, onBack, serverTime }: AuctionDetailsPageProps) {
  const [auction, setAuction] = useState(initialAuction);
  const [isLoading, setIsLoading] = useState(true);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const isAuctionInProgress = auction.auctionStatus === 'IN_PROGRESS';

  const [showSuccessModal, setShowSuccessModal] = useState<any | null>(null);
  const [showFailureModal, setShowFailureModal] = useState<any | null>(null);

  const winnersAnnouncedEarly = auction.winnersAnnounced && detailedData?.rounds?.some((round: RoundDetails) =>
    round.roundNumber > 1 && ['pending', 'active'].includes((round.status || '').toLowerCase())
  );

  const { initiatePayment, loading: globalPaymentLoading, airpayData } = usePayment();

  const [userInfo, setUserInfo] = useState({
    userId: localStorage.getItem('user_id') || '',
    userName: localStorage.getItem('user_name') || 'User',
    userEmail: localStorage.getItem('user_email') || '',
    userMobile: localStorage.getItem('user_mobile') || '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userInfo.userEmail && userInfo.userId) {
        try {
          const response = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${userInfo.userId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const result = await response.json();
            const userData = result.data || result.user || result.profile;
            if (result.success && userData) {
              const mobile = userData.mobile || userData.phone || userData.contact || '';
              const name = userData.username || userData.name || userInfo.userName;
              const email = userData.email || '';
              if (email || mobile || name) {
                setUserInfo(prev => ({
                  ...prev,
                  userName: name || prev.userName,
                  userEmail: email || prev.userEmail,
                  userMobile: mobile || prev.userMobile,
                }));
                if (mobile) localStorage.setItem('user_mobile', mobile);
                if (name) localStorage.setItem('user_name', name);
                if (email) localStorage.setItem('user_email', email);
              }
            }
          }
        } catch (error) {
          console.log('Could not cache user data:', error);
        }
      }
    };
    fetchUserData();
  }, [userInfo.userId]);

  useEffect(() => {
    fetchDetailedData(true);
  }, []);

  useEffect(() => {
    fetchDetailedData(false);
  }, [auction.hourlyAuctionId, userInfo.userId]);

  const fetchDetailedData = async (isInitialLoad = false) => {
    if (!auction.hourlyAuctionId || !userInfo.userId) {
      if (isInitialLoad) setIsLoading(false);
      return;
    }
    try {
      if (isInitialLoad) setIsLoading(true);
      const queryString = buildQueryString({
        hourlyAuctionId: auction.hourlyAuctionId,
        userId: userInfo.userId
      });
      const response = await fetch(`${API_ENDPOINTS.scheduler.auctionDetails}${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch auction details');
      const result = await response.json();
      if (result.success && result.data) {
        setDetailedData(result.data);
        const hourlyAuction = result.data.hourlyAuction;
        if (hourlyAuction && hourlyAuction.winners) {
          const claimedWinner = hourlyAuction.winners.find((w: any) => w.isPrizeClaimed);
          if (claimedWinner) {
            setAuction(prev => ({
              ...prev,
              claimedBy: claimedWinner.playerUsername,
              claimedByRank: claimedWinner.rank,
              claimedAt: claimedWinner.prizeClaimedAt,
              prizeClaimStatus: prev.finalRank === claimedWinner.rank ? 'CLAIMED' : prev.prizeClaimStatus
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching detailed auction data:', error);
      if (isInitialLoad) toast.error('Could not load detailed auction information');
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  };

  const checkPrizeClaimedStatus = () => {
    if (!detailedData || !detailedData.hourlyAuction) return null;
    const hourlyAuction = detailedData.hourlyAuction;
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

  const isCurrentlyEligibleToClaim = () => {
    if (!auction.isWinner || auction.prizeClaimStatus !== 'PENDING') return false;
    const claimStatus = checkPrizeClaimedStatus();
    if (claimStatus && claimStatus.claimed) {
      if (auction.finalRank && claimStatus.claimedByRank < auction.finalRank) return false;
    }
    if (auction.claimedByRank && auction.finalRank && auction.claimedByRank < auction.finalRank) return false;
    if (!auction.currentEligibleRank || !auction.finalRank) return false;
    return auction.finalRank === auction.currentEligibleRank;
  };

  const isInWaitingQueue = () => {
    if (!auction.isWinner || auction.prizeClaimStatus !== 'PENDING') return false;
    const claimStatus = checkPrizeClaimedStatus();
    if (claimStatus && claimStatus.claimed) {
      if (auction.finalRank && claimStatus.claimedByRank < auction.finalRank) return false;
    }
    if (auction.claimedByRank && auction.finalRank && auction.claimedByRank < auction.finalRank) return false;
    if (!auction.currentEligibleRank || !auction.finalRank) return false;
    return auction.finalRank > auction.currentEligibleRank;
  };

  const getQueuePosition = () => {
    if (!auction.finalRank || !auction.currentEligibleRank) return 0;
    return auction.finalRank - auction.currentEligibleRank;
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!auction.isWinner || auction.prizeClaimStatus !== "PENDING") return;
    const updateTimer = () => {
      const now = (serverTime as any)?.timestamp || Date.now();
      const getActiveWindow = () => {
        const activeRank = auction.currentEligibleRank || 1;
        const userRank = auction.finalRank || 1;
        const winnersAnnouncedTime = auction.winnersAnnouncedAt;
        if (!winnersAnnouncedTime) return null;
        const activeWindowStart = winnersAnnouncedTime + ((activeRank - 1) * 15 * 60 * 1000);
        const activeWindowEnd = activeWindowStart + (15 * 60 * 1000);
        const userWindowStart = winnersAnnouncedTime + ((userRank - 1) * 15 * 60 * 1000);
        const userWindowEnd = userWindowStart + (15 * 60 * 1000);
        return { start: activeWindowStart, end: activeWindowEnd, userStart: userWindowStart, userEnd: userWindowEnd };
      };
      const activeWindow = getActiveWindow();
      if (isInWaitingQueue() && activeWindow) {
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
      if (auction.finalRank && auction.currentEligibleRank && activeWindow) {
        if (auction.finalRank === auction.currentEligibleRank) {
          let diff = activeWindow.start - now;
          if (diff <= 0 && diff > -(60 * 1000)) {
            setTimeLeft('Claim Window Soon');
            return;
          }
        }
      }
      if (activeWindow && auction.finalRank === auction.currentEligibleRank) {
        const deadline = activeWindow.userEnd;
        let diff = deadline - now;
        if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
        const maxClaimTime = 15 * 60 * 1000;
        if (diff > maxClaimTime) diff = maxClaimTime;
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction.claimDeadline, auction.prizeClaimStatus, auction.claimWindowStartedAt, auction.finalRank, auction.currentEligibleRank, auction.winnersAnnouncedAt, serverTime]);

  const handleClaimPrize = async () => {
    if (timeLeft === 'EXPIRED') { toast.error('Claim window has expired'); return; }
    if (!isCurrentlyEligibleToClaim()) { toast.error('It is not your turn to claim yet.'); return; }
    if (!auction.hourlyAuctionId) { toast.error('Missing auction information.'); return; }
    if (!auction.lastRoundBidAmount || auction.lastRoundBidAmount <= 0) { toast.error('Invalid bid amount.'); return; }
    const currentUserEmail = userInfo.userEmail || '';
    const currentUserMobile = userInfo.userMobile || '';
    const currentUserName = userInfo.userName || 'User';
    setIsProcessing(true);
    try {
      initiatePayment(
        {
          userId: userInfo.userId,
          hourlyAuctionId: auction.hourlyAuctionId,
          amount: auction.lastRoundBidAmount,
          currency: 'INR',
          username: currentUserName,
          paymentType: 'PRIZE_CLAIM'
        },
        {
          name: currentUserName,
          email: currentUserEmail,
          contact: currentUserMobile,
          upiId: currentUserEmail,
        },
        async (response) => {
          setShowSuccessModal({
            amount: auction.lastRoundBidAmount,
            type: 'claim',
            productName: auction.prize,
            productWorth: auction.prizeValue,
            auctionId: auction.hourlyAuctionId,
            paidBy: currentUserName,
            paymentMethod: response.data?.upiId ? `UPI (${response.data.upiId})` : 'UPI / Card',
            transactionId: response.data?.payment?.razorpayPaymentId || response.data?.payment?.airpayTransactionId
          });
          setAuction(prev => ({
            ...prev,
            prizeClaimStatus: 'CLAIMED',
            claimedAt: Date.now(),
            claimedBy: currentUserName,
            claimUpiId: response.data?.upiId || currentUserEmail,
            claimedByRank: auction.finalRank
          }));
          toast.success('Prize Claimed Successfully!');
          setShowClaimForm(false);
          setIsProcessing(false);
          setTimeout(() => { fetchDetailedData(); }, 1000);
        },
        (error) => {
          setShowFailureModal({
            amount: auction.lastRoundBidAmount,
            type: 'claim',
            errorMessage: error || 'Failed to process prize claim payment',
            productName: auction.prize,
            auctionId: auction.hourlyAuctionId,
            paidBy: currentUserName
          });
          toast.error('Payment Failed');
          setIsProcessing(false);
        }
      );
    } catch (error) {
      toast.error('Failed to initiate payment.');
      setIsProcessing(false);
    }
  };

  const calculateNetProfit = () => {
    if (!auction.isWinner || !auction.lastRoundBidAmount || !auction.prizeValue) return 0;
    return auction.prizeValue - auction.lastRoundBidAmount;
  };
  const netProfit = calculateNetProfit();

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

  const toggleRoundExpanded = (roundNumber: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev);
      if (next.has(roundNumber)) next.delete(roundNumber);
      else next.add(roundNumber);
      return next;
    });
  };

  const handleCloseSuccess = useCallback(() => {
    setShowSuccessModal(null);
    onBack();
    setTimeout(() => { window.location.reload(); }, 100);
  }, [onBack]);
  const handleCloseFailure = useCallback(() => setShowFailureModal(null), []);
  const handleRetryFailure = useCallback(() => {
    setShowFailureModal(null);
    setShowClaimForm(true);
  }, []);

  // Get product image from detailedData
  const productImage = detailedData?.hourlyAuction?.imageUrl || auction.imageUrl || '';
  const totalRounds = detailedData?.rounds?.length || 0;
  const completedRounds = detailedData?.rounds?.filter((r: RoundDetails) => r.status?.toLowerCase() === 'completed').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-purple-50/30 relative overflow-hidden">
      {airpayData && <AirpayForm url={airpayData.url} params={airpayData.params} />}

      {/* ===== HEADER ===== */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative bg-gradient-to-br from-purple-700 via-violet-800 to-indigo-900 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-yellow-300/60 rounded-full animate-pulse" />
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-pink-300/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <div className="relative container mx-auto px-4 py-5 sm:py-6">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to History</span>
            </button>

            <div className="flex gap-4">
              {/* Product Image */}
              {productImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="hidden sm:block flex-shrink-0"
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-white/10">
                    <img src={productImage} alt={auction.prize} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                </motion.div>
              )}

              <div className="flex-1 min-w-0">
                {/* Status + Result */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className={`text-xs font-bold px-2.5 py-0.5 border-0 ${
                    auction.status === 'won'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950'
                      : 'bg-white/15 text-white/90 backdrop-blur-sm'
                  }`}>
                    {auction.status === 'won' ? (
                      <><Crown className="w-3 h-3 mr-1" /> WINNER</>
                    ) : (
                      <><Target className="w-3 h-3 mr-1" /> PARTICIPATED</>
                    )}
                  </Badge>
                  {auction.winnersAnnounced && (
                    <Badge className="bg-green-500/20 text-green-200 border border-green-400/30 text-[10px]">
                      <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Winners Declared
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 leading-tight">{auction.prize}</h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {auction.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-white/30">|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {auction.auctionStartTime} {auction.auctionEndTime ? `→ ${auction.auctionEndTime}` : ''}
                  </span>
                  {auction.hourlyAuctionId && (
                    <>
                      <span className="text-white/30">|</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Hash className="w-2.5 h-2.5" />
                        {auction.hourlyAuctionId.slice(-8)}
                      </span>
                    </>
                  )}
                </div>

                {/* Key stats row */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/15">
                    <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="text-xs text-white/70">Worth</span>
                    <span className="font-bold text-sm flex items-center">
                      <IndianRupee className="w-3 h-3" />{auction.prizeValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {auction.entryFeePaid !== undefined && auction.entryFeePaid > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/15">
                      <Zap className="w-3.5 h-3.5 text-blue-300" />
                      <span className="text-xs text-white/70">Entry</span>
                      <span className="font-bold text-sm flex items-center">
                        <IndianRupee className="w-3 h-3" />{auction.entryFeePaid.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {auction.finalRank && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/15">
                      <Medal className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-xs text-white/70">Rank</span>
                      <span className="font-bold text-sm">#{auction.finalRank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-6 relative z-10 max-w-4xl">

        {/* Loading */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-16">
            <LoadingProfile message="Loading Auction Details" subMessage="Fetching performance data" />
          </motion.div>
        )}

        {/* In Progress */}
        {!isLoading && isAuctionInProgress && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center py-10">
            <Card className="border-2 border-purple-200/60 bg-white/80 backdrop-blur-xl shadow-xl max-w-xl w-full">
              <CardContent className="p-6 sm:p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-purple-900">Auction In Progress</h2>
                <p className="text-sm text-purple-700">Details will be available once the auction is completed.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isLoading && !isAuctionInProgress && (
          <>
            {/* ===== AUCTION OVERVIEW STATS ===== */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl border border-purple-100 p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-purple-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Total Players</span>
                  </div>
                  <p className="text-xl font-bold text-purple-900">{auction.totalParticipants}</p>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                    <Box className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Rounds</span>
                  </div>
                  <p className="text-xl font-bold text-blue-900">{completedRounds}/{totalRounds}</p>
                </div>
                <div className="bg-white rounded-xl border border-green-100 p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-green-500 mb-1">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Your Rounds</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">{auction.roundsParticipated || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-amber-100 p-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Total Bid</span>
                  </div>
                  <p className="text-xl font-bold text-amber-900 flex items-center">
                    <IndianRupee className="w-4 h-4" />{(auction.totalAmountBid || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ===== WINNERS ANNOUNCED BANNER ===== */}
            {auction.winnersAnnounced && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-sm">Winners Announced</h3>
                      <p className="text-xs text-green-700">
                        {winnersAnnouncedEarly
                          ? 'Auction completed early — 3 or fewer qualified players remaining'
                          : 'All rounds completed and winners have been declared'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== WAITING QUEUE BANNER ===== */}
            {isInWaitingQueue() && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow">
                        <HourglassIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 text-sm">
                          {getRankEmoji(auction.finalRank || 1)} You're in the Waiting Queue — Rank {getRankSuffix(auction.finalRank || 1)}
                        </h3>
                        <p className="text-xs text-blue-700">
                          Currently: {getRankSuffix(auction.currentEligibleRank || 1)} place has 15 min to claim. You're #{getQueuePosition()} in queue.
                        </p>
                      </div>
                    </div>
                    {timeLeft && timeLeft !== 'EXPIRED' && (
                      <div className="flex items-center justify-center gap-2 bg-blue-100/80 rounded-lg p-2.5 border border-blue-200">
                        <Clock className="w-4 h-4 text-blue-700" />
                        <span className="text-sm font-bold text-blue-900">Your turn in: {timeLeft}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ===== PRIZE CLAIM SECTION ===== */}
            {auction.isWinner && auction.prizeClaimStatus === 'PENDING' && isCurrentlyEligibleToClaim() && auction.lastRoundBidAmount && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5" onClick={(e) => e.stopPropagation()}>
                <Card className="border-2 border-amber-300/70 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-xl">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                      >
                        <Gift className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-lg font-bold text-amber-900">
                          {getRankEmoji(auction.finalRank || 1)} Your Turn to Claim! Rank {getRankSuffix(auction.finalRank || 1)}
                        </h2>
                        <p className="text-sm text-amber-700">Pay your final round bid to claim the prize</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-amber-900">Final Round Bid</p>
                            <p className="text-[10px] text-amber-700">Pay this to claim</p>
                          </div>
                        </div>
                        <div className="flex items-center font-bold text-xl text-amber-900">
                          <IndianRupee className="w-5 h-5" />
                          {auction.lastRoundBidAmount.toLocaleString('en-IN')}
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
                          onClick={() => setShowClaimForm(true)}
                          disabled={timeLeft === 'EXPIRED' || globalPaymentLoading}
                          className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          {globalPaymentLoading ? 'Processing...' : `Pay ₹${auction.lastRoundBidAmount.toLocaleString('en-IN')} & Claim Prize`}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                            <Label className="text-purple-900 font-semibold text-sm flex items-center gap-2 mb-2">
                              <Gift className="w-4 h-4" /> Prize Delivery Email
                            </Label>
                            <Input type="email" value={userInfo.userEmail} disabled className="bg-white/70 border-purple-300 text-purple-900 font-medium cursor-not-allowed" />
                            <p className="text-xs text-purple-700 mt-2 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>Amazon voucher worth ₹{auction.prizeValue.toLocaleString('en-IN')} will be sent to this email</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={(e) => { e.stopPropagation(); setShowClaimForm(false); }} variant="outline" className="flex-1" disabled={globalPaymentLoading || isProcessing}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleClaimPrize}
                              disabled={globalPaymentLoading || timeLeft === 'EXPIRED' || isProcessing}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" /> Processing...</>
                              ) : (
                                <><IndianRupee className="w-4 h-4 mr-1" /> Pay ₹{auction.lastRoundBidAmount.toLocaleString('en-IN')}</>
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

            {/* ===== AUCTION SOLD OUT BANNER ===== */}
            {auction.claimedBy && auction.claimedByRank && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-green-900">
                        {getRankEmoji(auction.claimedByRank)} Auction Sold Out to {getRankSuffix(auction.claimedByRank)} Winner
                      </h2>
                      <p className="text-xs text-green-700">
                        {auction.claimUpiId === userInfo.userEmail
                          ? 'Congratulations! You won this auction'
                          : 'This auction has been sold out'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-green-200 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">
                        {auction.claimUpiId === userInfo.userEmail
                          ? `Amazon voucher sent to ${maskEmail(userInfo.userEmail)}`
                          : `Sold out to ${maskUsername(auction.claimedBy || '')}`}
                      </span>
                    </div>
                    {auction.claimedAt && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <Clock className="w-3 h-3" />
                        <span>Claimed on {formatTimestamp(auction.claimedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Claimed by self - no claimedBy */}
            {auction.prizeClaimStatus === 'CLAIMED' && auction.claimUpiId === userInfo.userEmail && !auction.claimedBy && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-green-900">
                        {getRankEmoji(auction.finalRank || 1)} Auction Won Successfully!
                      </h2>
                      <p className="text-xs text-green-700">Amazon voucher sent to {maskEmail(userInfo.userEmail)}</p>
                    </div>
                  </div>
                  {auction.claimedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-white/60 rounded px-2 py-1 w-fit">
                      <Clock className="w-3 h-3" />
                      <span>Claimed on {formatTimestamp(auction.claimedAt)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Claimed by other - no claimedBy */}
            {auction.prizeClaimStatus === 'CLAIMED' && auction.claimUpiId && auction.claimUpiId !== userInfo.userEmail && !auction.claimedBy && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-green-900">Auction Sold Out</h2>
                      <p className="text-xs text-green-700">Sold out to {maskEmail(auction.claimedBy || 'Winner')}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Generic claimed */}
            {auction.prizeClaimStatus === 'CLAIMED' && !auction.claimUpiId && !auction.claimedBy && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-green-900">Auction Sold Out!</h2>
                      <p className="text-xs text-green-700">Prize worth ₹{auction.prizeValue.toLocaleString('en-IN')} has been delivered</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Expired claim */}
            {auction.prizeClaimStatus === 'EXPIRED' && !(auction.claimedByRank && auction.claimedByRank < (auction.finalRank || 0)) && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 space-y-3">
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-red-900 text-sm">{getRankEmoji(auction.finalRank || 1)} Your Claim Window Expired</p>
                      <p className="text-xs text-red-700">The 15-minute deadline passed. Prize offered to next winner.</p>
                    </div>
                  </div>
                </div>
                {auction.claimedBy && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center shadow">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-emerald-900 text-sm">
                          {getRankEmoji(auction.claimedByRank || 1)} Auction Sold Out to {getRankSuffix(auction.claimedByRank || 1)} Winner
                        </h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase mb-0.5">Sold To</p>
                        <p className="font-bold text-emerald-900 text-sm">{maskUsername(auction.claimedBy)}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
                        <p className="text-[10px] text-emerald-600 font-semibold uppercase mb-0.5">Sold At</p>
                        <p className="font-bold text-emerald-900 text-sm">{auction.claimedAt ? formatTimestamp(auction.claimedAt) : '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== ROUND-BY-ROUND TIMELINE ===== */}
            {detailedData && detailedData.rounds && detailedData.rounds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-5"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center shadow">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-purple-900 text-base sm:text-lg">Round-by-Round Timeline</h2>
                    <p className="text-[10px] sm:text-xs text-purple-500">Detailed breakdown of every round</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-purple-200 to-purple-100 hidden sm:block" />

                  <div className="space-y-4">
                    {detailedData.rounds.map((round: RoundDetails, index: number) => {
                      const isSkippedRound = winnersAnnouncedEarly && round.roundNumber > 1 && ['pending', 'active', 'upcoming'].includes((round.status || '').toLowerCase());
                      const isExpanded = expandedRounds.has(round.roundNumber);
                      const userParticipated = round.userBid !== null && round.userBid !== undefined;
                      const eliminatedCount = round.totalParticipants - round.qualifiedCount;

                      let roundStatusLabel = round.status;
                      let statusColor = 'bg-gray-100 text-gray-600';
                      if (isSkippedRound) {
                        roundStatusLabel = 'Skipped — Winners Declared';
                        statusColor = 'bg-yellow-100 text-yellow-700';
                      } else if (round.status?.toLowerCase() === 'completed') {
                        roundStatusLabel = 'Completed';
                        statusColor = 'bg-green-100 text-green-700';
                      } else if (round.status?.toLowerCase() === 'active') {
                        roundStatusLabel = 'Active';
                        statusColor = 'bg-blue-100 text-blue-700';
                      }

                      return (
                        <motion.div
                          key={round.roundNumber}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
                          className="relative"
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-3.5 top-5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md z-10 hidden sm:block" style={{
                            background: userParticipated
                              ? (round.userQualified ? '#10b981' : '#8b5cf6')
                              : '#9ca3af'
                          }} />

                          <div className={`sm:ml-12 rounded-xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-md ${
                            userParticipated
                              ? round.userQualified
                                ? 'border-green-200 bg-white'
                                : 'border-purple-200 bg-white'
                              : 'border-gray-200 bg-gray-50/50'
                          }`}>
                            {/* Round Header - Always visible */}
                            <button
                              onClick={() => !isSkippedRound && userParticipated && toggleRoundExpanded(round.roundNumber)}
                              className={`w-full text-left p-3.5 sm:p-4 ${!isSkippedRound && userParticipated ? 'cursor-pointer hover:bg-purple-50/30' : 'cursor-default'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Round number badge */}
                                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow flex-shrink-0 ${
                                    userParticipated
                                      ? round.userQualified
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                        : 'bg-gradient-to-br from-purple-500 to-violet-600'
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                  }`}>
                                    R{round.roundNumber}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h3 className="font-bold text-gray-900 text-sm">Round {round.roundNumber}</h3>
                                      <Badge className={`text-[10px] font-medium px-1.5 py-0 border-0 ${statusColor}`}>
                                        {roundStatusLabel}
                                      </Badge>
                                    </div>

                                    {/* Timestamps */}
                                    {!isSkippedRound && (
                                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{formatTime(round.startedAt)}</span>
                                        {round.completedAt && (
                                          <><span className="text-gray-300">→</span><span>{formatTime(round.completedAt)}</span></>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right side summary */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {userParticipated && !isSkippedRound && (
                                    <div className="flex items-center gap-2">
                                      {/* Quick stats */}
                                      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mr-2">
                                        <span className="flex items-center gap-0.5">
                                          <Users className="w-3 h-3" /> {round.totalParticipants}
                                        </span>
                                        <span className="flex items-center gap-0.5 font-medium text-purple-700">
                                          <IndianRupee className="w-3 h-3" />{round.userBid?.toLocaleString('en-IN')}
                                        </span>
                                        <span className="flex items-center gap-0.5 font-medium text-violet-700">
                                          #{round.userRank || '—'}
                                        </span>
                                      </div>

                                      {round.userQualified ? (
                                        <Badge className="bg-green-500 text-white border-0 text-[10px] px-2">
                                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Qualified
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-100 text-red-700 border-0 text-[10px] px-2">
                                          <XCircle className="w-3 h-3 mr-0.5" /> Eliminated
                                        </Badge>
                                      )}

                                      {!isSkippedRound && (
                                        isExpanded
                                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                          : <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                  )}
                                  {!userParticipated && !isSkippedRound && (
                                    <Badge className="bg-gray-100 text-gray-500 border-0 text-[10px] px-2">
                                      <Lock className="w-3 h-3 mr-0.5" /> Did not participate
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Mobile quick stats */}
                              {userParticipated && !isSkippedRound && (
                                <div className="flex sm:hidden items-center gap-3 mt-2 text-[10px] text-gray-500 pl-[52px]">
                                  <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {round.totalParticipants} players</span>
                                  <span className="flex items-center gap-0.5 font-medium text-purple-700"><IndianRupee className="w-2.5 h-2.5" />{round.userBid?.toLocaleString('en-IN')}</span>
                                  <span className="font-medium text-violet-700">Rank #{round.userRank || '—'}</span>
                                </div>
                              )}
                            </button>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {isExpanded && userParticipated && !isSkippedRound && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3.5 sm:px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      <div className="bg-purple-50/80 rounded-lg p-2.5 border border-purple-100">
                                        <p className="text-[10px] text-purple-500 font-medium uppercase mb-0.5">Participants</p>
                                        <p className="font-bold text-purple-900 text-lg">{round.totalParticipants}</p>
                                      </div>
                                      <div className="bg-green-50/80 rounded-lg p-2.5 border border-green-100">
                                        <p className="text-[10px] text-green-500 font-medium uppercase mb-0.5">Qualified</p>
                                        <p className="font-bold text-green-900 text-lg">{round.qualifiedCount}</p>
                                      </div>
                                      <div className="bg-red-50/80 rounded-lg p-2.5 border border-red-100">
                                        <p className="text-[10px] text-red-500 font-medium uppercase mb-0.5">Eliminated</p>
                                        <p className="font-bold text-red-900 text-lg">{eliminatedCount}</p>
                                      </div>
                                      {round.cutoffPercentage !== undefined && round.cutoffPercentage !== null && (
                                        <div className="bg-amber-50/80 rounded-lg p-2.5 border border-amber-100">
                                          <p className="text-[10px] text-amber-500 font-medium uppercase mb-0.5">Cutoff</p>
                                          <p className="font-bold text-amber-900 text-lg">{round.cutoffPercentage}%</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Bid Range Bar */}
                                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5 text-purple-500" /> Bid Range
                                      </h4>
                                      <div className="flex items-center gap-3">
                                        <div className="text-center">
                                          <p className="text-[10px] text-gray-500 mb-0.5">Lowest</p>
                                          <p className="font-bold text-green-700 text-sm flex items-center justify-center">
                                            <IndianRupee className="w-3 h-3" />{round.lowestBid.toLocaleString('en-IN')}
                                          </p>
                                        </div>
                                        <div className="flex-1 h-2 bg-gradient-to-r from-green-300 via-purple-300 to-red-300 rounded-full relative">
                                          {/* User bid marker */}
                                          {round.userBid && round.highestBid > round.lowestBid && (
                                            <div
                                              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-purple-600 rounded-full shadow-md"
                                              style={{
                                                left: `${Math.min(100, Math.max(0, ((round.userBid - round.lowestBid) / (round.highestBid - round.lowestBid)) * 100))}%`,
                                                transform: 'translate(-50%, -50%)'
                                              }}
                                              title={`Your bid: ₹${round.userBid.toLocaleString('en-IN')}`}
                                            />
                                          )}
                                        </div>
                                        <div className="text-center">
                                          <p className="text-[10px] text-gray-500 mb-0.5">Highest</p>
                                          <p className="font-bold text-red-700 text-sm flex items-center justify-center">
                                            <IndianRupee className="w-3 h-3" />{round.highestBid.toLocaleString('en-IN')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-center mt-1.5">
                                        <p className="text-[10px] text-purple-600 font-medium">
                                          Your Bid: <span className="font-bold">₹{round.userBid?.toLocaleString('en-IN')}</span> · Rank <span className="font-bold">#{round.userRank}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Your Performance */}
                                    <div className={`rounded-lg p-3 border ${
                                      round.userQualified
                                        ? 'bg-green-50/50 border-green-200'
                                        : 'bg-red-50/50 border-red-200'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        {round.userQualified ? (
                                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <div>
                                          <p className={`text-sm font-bold ${round.userQualified ? 'text-green-800' : 'text-red-800'}`}>
                                            {round.userQualified ? 'You Qualified!' : 'You Were Eliminated'}
                                          </p>
                                          <p className={`text-xs ${round.userQualified ? 'text-green-600' : 'text-red-600'}`}>
                                            {round.userQualified
                                              ? `Advanced to ${round.roundNumber < totalRounds ? `Round ${round.roundNumber + 1}` : 'Final Results'}`
                                              : `Your bid of ₹${round.userBid?.toLocaleString('en-IN')} ranked #${round.userRank} — below the cutoff threshold`
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Timestamps */}
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> Started: {formatTimestamp(round.startedAt)}
                                      </span>
                                      {round.completedAt && (
                                        <span className="flex items-center gap-1">
                                          <CheckCircle className="w-2.5 h-2.5" /> Ended: {formatTimestamp(round.completedAt)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== NET PROFIT ===== */}
            {auction.isWinner && auction.lastRoundBidAmount && auction.prizeValue && auction.prizeClaimStatus === 'CLAIMED' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mb-5"
              >
                <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border-2 border-violet-200 rounded-xl p-4 sm:p-5 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-violet-900 text-lg">Your Net Profit</h3>
                      <p className="text-xs text-violet-600">Prize Value - Final Round Bid</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white/80 rounded-xl p-3 border border-violet-200 text-center">
                      <span className="text-[10px] text-violet-500 font-medium uppercase">Prize</span>
                      <p className="font-bold text-violet-900 flex items-center justify-center mt-0.5">
                        <IndianRupee className="w-3.5 h-3.5" /><span className="text-lg">{auction.prizeValue.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 border border-purple-200 text-center">
                      <span className="text-[10px] text-purple-500 font-medium uppercase">Paid</span>
                      <p className="font-bold text-purple-900 flex items-center justify-center mt-0.5">
                        <span className="text-lg">- </span><IndianRupee className="w-3.5 h-3.5" /><span className="text-lg">{auction.lastRoundBidAmount.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-3 text-center shadow-lg">
                      <span className="text-[10px] font-medium uppercase opacity-80">Profit</span>
                      <p className="font-bold flex items-center justify-center mt-0.5">
                        <IndianRupee className="w-3.5 h-3.5" /><span className="text-lg">{netProfit.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <PaymentSuccess
          amount={showSuccessModal.amount}
          type={showSuccessModal.type}
          productName={showSuccessModal.productName}
          productWorth={showSuccessModal.productWorth}
          auctionId={showSuccessModal.auctionId}
          paidBy={showSuccessModal.paidBy}
          paymentMethod={showSuccessModal.paymentMethod}
          onBackToHome={handleCloseSuccess}
          onClose={handleCloseSuccess}
        />
      )}

      {/* Payment Failure Modal */}
      {showFailureModal && (
        <PaymentFailure
          amount={showFailureModal.amount}
          type={showFailureModal.type}
          errorMessage={showFailureModal.errorMessage}
          productName={showFailureModal.productName}
          auctionId={showFailureModal.auctionId}
          paidBy={showFailureModal.paidBy}
          onRetry={handleRetryFailure}
          onBackToHome={handleCloseFailure}
          onClose={handleCloseFailure}
        />
      )}
    </div>
  );
}
