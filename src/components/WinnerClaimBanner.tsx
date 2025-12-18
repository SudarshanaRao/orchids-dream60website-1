import { useState, useEffect } from 'react';
import { Trophy, Clock, Sparkles, X, Gift, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface UnclaimedPrize {
  hourlyAuctionId: string;
  auctionName: string;
  prizeValue: number;
  prizeClaimStatus: 'PENDING' | 'CLAIMED' | 'EXPIRED';
  claimDeadline: number;
  winnersAnnouncedAt?: number;
  finalRank: number;
  isCurrentAuction: boolean;
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
        
        if (result.success && result.data?.auctions) {
          const now = Date.now();
          const unclaimed = result.data.auctions
            .filter((auction: any) => {
              const isPending = auction.prizeClaimStatus === 'PENDING';
              const deadline = auction.claimDeadline;
              const isNotExpired = deadline && deadline > now;
              return isPending && isNotExpired;
            })
            .map((auction: any) => {
              const winnersAnnouncedAt = auction.winnersAnnouncedAt || auction.auctionEndTime;
              const timeSinceAnnouncement = now - new Date(winnersAnnouncedAt).getTime();
              const isCurrentAuction = timeSinceAnnouncement < 2 * 60 * 60 * 1000;

              return {
                hourlyAuctionId: auction.hourlyAuctionId,
                auctionName: auction.prize || auction.auctionName,
                prizeValue: auction.prizeValue || auction.prizeAmountWon,
                prizeClaimStatus: auction.prizeClaimStatus,
                claimDeadline: auction.claimDeadline,
                winnersAnnouncedAt: new Date(winnersAnnouncedAt).getTime(),
                finalRank: auction.finalRank || auction.myRank,
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
    const interval = setInterval(fetchUnclaimedPrizes, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (unclaimedPrizes.length === 0) return;

    const updateTimeLeft = () => {
      const now = Date.now();
      const nearestDeadline = Math.min(...unclaimedPrizes.map(p => p.claimDeadline));
      const diff = nearestDeadline - now;

      if (diff <= 0) {
        setTimeLeftText('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeftText(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeftText(`${minutes} minutes left`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 30000);
    return () => clearInterval(interval);
  }, [unclaimedPrizes]);

  if (!isVisible || unclaimedPrizes.length === 0) return null;

  const hasCurrentAuctionPrize = unclaimedPrizes.some(p => p.isCurrentAuction);
  const hasUrgentClaim = unclaimedPrizes.some(p => {
    const timeLeft = p.claimDeadline - Date.now();
    return timeLeft < 2 * 60 * 60 * 1000;
  });

  const bannerMessage = hasCurrentAuctionPrize
    ? `Congratulations! Your prize is waiting - Claim Now!`
    : hasUrgentClaim
    ? `Your prize claim window closes soon - Hurry up!`
    : `You have ${unclaimedPrizes.length} unclaimed prize${unclaimedPrizes.length > 1 ? 's' : ''} waiting!`;

  const handleClaimClick = () => {
    onNavigate('history');
  };

  return (
    <div className="sticky top-[64px] z-40 overflow-hidden">
      <div
        className={`relative py-2.5 ${
          hasCurrentAuctionPrize
            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
            : hasUrgentClaim
            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500'
            : 'bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600'
        }`}
      >
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        <div className="flex items-center animate-marquee whitespace-nowrap">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-8">
              <div className="flex items-center gap-2">
                {hasCurrentAuctionPrize ? (
                  <Gift className="w-4 h-4 text-white animate-bounce" />
                ) : hasUrgentClaim ? (
                  <Clock className="w-4 h-4 text-white animate-pulse" />
                ) : (
                  <Trophy className="w-4 h-4 text-yellow-300" />
                )}
                <span className="text-sm font-bold text-white">
                  {bannerMessage}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm text-white/90">
                  {timeLeftText && `(${timeLeftText})`}
                </span>
              </div>

              <button
                onClick={handleClaimClick}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 ${
                  hasCurrentAuctionPrize
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : hasUrgentClaim
                    ? 'bg-white text-orange-600 hover:bg-orange-50'
                    : 'bg-white text-purple-600 hover:bg-purple-50'
                }`}
              >
                Claim Now
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
