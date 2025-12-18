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
  currentEligibleRank?: number;
  isWaiting?: boolean;
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
        // Fetch winners first
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
              // If it's a waiting user, deadline might not be set yet or might be in the future
              const isNotExpired = !deadline || deadline > now;
              return isPending && isNotExpired;
            })
            .map((auction: any) => {
              const winnersAnnouncedAt = auction.winnersAnnouncedAt || auction.auctionEndTime;
              const timeSinceAnnouncement = now - new Date(winnersAnnouncedAt).getTime();
              const isCurrentAuction = timeSinceAnnouncement < 2 * 60 * 60 * 1000;
              
              // Logic for waiting queue
              const finalRank = auction.finalRank || auction.myRank || 1;
              const currentEligibleRank = auction.currentEligibleRank || 1;
              const isWaiting = finalRank > currentEligibleRank;

              return {
                hourlyAuctionId: auction.hourlyAuctionId,
                auctionName: auction.prize || auction.auctionName,
                prizeValue: auction.prizeValue || auction.prizeAmountWon,
                prizeClaimStatus: auction.prizeClaimStatus,
                claimDeadline: auction.claimDeadline,
                winnersAnnouncedAt: new Date(winnersAnnouncedAt).getTime(),
                finalRank,
                isCurrentAuction,
                currentEligibleRank,
                isWaiting
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
      // Only consider prizes that are NOT waiting for deadline
      const prizesWithDeadlines = unclaimedPrizes.filter(p => p.claimDeadline && !p.isWaiting);
      
      if (prizesWithDeadlines.length === 0) {
        // If all are waiting, show waiting message
        setTimeLeftText('Waiting for turn');
        return;
      }

      const nearestDeadline = Math.min(...prizesWithDeadlines.map(p => p.claimDeadline));
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

  const hasWaitingMember = unclaimedPrizes.some(p => p.isWaiting);
  const hasCurrentAuctionPrize = unclaimedPrizes.some(p => p.isCurrentAuction && !p.isWaiting);
  const hasUrgentClaim = unclaimedPrizes.some(p => {
    if (p.isWaiting || !p.claimDeadline) return false;
    const timeLeft = p.claimDeadline - Date.now();
    return timeLeft < 2 * 60 * 60 * 1000;
  });

  let bannerMessage = '';
  if (hasCurrentAuctionPrize) {
    bannerMessage = `Congratulations! Your prize is waiting - Claim Now!`;
  } else if (hasUrgentClaim) {
    bannerMessage = `Your prize claim window closes soon - Hurry up!`;
  } else if (hasWaitingMember) {
    bannerMessage = `You're in the winners queue! Waiting for your turn to claim.`;
  } else {
    bannerMessage = `You have ${unclaimedPrizes.length} unclaimed prize${unclaimedPrizes.length > 1 ? 's' : ''} waiting!`;
  }

  const handleClaimClick = () => {
    onNavigate('history');
  };

  return (
    <div className="sticky top-[64px] sm:top-[72px] z-[40] w-full border-b border-white/20 shadow-xl overflow-hidden">
      <div
        className={`relative py-3 sm:py-4 flex items-center transition-all duration-500 ${
          hasCurrentAuctionPrize
            ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            : hasUrgentClaim
            ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-red-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            : hasWaitingMember
            ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]'
            : 'bg-gradient-to-r from-purple-700 via-violet-600 to-fuchsia-700 shadow-[0_0_20px_rgba(124,58,237,0.4)]'
        }`}
      >
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 transition-all z-50 group border border-white/10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 text-white group-hover:scale-110" />
        </button>

        <div className="flex items-center animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-12 mx-6 sm:mx-12">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  {hasCurrentAuctionPrize ? (
                    <Gift className="w-5 h-5 text-white animate-bounce" />
                  ) : hasUrgentClaim ? (
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                  ) : hasWaitingMember ? (
                    <Users className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Trophy className="w-5 h-5 text-yellow-300" />
                  )}
                </div>
                <span className="text-sm sm:text-base font-black text-white tracking-wide uppercase drop-shadow-md">
                  {bannerMessage}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-sm font-bold text-white/95 bg-black/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                  {timeLeftText}
                </span>
              </div>

              <button
                onClick={handleClaimClick}
                className={`flex items-center gap-2 px-5 py-1.5 rounded-xl text-sm font-black transition-all hover:scale-105 shadow-lg active:scale-95 ${
                  hasCurrentAuctionPrize
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : hasUrgentClaim
                    ? 'bg-white text-orange-700 hover:bg-orange-50'
                    : hasWaitingMember
                    ? 'bg-white text-blue-700 hover:bg-blue-50'
                    : 'bg-white text-purple-700 hover:bg-purple-50'
                }`}
              >
                {hasWaitingMember ? 'View Queue' : 'Claim Now'}
                <ChevronRight className="w-4 h-4" />
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
            transform: translateX(-25%);
          }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
