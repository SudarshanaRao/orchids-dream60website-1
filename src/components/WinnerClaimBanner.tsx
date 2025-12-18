import { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles, X, Gift, ChevronRight, AlertTriangle, XCircle } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface UnclaimedPrize {
  hourlyAuctionId: string;
  auctionName: string;
  prizeValue: number;
  prizeClaimStatus: 'PENDING' | 'CLAIMED' | 'EXPIRED';
  claimDeadline?: number;
  winnersAnnouncedAt?: number;
  finalRank: number;
  isCurrentAuction: boolean;
  currentEligibleRank?: number;
  claimWindowStartedAt?: number;
  isEliminated?: boolean;
}

interface WinnerClaimBannerProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export function WinnerClaimBanner({ userId, onNavigate }: WinnerClaimBannerProps) {
    const [unclaimedPrizes, setUnclaimedPrizes] = useState<UnclaimedPrize[]>([]);
    const [lostAuctions, setLostAuctions] = useState<any[]>([]);
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeftText, setTimeLeftText] = useState('');
    const [waitingPosition, setWaitingPosition] = useState<number | null>(null);

    useEffect(() => {
      const fetchUserAuctionStatus = async () => {
        if (!userId) return;

        try {
          const [wonResponse, lostResponse] = await Promise.all([
            fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${userId}&status=won&limit=10`),
            fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${userId}&status=lost&limit=5`)
          ]);
          
          if (wonResponse.ok) {
            const result = await wonResponse.json();
            
            if (result.success && result.data) {
              const now = Date.now();
              const auctions = Array.isArray(result.data) ? result.data : result.data.auctions || [];
              
              // ✅ DEBUG: Log all won auctions to see their status
              console.log('🏆 WinnerClaimBanner - Raw Won Auctions:', auctions.map((a: any) => ({
                id: a.hourlyAuctionId,
                status: a.prizeClaimStatus,
                rank: a.finalRank || a.myRank
              })));

              // ✅ CRITICAL FIX: Explicitly filter out already CLAIMED prizes
              const unclaimed = auctions
                .filter((auction: any) => {
                  const status = (auction.prizeClaimStatus || '').toUpperCase();
                  const isPending = status === 'PENDING';
                  const deadline = auction.claimDeadline ? new Date(auction.claimDeadline).getTime() : null;
                  const isNotExpired = !deadline || deadline > now;
                  
                  // If it's CLAIMED, we definitely don't want it in this list
                  if (status === 'CLAIMED') return false;
                  
                  return isPending && isNotExpired;
                })
                .map((auction: any) => {
                  const winnersAnnouncedAt = auction.winnersAnnouncedAt || auction.auctionEndTime || auction.completedAt;
                  const announcementTime = winnersAnnouncedAt ? new Date(winnersAnnouncedAt).getTime() : now;
                  const isCurrentAuction = (now - announcementTime) < 2 * 60 * 60 * 1000;

                  return {
                    hourlyAuctionId: auction.hourlyAuctionId,
                    auctionName: auction.prize || auction.auctionName,
                    prizeValue: auction.prizeValue || auction.prizeAmountWon,
                    prizeClaimStatus: auction.prizeClaimStatus,
                    claimDeadline: auction.claimDeadline ? new Date(auction.claimDeadline).getTime() : undefined,
                    winnersAnnouncedAt: announcementTime,
                    finalRank: auction.finalRank || auction.myRank,
                    currentEligibleRank: auction.currentEligibleRank,
                    claimWindowStartedAt: auction.claimWindowStartedAt ? new Date(auction.claimWindowStartedAt).getTime() : undefined,
                    isCurrentAuction,
                    isEliminated: auction.isEliminated
                  };
                });

              setUnclaimedPrizes(unclaimed);
              console.log('🏆 WinnerClaimBanner - Unclaimed Prizes:', unclaimed.length);

              const waitingPrizes = unclaimed.filter((p: UnclaimedPrize) => p.finalRank > (p.currentEligibleRank || 0));
              if (waitingPrizes.length > 0) {
                const firstWaiting = waitingPrizes[0];
                setWaitingPosition(firstWaiting.finalRank - (firstWaiting.currentEligibleRank || 0));
              } else {
                setWaitingPosition(null);
              }
            }
          }

        if (lostResponse.ok) {
          const lostResult = await lostResponse.json();
          if (lostResult.success && lostResult.data) {
            const now = Date.now();
            const lostAuctionsList = Array.isArray(lostResult.data) ? lostResult.data : lostResult.data.auctions || [];
            const recentLost = lostAuctionsList.filter((auction: any) => {
              const endTime = auction.auctionEndTime || auction.completedAt;
              if (!endTime) return false;
              const timeSinceEnd = now - new Date(endTime).getTime();
              return timeSinceEnd < 30 * 60 * 1000;
            });
            setLostAuctions(recentLost);
          }
        }
      } catch (error) {
        console.error('Error fetching auction status:', error);
      }
    };

    fetchUserAuctionStatus();
    const interval = setInterval(fetchUserAuctionStatus, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (unclaimedPrizes.length === 0) return;

    const updateTimeLeft = () => {
      const now = Date.now();
      const activeClaims = unclaimedPrizes.filter(p => p.finalRank === p.currentEligibleRank && p.claimDeadline);
      
      if (activeClaims.length > 0) {
        const nearestDeadline = Math.min(...activeClaims.map(p => p.claimDeadline!));
        const diff = nearestDeadline - now;

        if (diff <= 0) {
          setTimeLeftText('Expired');
          return;
        }

        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeftText(`${minutes}m ${seconds}s left`);
      } else {
        const waitingQueue = unclaimedPrizes.filter(p => p.finalRank > (p.currentEligibleRank || 0));
        if (waitingQueue.length > 0) {
          // Calculate estimated waiting time (15 mins per preceding rank)
          const firstWaiting = waitingQueue[0];
          const pos = firstWaiting.finalRank - (firstWaiting.currentEligibleRank || 0);
          setTimeLeftText(`Wait for your turn...`);
        } else {
          setTimeLeftText('');
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [unclaimedPrizes]);

  const isMyTurn = unclaimedPrizes.some(p => p.finalRank === p.currentEligibleRank);
  const isWaiting = unclaimedPrizes.some(p => p.finalRank > (p.currentEligibleRank || 0));
  const hasLostRecently = lostAuctions.length > 0;
  const hasUrgentClaim = unclaimedPrizes.some(p => {
    if (p.finalRank !== p.currentEligibleRank || !p.claimDeadline) return false;
    const timeLeft = p.claimDeadline - Date.now();
    return timeLeft < 5 * 60 * 1000;
  });

  const shouldShow = isVisible && (unclaimedPrizes.length > 0 || hasLostRecently);
  
  // ✅ CRITICAL FIX: If the user has claimed ALL prizes, and doesn't have a recent lost auction, hide the banner
  if (!shouldShow) return null;

  const getBannerConfig = () => {
    if (timeLeftText === 'Expired') {
      return {
        gradient: 'from-amber-600 via-orange-600 to-red-600',
        icon: <AlertTriangle className="w-5 h-5 text-white animate-pulse" />,
        message: `Next time you should hurry up! Your claim window has expired.`,
        buttonText: 'VIEW HISTORY',
        buttonClass: 'bg-white text-orange-600 hover:bg-orange-50'
      };
    }
    if (hasUrgentClaim) {
      return {
        gradient: 'from-red-600 via-orange-500 to-amber-500',
        icon: <Clock className="w-5 h-5 text-white animate-pulse" />,
        message: `URGENT! Claim your prize NOW - Time is running out!`,
        buttonText: 'CLAIM NOW',
        buttonClass: 'bg-white text-red-600 hover:bg-red-50 animate-pulse'
      };
    }
    if (isMyTurn) {
      return {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        icon: <Gift className="w-5 h-5 text-white animate-bounce" />,
        message: `Congratulations! Your prize is ready to claim - Don't miss out!`,
        buttonText: 'CLAIM PRIZE',
        buttonClass: 'bg-white text-emerald-600 hover:bg-emerald-50'
      };
    }
    if (isWaiting) {
      return {
        gradient: 'from-blue-600 via-indigo-500 to-violet-500',
        icon: <Clock className="w-5 h-5 text-white animate-spin-slow" />,
        message: `Wait wait you have a chance to claim the prize! Your turn is coming soon.`,
        buttonText: 'CHECK STATUS',
        buttonClass: 'bg-white text-blue-600 hover:bg-blue-50'
      };
    }
    if (hasLostRecently) {
      return {
        gradient: 'from-red-700 via-red-600 to-rose-600',
        icon: <XCircle className="w-5 h-5 text-white" />,
        message: `You didn't win this auction better luck next time!`,
        buttonText: 'TRY AGAIN',
        buttonClass: 'bg-white text-red-600 hover:bg-red-50'
      };
    }
    return {
      gradient: 'from-purple-600 via-violet-600 to-fuchsia-600',
      icon: <Trophy className="w-5 h-5 text-yellow-300" />,
      message: `You have ${unclaimedPrizes.length} pending prize claim${unclaimedPrizes.length > 1 ? 's' : ''}!`,
      buttonText: 'VIEW PRIZES',
      buttonClass: 'bg-white text-purple-600 hover:bg-purple-50'
    };
  };

  const config = getBannerConfig();

  const handleActionClick = () => {
    if (hasLostRecently && !isMyTurn && !isWaiting && unclaimedPrizes.length === 0) {
      onNavigate('game');
    } else {
      onNavigate('history');
    }
  };

  return (
    <div className="sticky top-[60px] sm:top-[76px] z-[45] w-full overflow-hidden shadow-lg border-b border-white/10">
      <div className={`relative py-3 bg-gradient-to-r ${config.gradient}`}>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="marquee-container overflow-hidden">
          <div className="marquee-content flex items-center whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-10 mx-6">
                <div className="flex items-center gap-3">
                  {config.icon}
                  <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md">
                    {config.message}
                  </span>
                </div>

                {timeLeftText && (
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {timeLeftText}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleActionClick}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase transition-all hover:scale-105 active:scale-95 shadow-lg ${config.buttonClass}`}
                >
                  {config.buttonText}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .marquee-container {
          width: 100%;
        }
        .marquee-content {
          display: flex;
          animation: scroll-marquee 20s linear infinite;
          width: fit-content;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
        @keyframes scroll-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-25%);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
