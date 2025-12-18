import { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles, X, Gift, ChevronRight } from 'lucide-react';
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
}

interface WinnerClaimBannerProps {
  userId: string;
  onNavigate: (page: string) => void;
}

export function WinnerClaimBanner({ userId, onNavigate }: WinnerClaimBannerProps) {
  const [unclaimedPrizes, setUnclaimedPrizes] = useState<UnclaimedPrize[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeftText, setTimeLeftText] = useState('');

  useEffect(() => {
    const fetchUnclaimedPrizes = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${userId}&status=won&limit=10`
        );
        
        if (!response.ok) return;
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const now = Date.now();
          // The API might return an array directly or inside data.auctions
          const auctions = Array.isArray(result.data) ? result.data : result.data.auctions || [];
          
          const unclaimed = auctions
            .filter((auction: any) => {
              const isPending = auction.prizeClaimStatus === 'PENDING';
              // For waiting queue members, claimDeadline might not be set yet
              const deadline = auction.claimDeadline ? new Date(auction.claimDeadline).getTime() : null;
              const isNotExpired = !deadline || deadline > now;
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
                isCurrentAuction
              };
            });

          setUnclaimedPrizes(unclaimed);
        }
      } catch (error) {
        console.error('Error fetching unclaimed prizes:', error);
      }
    };

    fetchUnclaimedPrizes();
    const interval = setInterval(fetchUnclaimedPrizes, 10000); // Poll more frequently for claim window changes
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
        // Checking for waiting queue
        const waitingQueue = unclaimedPrizes.filter(p => p.finalRank > (p.currentEligibleRank || 0));
        if (waitingQueue.length > 0) {
          setTimeLeftText('Waiting for your turn');
        } else {
          setTimeLeftText('');
        }
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [unclaimedPrizes]);

  if (!isVisible || unclaimedPrizes.length === 0) return null;

  const isMyTurn = unclaimedPrizes.some(p => p.finalRank === p.currentEligibleRank);
  const isWaiting = unclaimedPrizes.some(p => p.finalRank > (p.currentEligibleRank || 0));
  const hasUrgentClaim = unclaimedPrizes.some(p => {
    if (p.finalRank !== p.currentEligibleRank || !p.claimDeadline) return false;
    const timeLeft = p.claimDeadline - Date.now();
    return timeLeft < 5 * 60 * 1000; // Less than 5 mins
  });

  const getBannerMessage = () => {
    if (isMyTurn) {
      return `🎉 Congratulations! It's your turn to claim your prize - Don't miss out!`;
    }
    if (isWaiting) {
      return `⏰ You are in the Waiting Queue - Your turn to claim is coming soon!`;
    }
    return `You have ${unclaimedPrizes.length} pending prize claim${unclaimedPrizes.length > 1 ? 's' : ''}!`;
  };

  const bannerMessage = getBannerMessage();

  const handleClaimClick = () => {
    onNavigate('history');
  };

  return (
    <div className="sticky top-[64px] z-40 overflow-hidden shadow-md">
      <div
        className={`relative py-2.5 transition-colors duration-500 ${
          hasUrgentClaim
            ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-600'
            : isMyTurn
            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
            : isWaiting
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600'
            : 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600'
        }`}
      >
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-center animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 mx-8">
              <div className="flex items-center gap-3">
                {isMyTurn ? (
                  <Gift className="w-5 h-5 text-white animate-bounce" />
                ) : isWaiting ? (
                  <Clock className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Trophy className="w-5 h-5 text-yellow-300" />
                )}
                <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {bannerMessage}
                </span>
              </div>

              {timeLeftText && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full border border-white/30">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    {timeLeftText}
                  </span>
                </div>
              )}

              <button
                onClick={handleClaimClick}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase transition-all hover:scale-110 active:scale-95 shadow-lg ${
                  hasUrgentClaim
                    ? 'bg-white text-red-600 hover:bg-red-50'
                    : isMyTurn
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : isWaiting
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-white text-purple-600 hover:bg-purple-50'
                }`}
              >
                {isMyTurn ? 'Claim Now' : 'Check Status'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
          display: flex;
          width: fit-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
