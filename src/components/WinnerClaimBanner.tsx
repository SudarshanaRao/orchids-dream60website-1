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

// Helper to get IST-adjusted current time for comparison with backend timestamps
const getISTNow = () => Date.now() + (5.5 * 60 * 60 * 1000);

export function WinnerClaimBanner({ userId, onNavigate }: WinnerClaimBannerProps) {
    const [unclaimedPrizes, setUnclaimedPrizes] = useState<UnclaimedPrize[]>([]);
    const [lostAuctions, setLostAuctions] = useState<any[]>([]);
    const [liveStatus, setLiveStatus] = useState<{
      message: string;
      type: 'QUALIFIED' | 'ELIMINATED' | 'BID_NOW' | 'WINNERS_ANNOUNCED';
      round: number;
      stats?: {
        participants: number;
        qualified: number;
        winners: Array<{ name: string; rank: number; claimed: boolean }>;
      };
    } | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [timeLeftText, setTimeLeftText] = useState('');
    const [waitingMessage, setWaitingMessage] = useState<string>('');

    useEffect(() => {
      const fetchUserAuctionStatus = async () => {
        if (!userId) return;

        try {
          // 1. Fetch live auction status for participants
          const liveAuctionResponse = await fetch(`${API_ENDPOINTS.scheduler.liveAuction}`);
          if (liveAuctionResponse.ok) {
            const liveAuctionResult = await liveAuctionResponse.json();
            if (liveAuctionResult.success && liveAuctionResult.data) {
              const liveAuction = liveAuctionResult.data;
              const detailsResponse = await fetch(`${API_ENDPOINTS.scheduler.auctionDetails}?hourlyAuctionId=${liveAuction.hourlyAuctionId}&userId=${userId}`);
              
              if (detailsResponse.ok) {
                const detailsResult = await detailsResponse.json();
                if (detailsResult.success) {
                  const { auction, rounds } = detailsResult.data;
                  
                    // 1. Get completed rounds to determine "Announced" status
                    const completedRounds = rounds.filter((r: any) => r.status === 'COMPLETED');
                    const latestCompletedRound = completedRounds.length > 0 
                      ? Math.max(...completedRounds.map((r: any) => r.roundNumber)) 
                      : 0;
                    
                    const lastRoundResults = latestCompletedRound > 0 
                      ? rounds.find((r: any) => r.roundNumber === latestCompletedRound)
                      : null;

                    // Extract stats for the banner
                    const participantsCount = auction.participants?.length || 0;
                    const qualifiedCount = lastRoundResults?.qualifiedPlayers?.length || 0;
                    const winnersStats = (auction.winners || []).map((w: any) => ({
                      name: w.playerUsername,
                      rank: w.rank,
                      claimed: w.isPrizeClaimed
                    }));

                    const stats = {
                      participants: participantsCount,
                      qualified: qualifiedCount,
                      winners: winnersStats
                    };

                    const claimedNames = winnersStats
                      .filter(w => w.claimed)
                      .map(w => w.name)
                      .join(', ');

                    const winnerMsgPart = winnersStats.length > 0 
                      ? ` | Winners: ${winnersStats.map(w => `${w.name} (Rank ${w.rank}${w.claimed ? ' - CLAIMED' : ''})`).join(', ')}`
                      : '';
                    const statsMsgPart = ` | Participants: ${participantsCount} | Qualified: ${qualifiedCount}`;

                    // If winners are announced, we clear live status and let the winner/lost logic take over
                    // We check for winnersAnnounced flag, COMPLETED status, or if we are at the final stage (<=3 qualified)
                    const isFinalStage = lastRoundResults && lastRoundResults.qualifiedCount > 0 && lastRoundResults.qualifiedCount <= 3;
                    
                    if (auction.winnersAnnounced || auction.status === 'COMPLETED' || (auction.winners && auction.winners.length > 0) || isFinalStage) {
                      // Check if user is a winner
                      const isWinner = auction.winners?.some((w: any) => w.playerId === userId) || 
                                     (isFinalStage && lastRoundResults?.userQualified);
                      
                      if (!isWinner) {
                        setLiveStatus({
                          message: `Winners Announced - Better luck next time!${winnerMsgPart}${statsMsgPart}`,
                          type: 'WINNERS_ANNOUNCED',
                          round: latestCompletedRound,
                          stats
                        });
                      } else {
                        // If winner, either unclaimedPrizes will handle it or we wait for them to be processed
                        setLiveStatus(null);
                      }
                    } 
                    // Only show status for rounds that have been "Announced" (COMPLETED)
                    else if (latestCompletedRound > 0) {
                    const participant = liveAuction.participants?.find((p: any) => p.playerId === userId);
                    if (participant) {
                      if (participant.isEliminated && participant.eliminatedInRound <= latestCompletedRound) {
                        setLiveStatus({
                          message: `Results Announced - Round ${participant.eliminatedInRound}: You are eliminated.${statsMsgPart}`,
                          type: 'ELIMINATED',
                          round: participant.eliminatedInRound,
                          stats
                        });
                      } else {
                        // Check if qualified in the latest completed round
                        const lastRoundResults = rounds.find((r: any) => r.roundNumber === latestCompletedRound);
                        if (lastRoundResults && lastRoundResults.userQualified) {
                          // If it's not the final round, encourage bidding in the next one
                          if (latestCompletedRound < (auction.roundCount || 4)) {
                            setLiveStatus({
                              message: `Results Announced - Round ${latestCompletedRound}: You are qualified! Bid in Round ${latestCompletedRound + 1} to win.${statsMsgPart}`,
                              type: 'QUALIFIED',
                              round: latestCompletedRound,
                              stats
                            });
                          } else {
                            // Round 4 completed, winners should be announced soon
                            setLiveStatus(null);
                          }
                        } else {
                          setLiveStatus(null);
                        }
                      }
                    } else {
                      setLiveStatus(null);
                    }
                  } else {
                    // No rounds completed yet but maybe show participation
                    if (participantsCount > 0) {
                      setLiveStatus({
                        message: `Auction Live: ${auction.auctionName}${statsMsgPart}`,
                        type: 'BID_NOW',
                        round: 0,
                        stats
                      });
                    } else {
                      setLiveStatus(null);
                    }
                  }
                }
              }
            } else {
              setLiveStatus(null);
            }
          }

          // 2. Fetch completed auctions for winners/claim status
          const [wonResponse, lostResponse] = await Promise.all([
            fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${userId}&status=won&limit=10`),
            fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${userId}&status=lost&limit=5`)
          ]);
          
          if (wonResponse.ok) {
            const result = await wonResponse.json();
            
            if (result.success && result.data) {
              const now = getISTNow();
              const auctions = Array.isArray(result.data) ? result.data : result.data.auctions || [];
              
              const unclaimed = auctions
                .filter((auction: any) => {
                  const status = (auction.prizeClaimStatus || '').toUpperCase();
                  const isPending = status === 'PENDING';
                  const deadline = auction.claimDeadline ? new Date(auction.claimDeadline).getTime() : null;
                  const isNotExpired = !deadline || deadline > now;
                  
                  if (status === 'CLAIMED') return false;
                  
                  const rank = auction.finalRank || auction.myRank;
                  if (rank > 3) return false;
                  
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
            }
          }

          if (lostResponse.ok) {
            const lostResult = await lostResponse.json();
            if (lostResult.success && lostResult.data) {
              const lostAuctionsList = Array.isArray(lostResult.data) ? lostResult.data : lostResult.data.auctions || [];
              const activeLost = lostAuctionsList.filter((auction: any) => !auction.isSettled);
              setLostAuctions(activeLost);
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
      if (unclaimedPrizes.length === 0) {
        setTimeLeftText('');
        setWaitingMessage('');
        return;
      }

      const updateTimeLeft = () => {
        const istNow = getISTNow();
        const firstPrize = unclaimedPrizes[0];
        
        if (!firstPrize) return;

        const { finalRank, currentEligibleRank, claimDeadline, winnersAnnouncedAt } = firstPrize;

        // CASE 1: It's my turn to claim
        if (finalRank === currentEligibleRank && claimDeadline) {
          const diff = claimDeadline - istNow;
          if (diff <= 0) {
            setTimeLeftText('Expired');
            return;
          }
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeftText(`${minutes}m ${seconds}s left`);
          setWaitingMessage('');
        } 
        // CASE 2: Waiting in queue
        else {
          let waitingTimeMs = 0;
          
          if (finalRank === 2) {
            // Rank 2 waits 15 mins total from announcement
            const startTime = winnersAnnouncedAt || (istNow - 1000);
            const targetTime = startTime + (15 * 60 * 1000);
            waitingTimeMs = Math.max(0, targetTime - istNow);
          } else if (finalRank === 3) {
            // Rank 3 waits 30 mins total from announcement
            const startTime = winnersAnnouncedAt || (istNow - 1000);
            const targetTime = startTime + (30 * 60 * 1000);
            waitingTimeMs = Math.max(0, targetTime - istNow);
          }

          if (waitingTimeMs > 0) {
            const minutes = Math.floor(waitingTimeMs / (1000 * 60));
            const seconds = Math.floor((waitingTimeMs % (1000 * 60)) / 1000);
            setWaitingMessage(`${minutes}m ${seconds}s more mins`);
            setTimeLeftText('Waiting queue...');
          } else {
            setWaitingMessage('Almost your turn!');
            setTimeLeftText('Wait for your turn...');
          }
        }
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }, [unclaimedPrizes]);

    const myActivePrize = unclaimedPrizes.find(p => p.finalRank === p.currentEligibleRank);
    const myWaitingPrize = unclaimedPrizes.find(p => p.finalRank > (p.currentEligibleRank || 0));
    
    const isMyTurn = !!myActivePrize;
    const isWaiting = !!myWaitingPrize;
    const hasLostRecently = lostAuctions.length > 0;

    const shouldShow = isVisible && (unclaimedPrizes.length > 0 || hasLostRecently || liveStatus !== null);
    
    if (!shouldShow) return null;

    const getBannerConfig = () => {
      // 1. Live status (Qualified/Eliminated during rounds)
      if (liveStatus) {
        if (liveStatus.type === 'WINNERS_ANNOUNCED') {
          return {
            gradient: 'from-rose-600 via-red-600 to-orange-600',
            icon: <AlertTriangle className="w-5 h-5 text-white" />,
            message: liveStatus.message,
            buttonText: 'TRY AGAIN',
            buttonClass: 'bg-white text-red-600 hover:bg-red-50'
          };
        }
        if (liveStatus.type === 'ELIMINATED') {
          return {
            gradient: 'from-gray-700 via-gray-600 to-gray-800',
            icon: <XCircle className="w-5 h-5 text-white" />,
            message: liveStatus.message,
            buttonText: 'WATCH NOW',
            buttonClass: 'bg-white text-gray-700 hover:bg-gray-50'
          };
        }
        return {
          gradient: 'from-indigo-600 via-purple-600 to-pink-600',
          icon: <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />,
          message: liveStatus.message,
          buttonText: 'BID NOW',
          buttonClass: 'bg-white text-indigo-600 hover:bg-indigo-50'
        };
      }

      // 2. Prize Claim logic
      if (timeLeftText === 'Expired') {
        return {
          gradient: 'from-amber-600 via-orange-600 to-red-600',
          icon: <AlertTriangle className="w-5 h-5 text-white animate-pulse" />,
          message: `Next time you should hurry up! Your claim window has expired.`,
          buttonText: 'VIEW HISTORY',
          buttonClass: 'bg-white text-orange-600 hover:bg-orange-50'
        };
      }

      if (isMyTurn && myActivePrize) {
        const rankText = myActivePrize.finalRank === 1 ? '1st' : myActivePrize.finalRank === 2 ? '2nd' : '3rd';
        return {
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          icon: <Gift className="w-5 h-5 text-white animate-bounce" />,
          message: `${rankText} place winner - Clock is ticking claim the prize now hurry up!`,
          buttonText: 'CLAIM PRIZE',
          buttonClass: 'bg-white text-emerald-600 hover:bg-emerald-50'
        };
      }

      if (isWaiting && myWaitingPrize) {
        const rankText = myWaitingPrize.finalRank === 2 ? '2nd' : '3rd';
        return {
          gradient: 'from-blue-600 via-indigo-500 to-violet-500',
          icon: <Clock className="w-5 h-5 text-white animate-spin-slow" />,
          message: `${rankText} place winner just few more minutes to go you are in waiting queue ${waitingMessage}`,
          buttonText: 'CHECK STATUS',
          buttonClass: 'bg-white text-blue-600 hover:bg-blue-50'
        };
      }

      // 3. General Lost Status
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
      if (liveStatus && liveStatus.type !== 'WINNERS_ANNOUNCED') {
        onNavigate('game');
        return;
      }
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

                  {timeLeftText && (isMyTurn || isWaiting) && (
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
