import { useState, useEffect, useCallback } from 'react';
import { 
  Trophy, 
  Clock, 
  X, 
  ChevronRight, 
  Timer, 
  Gift,
  AlertTriangle,
  History,
  IndianRupee,
  Loader2
} from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { usePrizeClaimPayment } from '../hooks/usePrizeClaimPayment';
import { PaymentSuccess } from './PaymentSuccess';
import { PaymentFailure } from './PaymentFailure';
import { toast } from 'sonner';

interface WinnerClaimBannerProps {
  userId: string;
  onNavigate: (page: string, data?: any) => void;
  serverTime: any;
}

type BannerType = 
  | 'WIN' 
  | 'WAITING' 
  | 'NOT_QUALIFIED' 
  | 'CLAIMED'
  | 'EXPIRED'
  | null;

export function WinnerClaimBanner({ userId, onNavigate, serverTime }: WinnerClaimBannerProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [bannerData, setBannerData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<any | null>(null);
  const [showFailureModal, setShowFailureModal] = useState<any | null>(null);
  
  const { initiatePrizeClaimPayment, loading: paymentLoading } = usePrizeClaimPayment();

  const fetchBannerStatus = useCallback(async () => {
    const effectiveUserId = userId || localStorage.getItem('user_id');
    
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    // ✅ Try to load from cache first for "ASAP" rendering
    const cachedData = localStorage.getItem(`banner_cache_${effectiveUserId}`);
    if (cachedData && isLoading) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Date.now() - parsed.timestamp < 60000) { // 1 minute cache
          setBannerType(parsed.type);
          setBannerData(parsed.data);
          setIsVisible(true);
          setIsLoading(false);
        }
      } catch (e) {}
    }

    try {
      // ✅ Use limit=5 for faster API response
      const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${effectiveUserId}&limit=5`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          const sortedData = [...result.data].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          const latestAuction = sortedData[0];
          const now = serverTime?.timestamp || Date.now();
          const completedAtTime = new Date(latestAuction.completedAt).getTime();
          
          // Slot durations as requested: 15m for 2nd, 30m for 3rd (cumulative)
          // This implies 15m slots for each rank
          const SLOT_DURATION = 15 * 60 * 1000;
          const totalBannerVisibility = 45 * 60 * 1000; // Show for 45 minutes total
          const isWithinBannerTime = (now - completedAtTime) < totalBannerVisibility;

          if (isWithinBannerTime) {
            let status: BannerType = 'NOT_QUALIFIED';
            const rank = latestAuction.finalRank;
            const currentEligibleRank = latestAuction.currentEligibleRank || 1;
            const claimNotes = latestAuction.claimNotes || '';
            const isWinner = latestAuction.isWinner;

            // 1. Keyword Check (Priority)
            if (claimNotes.toLowerCase().includes('successfully') || latestAuction.claimedAt) {
              status = 'CLAIMED';
            } 
            else if (claimNotes.toLowerCase().includes('expired') || claimNotes.toLowerCase().includes('forfeited')) {
              status = 'EXPIRED';
            }
            // 2. Winner Status Check
            else if (isWinner && [1, 2, 3].includes(rank)) {
              if (rank === currentEligibleRank) {
                status = 'WIN';
              } else if (rank > currentEligibleRank) {
                status = 'WAITING';
              } else {
                status = 'EXPIRED';
              }
            } else {
              status = 'NOT_QUALIFIED';
            }

            // 3. Deadline Calculation
            let deadline = completedAtTime + (currentEligibleRank * SLOT_DURATION);
            let timerLabel = "EXPIRES IN";

            if (status === 'WAITING') {
              deadline = completedAtTime + ((rank - 1) * SLOT_DURATION);
              timerLabel = "STARTS IN";
            } else if (status === 'CLAIMED' || status === 'EXPIRED' || status === 'NOT_QUALIFIED') {
              deadline = completedAtTime + totalBannerVisibility;
              timerLabel = "BANNER ENDS";
            }

            const closedKey = `closed_banner_${latestAuction._id}_${latestAuction.completedAt}_${status}`;
            
            if (localStorage.getItem(closedKey) !== 'true') {
                const newBannerData = {
                  ...latestAuction,
                  resultStatus: status,
                  resultAnnouncedAt: latestAuction.completedAt,
                  queuePosition: rank || (latestAuction.eliminatedInRound ? `Eliminated R${latestAuction.eliminatedInRound}` : 'N/A'),
                  deadline: deadline,
                  timerLabel: timerLabel,
                  claimedByRank: latestAuction.claimedByRank,
                  claimNotes: claimNotes,
                  hourlyAuctionId: latestAuction.hourlyAuctionId,
                  lastRoundBidAmount: latestAuction.lastRoundBidAmount,
                  prizeValue: latestAuction.prizeValue
                };

              setBannerType(status);
              setBannerData(newBannerData);
              setIsVisible(true);

              // ✅ Cache the result
              localStorage.setItem(`banner_cache_${effectiveUserId}`, JSON.stringify({
                type: status,
                data: newBannerData,
                timestamp: Date.now()
              }));
            } else {
              setIsVisible(false);
            }
          } else {
            setIsVisible(false);
            setBannerType(null);
            localStorage.removeItem(`banner_cache_${effectiveUserId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching banner status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, serverTime, isLoading]);

  useEffect(() => {
    fetchBannerStatus();
    const interval = setInterval(fetchBannerStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchBannerStatus]);

  useEffect(() => {
    if (!bannerData || !serverTime) return;

    const updateTimer = () => {
      const now = serverTime.timestamp || Date.now();
      const expiresAt = bannerData.deadline;
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsVisible(false);
        setBannerType(null);
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bannerData, serverTime]);

  const handleClose = () => {
    setIsVisible(false);
    if (bannerData) {
      const closedKey = `closed_banner_${bannerData._id}_${bannerData.completedAt}_${bannerType}`;
      localStorage.setItem(closedKey, 'true');
    }
  };

  const handleClaimNow = async () => {
    if (bannerType !== 'WIN' || !bannerData) return;
    
    const effectiveUserId = userId || localStorage.getItem('user_id');
    if (!effectiveUserId) {
      toast.error('Please login to claim your prize');
      return;
    }

    if (!bannerData.hourlyAuctionId) {
      toast.error('Missing auction information. Please try from Auction History.');
      return;
    }

    if (!bannerData.lastRoundBidAmount || bannerData.lastRoundBidAmount <= 0) {
      toast.error('Invalid bid amount. Please contact support.');
      return;
    }

    setIsProcessingClaim(true);

    try {
      const profileResponse = await fetch(`${API_ENDPOINTS.auth.me.profile}?user_id=${effectiveUserId}`);
      let userProfile = { mobile: '', email: '', username: '' };
      
      if (profileResponse.ok) {
        const result = await profileResponse.json();
        if (result.success && result.profile) {
          userProfile = {
            mobile: result.profile.mobile || localStorage.getItem('user_mobile') || '9999999999',
            email: result.profile.email || localStorage.getItem('user_email') || '',
            username: result.profile.username || localStorage.getItem('user_name') || '',
          };
        }
      }

      if (!userProfile.email) {
        userProfile.email = localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      }
      if (!userProfile.username) {
        userProfile.username = localStorage.getItem('user_name') || 'Winner';
      }

      if (!userProfile.email) {
        toast.error('Email not found. Please update your profile.');
        setIsProcessingClaim(false);
        return;
      }

      initiatePrizeClaimPayment(
        {
          userId: effectiveUserId,
          hourlyAuctionId: bannerData.hourlyAuctionId,
          amount: bannerData.lastRoundBidAmount,
          currency: 'INR',
          username: userProfile.username,
        },
        {
          name: userProfile.username,
          email: userProfile.email,
          contact: userProfile.mobile || '9999999999',
          upiId: userProfile.email,
        },
        async (response) => {
          setShowSuccessModal({
            amount: bannerData.lastRoundBidAmount,
            type: 'claim',
            productName: bannerData.auctionName,
            productWorth: bannerData.prizeValue,
            auctionId: bannerData.hourlyAuctionId,
            paidBy: userProfile.username,
            paymentMethod: response.data?.upiId ? `UPI (${response.data.upiId})` : 'UPI / Card'
          });

          setBannerType('CLAIMED');
          setBannerData((prev: any) => ({
            ...prev,
            prizeClaimStatus: 'CLAIMED',
            claimedAt: Date.now(),
            claimedBy: userProfile.username,
            claimUpiId: userProfile.email,
            claimedByRank: prev.finalRank
          }));
          
            toast.success('🎉 Prize Claimed Successfully!', {
              description: `Amazon voucher details will be sent to ${userProfile.email}`,
              duration: 3000,
            });
          
          setIsProcessingClaim(false);
          
          localStorage.removeItem(`banner_cache_${effectiveUserId}`);
        },
        (error) => {
          setShowFailureModal({
            amount: bannerData.lastRoundBidAmount,
            type: 'claim',
            errorMessage: error || 'Failed to process prize claim payment',
            productName: bannerData.auctionName,
            auctionId: bannerData.hourlyAuctionId,
            paidBy: userProfile.username
          });

          toast.error('Payment Failed', {
            description: error || 'Failed to process prize claim payment',
          });
          setIsProcessingClaim(false);
        }
      );
    } catch (error) {
      console.error('Error initiating prize claim payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setIsProcessingClaim(false);
    }
  };

  if (isLoading || !isVisible || !bannerType || bannerType === 'QUALIFIED') return null;

  const getBannerConfig = () => {
    switch (bannerType) {
      case 'WIN':
        return {
          gradient: 'from-emerald-600 via-green-500 to-teal-600',
          icon: <Trophy className="w-5 h-5 text-white" />,
          message: `🎉 CONGRATULATIONS! YOU ARE CURRENTLY ELIGIBLE TO CLAIM THE "${bannerData.auctionName.toUpperCase()}" PRIZE! CLAIM IT NOW!`,
          buttonText: "CLAIM NOW",
          navigateTo: "history",
          timerLabel: "EXPIRES IN"
        };
      case 'WAITING':
        return {
          gradient: 'from-blue-700 via-indigo-600 to-violet-700',
          icon: <Clock className="w-5 h-5 text-white" />,
          message: `⏳ YOU ARE IN THE WAITING LIST FOR "${bannerData.auctionName.toUpperCase()}". YOUR RANK IS #${bannerData.finalRank}. CURRENTLY RANK #${bannerData.currentEligibleRank} IS CLAIMING.`,
          buttonText: "CHECK STATUS",
          navigateTo: "history",
          timerLabel: "STARTS IN"
        };
      case 'CLAIMED':
        const claimedBy = bannerData.claimedByRank ? `RANK #${bannerData.claimedByRank}` : 'ANOTHER WINNER';
        return {
          gradient: 'from-purple-800 via-violet-700 to-indigo-800',
          icon: <Gift className="w-5 h-5 text-white" />,
          message: `🎁 THE PRIZE FOR "${bannerData.auctionName.toUpperCase()}" HAS BEEN CLAIMED BY ${claimedBy}. ${bannerData.claimNotes || ''}`,
          buttonText: "VIEW DETAILS",
          navigateTo: "history",
          timerLabel: "BANNER ENDS"
        };
      case 'EXPIRED':
        return {
          gradient: 'from-red-800 via-rose-700 to-orange-800',
          icon: <Timer className="w-5 h-5 text-white" />,
          message: `⚠️ THE CLAIM PERIOD FOR "${bannerData.auctionName.toUpperCase()}" HAS EXPIRED OR BEEN FORFEITED. ${bannerData.claimNotes || ''}`,
          buttonText: "VIEW HISTORY",
          navigateTo: "history",
          timerLabel: "BANNER ENDS"
        };
      case 'NOT_QUALIFIED':
        return {
          gradient: 'from-slate-800 via-zinc-700 to-gray-800',
          icon: <X className="w-5 h-5 text-white" />,
          message: `📢 "${bannerData.auctionName.toUpperCase()}" RESULTS: YOU RANKED #${bannerData.finalRank || bannerData.queuePosition}. BETTER LUCK NEXT TIME!`,
          buttonText: "VIEW DETAILS",
          navigateTo: "history",
          timerLabel: "EXPIRES IN"
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

    return (
      <>
      <div className="sticky top-[60px] sm:top-[76px] z-[45] w-full overflow-hidden shadow-2xl border-b border-white/20">
        <div className={`relative h-12 flex items-center bg-gradient-to-r ${config.gradient}`}>
          
          {/* Marquee Container */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative group">
          <div className="flex items-center gap-4 whitespace-nowrap animate-marquee px-4">
            {/* Repeated text for seamless loop - using 8 copies for absolute continuity */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 mr-12 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                    {config.icon}
                  </div>
                  <span className="text-sm sm:text-[15px] font-black text-white tracking-tight uppercase italic drop-shadow-sm">
                    {config.message}
                  </span>
                </div>
                
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md shadow-inner">
                    <Timer className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-xs font-extrabold text-white tabular-nums tracking-wider">
                      {bannerData.timerLabel || config.timerLabel}: {timeLeft}
                    </span>
                  </div>

                {bannerType === 'WIN' ? (
                  <button
                    onClick={handleClaimNow}
                    disabled={isProcessingClaim || paymentLoading}
                    className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase bg-white text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-white/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isProcessingClaim || paymentLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <>
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>PAY ₹{bannerData.lastRoundBidAmount?.toLocaleString('en-IN') || '0'} & CLAIM</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(config.navigateTo)}
                    className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase bg-white text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-white/20"
                  >
                    {config.buttonText}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <div className="h-4 w-[2px] bg-white/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="relative z-10 px-4 h-full flex items-center bg-black/10 hover:bg-black/20 transition-colors border-l border-white/10"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-12.5%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>

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
            onBackToHome={() => {
              setShowSuccessModal(null);
              onNavigate('history');
              // ✅ REFRESH PAGE after a small delay to ensure everything is perfectly synced
              // This matches the behavior of the entry fee success modal
              console.log('🔄 Reloading page after prize claim success to ensure fresh state');
              setTimeout(() => {
                window.location.reload();
              }, 100);
            }}
        onClose={() => setShowSuccessModal(null)}
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
        onRetry={() => {
          setShowFailureModal(null);
          handleClaimNow();
        }}
        onBackToHome={() => setShowFailureModal(null)}
        onClose={() => setShowFailureModal(null)}
      />
    )}
    </>
  );
}
