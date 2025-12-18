import { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, Sparkles, X, Gift, ChevronRight, AlertTriangle, XCircle, Users, Award, Timer } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface Winner {
  rank: number;
  playerId: string;
  playerUsername: string;
  finalAuctionAmount: number;
  prizeAmount: number;
  isPrizeClaimed: boolean;
  prizeClaimStatus: 'PENDING' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  prizeClaimedAt?: string;
  prizeClaimedBy?: string;
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

interface RoundData {
  roundNumber: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
  qualifiedPlayers: string[];
  playersData: Array<{
    playerId: string;
    playerUsername: string;
    auctionPlacedAmount: number;
    isQualified: boolean;
    rank: number;
  }>;
}

interface LiveAuctionData {
  hourlyAuctionId: string;
  auctionName: string;
  prizeValue: number;
  Status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  winnersAnnounced: boolean;
  currentRound: number;
  roundCount: number;
  participants: Participant[];
  rounds: RoundData[];
  winners: Winner[];
  winnerId?: string;
  winnerUsername?: string;
  completedAt?: string;
}

interface WinnerClaimBannerProps {
  userId: string;
  onNavigate: (page: string) => void;
}

type BannerType = 
  | 'WINNER_CLAIM' 
  | 'WINNER_WAITING' 
  | 'ELIMINATED' 
  | 'QUALIFIED_NEXT_ROUND' 
  | 'MISSED_BID' 
  | 'PRIZE_CLAIMED'
  | 'NOT_PARTICIPANT'
  | null;

const getISTNow = () => Date.now();

export function WinnerClaimBanner({ userId, onNavigate }: WinnerClaimBannerProps) {
  const [liveAuction, setLiveAuction] = useState<LiveAuctionData | null>(null);
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [bannerData, setBannerData] = useState<{
    message: string;
    subMessage?: string;
    rank?: number;
    timeLeft?: string;
    winnerName?: string;
    participants?: number;
    qualified?: number;
  }>({ message: '' });
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  const fetchLiveAuction = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduler.liveAuction}`);
      if (!response.ok) {
        setLiveAuction(null);
        setBannerType(null);
        return;
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        setLiveAuction(null);
        setBannerType(null);
        return;
      }

      setLiveAuction(result.data);
      determineUserStatus(result.data);
    } catch (error) {
      console.error('Error fetching live auction:', error);
      setLiveAuction(null);
      setBannerType(null);
    }
  }, [userId]);

  const determineUserStatus = (auction: LiveAuctionData) => {
    if (!auction || !userId) {
      setBannerType(null);
      return;
    }

    const participant = auction.participants?.find(p => p.playerId === userId);
    const isParticipant = !!participant;
    const completedRounds = auction.rounds?.filter(r => r.status === 'COMPLETED') || [];
    const latestCompletedRound = completedRounds.length > 0 
      ? Math.max(...completedRounds.map(r => r.roundNumber)) 
      : 0;
    const totalParticipants = auction.participants?.length || 0;
    const lastRound = completedRounds.find(r => r.roundNumber === latestCompletedRound);
    const qualifiedCount = lastRound?.qualifiedPlayers?.length || 0;

    if (auction.winnersAnnounced && auction.winners && auction.winners.length > 0) {
      const userWinner = auction.winners.find(w => w.playerId === userId);
      const claimedWinner = auction.winners.find(w => w.isPrizeClaimed);

      if (claimedWinner) {
        setBannerType('PRIZE_CLAIMED');
        setBannerData({
          message: `Prize claimed by ${claimedWinner.playerUsername}!`,
          subMessage: claimedWinner.playerId === userId 
            ? 'Congratulations! Check your email for voucher details.' 
            : 'Better luck next time!',
          winnerName: claimedWinner.playerUsername,
          rank: claimedWinner.rank,
          participants: totalParticipants,
          qualified: qualifiedCount
        });
        return;
      }

      if (userWinner) {
        const rank = userWinner.rank;
        const completedAt = auction.completedAt ? new Date(auction.completedAt).getTime() : Date.now();
        const claimWindowStart = completedAt + ((rank - 1) * 15 * 60 * 1000);
        const claimDeadline = claimWindowStart + (15 * 60 * 1000);
        const now = getISTNow();

        if (rank === 1) {
          const timeRemaining = claimDeadline - now;
          setTimeLeftMs(timeRemaining > 0 ? timeRemaining : 0);
          setBannerType('WINNER_CLAIM');
          setBannerData({
            message: `🏆 Congratulations! You won ${getRankSuffix(rank)} place!`,
            subMessage: 'Claim your prize now - Clock is ticking!',
            rank,
            participants: totalParticipants,
            qualified: qualifiedCount
          });
        } else {
          const waitTime = claimWindowStart - now;
          setTimeLeftMs(waitTime > 0 ? waitTime : 0);
          setBannerType('WINNER_WAITING');
          setBannerData({
            message: `🎉 You won ${getRankSuffix(rank)} place!`,
            subMessage: `Waiting for ${rank === 2 ? '1st' : '1st & 2nd'} place winner(s) to claim`,
            rank,
            participants: totalParticipants,
            qualified: qualifiedCount
          });
        }
        return;
      }

      if (isParticipant) {
        setBannerType('ELIMINATED');
        setBannerData({
          message: 'Winners Announced - Better luck next time!',
          subMessage: `Winner: ${auction.winners[0]?.playerUsername || 'TBD'}`,
          participants: totalParticipants,
          qualified: qualifiedCount
        });
        return;
      }
    }

    if (auction.winnersAnnounced && qualifiedCount <= 3 && qualifiedCount > 0) {
      const userInQualified = lastRound?.qualifiedPlayers?.includes(userId);
      
      if (userInQualified) {
        const userRank = lastRound?.playersData?.find(p => p.playerId === userId)?.rank || 0;
        setBannerType('WINNER_CLAIM');
        setBannerData({
          message: `🏆 Congratulations! You qualified as ${getRankSuffix(userRank)}!`,
          subMessage: 'Go to Auction History to claim your prize',
          rank: userRank,
          participants: totalParticipants,
          qualified: qualifiedCount
        });
        return;
      }

      if (isParticipant) {
        setBannerType('ELIMINATED');
        setBannerData({
          message: 'You are eliminated - Winners Announced!',
          subMessage: 'Better luck in the next auction',
          participants: totalParticipants,
          qualified: qualifiedCount
        });
        return;
      }
    }

    if (!isParticipant) {
      setBannerType(null);
      return;
    }

    if (participant.isEliminated) {
      if (participant.totalBidsPlaced === 0) {
        setBannerType('MISSED_BID');
        setBannerData({
          message: 'Oops! Sorry, better luck next time!',
          subMessage: `Round is closed - You cannot bid. You are eliminated from the auction.`,
          participants: totalParticipants,
          qualified: qualifiedCount
        });
      } else {
        setBannerType('ELIMINATED');
        setBannerData({
          message: `Eliminated in Round ${participant.eliminatedInRound || latestCompletedRound}`,
          subMessage: 'Your bid was not high enough. Better luck next time!',
          participants: totalParticipants,
          qualified: qualifiedCount
        });
      }
      return;
    }

    if (latestCompletedRound > 0 && qualifiedCount > 3) {
      const userQualified = lastRound?.qualifiedPlayers?.includes(userId);
      
      if (userQualified) {
        setBannerType('QUALIFIED_NEXT_ROUND');
        setBannerData({
          message: `✅ Qualified for Round ${latestCompletedRound + 1}!`,
          subMessage: 'Place your bid in the next round to win!',
          participants: totalParticipants,
          qualified: qualifiedCount
        });
      } else {
        setBannerType('ELIMINATED');
        setBannerData({
          message: `Eliminated in Round ${latestCompletedRound}`,
          subMessage: 'Your bid was not high enough. Better luck next time!',
          participants: totalParticipants,
          qualified: qualifiedCount
        });
      }
      return;
    }

    setBannerType(null);
  };

  useEffect(() => {
    fetchLiveAuction();
    const interval = setInterval(fetchLiveAuction, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveAuction]);

  useEffect(() => {
    if (bannerType !== 'WINNER_CLAIM' && bannerType !== 'WINNER_WAITING') return;
    if (timeLeftMs <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftMs(prev => {
        const newVal = prev - 1000;
        return newVal > 0 ? newVal : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bannerType, timeLeftMs]);

  const formatTimeLeft = (ms: number): string => {
    if (ms <= 0) return 'Expired';
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  if (!isVisible || !bannerType) return null;

  const getBannerConfig = () => {
    switch (bannerType) {
      case 'WINNER_CLAIM':
        return {
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          icon: <Gift className="w-5 h-5 text-white animate-bounce" />,
          buttonText: 'CLAIM PRIZE',
          buttonClass: 'bg-white text-emerald-600 hover:bg-emerald-50',
          navigateTo: 'history'
        };

      case 'WINNER_WAITING':
        return {
          gradient: 'from-blue-600 via-indigo-500 to-violet-500',
          icon: <Clock className="w-5 h-5 text-white animate-spin-slow" />,
          buttonText: 'CHECK STATUS',
          buttonClass: 'bg-white text-blue-600 hover:bg-blue-50',
          navigateTo: 'history'
        };

      case 'ELIMINATED':
        return {
          gradient: 'from-gray-700 via-gray-600 to-gray-800',
          icon: <XCircle className="w-5 h-5 text-white" />,
          buttonText: 'TRY AGAIN',
          buttonClass: 'bg-white text-gray-700 hover:bg-gray-50',
          navigateTo: 'game'
        };

      case 'QUALIFIED_NEXT_ROUND':
        return {
          gradient: 'from-indigo-600 via-purple-600 to-pink-600',
          icon: <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />,
          buttonText: 'BID NOW',
          buttonClass: 'bg-white text-indigo-600 hover:bg-indigo-50',
          navigateTo: 'game'
        };

      case 'MISSED_BID':
        return {
          gradient: 'from-rose-600 via-red-600 to-orange-600',
          icon: <AlertTriangle className="w-5 h-5 text-white animate-pulse" />,
          buttonText: 'TRY NEXT',
          buttonClass: 'bg-white text-red-600 hover:bg-red-50',
          navigateTo: 'game'
        };

      case 'PRIZE_CLAIMED':
        return {
          gradient: 'from-amber-500 via-yellow-500 to-orange-500',
          icon: <Trophy className="w-5 h-5 text-white" />,
          buttonText: 'VIEW HISTORY',
          buttonClass: 'bg-white text-amber-600 hover:bg-amber-50',
          navigateTo: 'history'
        };

      default:
        return {
          gradient: 'from-purple-600 via-violet-600 to-fuchsia-600',
          icon: <Trophy className="w-5 h-5 text-yellow-300" />,
          buttonText: 'VIEW',
          buttonClass: 'bg-white text-purple-600 hover:bg-purple-50',
          navigateTo: 'game'
        };
    }
  };

  const config = getBannerConfig();
  const timeDisplay = formatTimeLeft(timeLeftMs);

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
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-bold text-white tracking-wide drop-shadow-md">
                      {bannerData.message}
                    </span>
                    {bannerData.subMessage && (
                      <span className="text-xs text-white/80">
                        {bannerData.subMessage}
                      </span>
                    )}
                  </div>
                </div>

                {bannerData.participants !== undefined && (
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                    <Users className="w-4 h-4 text-white/80" />
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {bannerData.participants} players
                    </span>
                  </div>
                )}

                {(bannerType === 'WINNER_CLAIM' || bannerType === 'WINNER_WAITING') && timeLeftMs > 0 && (
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                    <Timer className="w-4 h-4 text-yellow-300 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {bannerType === 'WINNER_WAITING' ? 'Wait: ' : ''}{timeDisplay}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => onNavigate(config.navigateTo)}
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
          animation: scroll-marquee 25s linear infinite;
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
