import { Clock, Calendar, Trophy, Sparkles, Radio, PlayCircle, BarChart2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { getCurrentIST } from '../utils/timezone';
import { API_ENDPOINTS } from '../lib/api-config';
import { Button } from './ui/button';

interface WinnerInfo {
  rank: number;
  playerId?: string;
  playerUsername?: string;
  finalBidAmount?: number;
  totalAmountPaid?: number;
  isPrizeClaimed?: boolean;
  prizeClaimedAt?: Date | null;
}

interface ParticipantInfo {
  playerId: string;
  playerUsername: string;
  entryFee: number;
  joinedAt: Date;
  currentRound: number;
  isEliminated: boolean;
  eliminatedInRound?: number | null;
  totalBidsPlaced: number;
  totalAmountBid: number;
}

interface RoundPlayerData {
  playerId: string;
  playerUsername: string;
  auctionPlacedAmount: number;
  auctionPlacedTime: Date;
  isQualified: boolean;
  rank?: number | null;
}

interface RoundInfo {
  roundNumber: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  totalParticipants: number;
  playersData: RoundPlayerData[];
  qualifiedPlayers: string[];
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED';
}

interface AuctionConfig {
  auctionNumber: number;
  auctionId: string;
  hourlyAuctionId?: string;
  TimeSlot: string;
  auctionName: string;
  imageUrl?: string;
  prizeValue: number;
  Status: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  FeeSplits?: {
    BoxA: number;
    BoxB: number;
  };
  topWinners?: WinnerInfo[];
  participants?: ParticipantInfo[];
  rounds?: RoundInfo[];
  totalParticipants?: number;
  currentRound?: number;
  totalBids?: number;
  roundCount?: number;
}

interface AuctionScheduleProps {
  user?: {
    id?: string;
    username?: string;
  } | null;
  onNavigate?: (page: string, data?: any) => void;
  serverTime?: { timestamp: number; minute: number; hour: number } | null;
}

type TabFilter = 'all' | 'live' | 'upcoming' | 'completed';

export function AuctionSchedule({ user, onNavigate, serverTime }: AuctionScheduleProps) {
  const now = getCurrentIST();
  const currentHour = now.getHours();
  const [activeFilter, setActiveFilter] = useState<TabFilter>('upcoming');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [userParticipation, setUserParticipation] = useState<Record<string, boolean>>({});
  const [userBidsPerAuction, setUserBidsPerAuction] = useState<Record<string, Record<number, boolean>>>({});
  const [scheduleStats, setScheduleStats] = useState({
    totalAuctions: 0,
    earliestTime: '',
    latestTime: '',
    boxesPerAuction: 6
  });
  
  useEffect(() => {
    const fetchAuctionSchedule = async () => {
      if (!hasLoadedOnce) {
        setIsLoading(true);
      }

        try {
          const [dailyResponse, liveResponse] = await Promise.all([
            fetch(`${API_ENDPOINTS.scheduler.dailyAuction}?`),
            fetch(`${API_ENDPOINTS.scheduler.liveAuction}?`)
          ]);
          
          const dailyData = await dailyResponse.json();
          const liveData = await liveResponse.json();
          
          let liveAuctionData = null;
          if (liveResponse.ok && liveData.success && liveData.data) {
            liveAuctionData = liveData.data;
          }
          
          if (dailyResponse.ok && dailyData.success && dailyData.data?.dailyAuctionConfig) {
            const auctions = dailyData.data.dailyAuctionConfig.map((auction: AuctionConfig, index: number) => {
              // Use live auction data if it matches this hourlyAuctionId
              const isLiveMatch = liveAuctionData && (
                (auction.hourlyAuctionId && auction.hourlyAuctionId === liveAuctionData.hourlyAuctionId) ||
                (auction.TimeSlot === liveAuctionData.TimeSlot && auction.auctionNumber === liveAuctionData.auctionNumber)
              );
              
              const currentAuctionData = isLiveMatch ? { ...auction, ...liveAuctionData } : auction;
              
                const [auctionHour, auctionMinute] = currentAuctionData.TimeSlot.split(':').map(Number);
                const timeStr = `${auctionHour.toString().padStart(2, '0')}:${auctionMinute?.toString().padStart(2, '0') || '00'}`;

              
                  let status = 'upcoming';
                  let winner = null;
                  let isPrizeClaimed = false;
                  
                    if (currentAuctionData.Status === 'LIVE') {
                      status = 'active';
                    } else if (currentAuctionData.Status === 'COMPLETED') {
                      status = 'completed';
                      if (currentAuctionData.topWinners && currentAuctionData.topWinners.length > 0) {
                        // Find actual claimant first (anyone with CLAIMED status or isPrizeClaimed true)
                        const actualClaimant = currentAuctionData.topWinners.find((w: any) => 
                          w.prizeClaimStatus === 'CLAIMED' || w.isPrizeClaimed === true
                        );
                        const rank1Winner = currentAuctionData.topWinners.find((w: any) => w.rank === 1);
                        
                        if (actualClaimant) {
                          winner = actualClaimant.playerUsername;
                          isPrizeClaimed = true;
                        } else if (rank1Winner) {
                          winner = rank1Winner.playerUsername;
                          isPrizeClaimed = rank1Winner.isPrizeClaimed || false;
                        }
                      }
                    } else if (currentAuctionData.Status === 'CANCELLED') {
                      status = 'cancelled';
                    } else if (currentAuctionData.Status === 'UPCOMING') {
                      status = 'upcoming';
                    }
                  
                  // If winners are announced, we can also get winner info even if status is not COMPLETED
                  const winnersAnnounced = currentAuctionData.winnersAnnounced || (currentAuctionData.topWinners && currentAuctionData.topWinners.length > 0);
                  if (winnersAnnounced && !winner && currentAuctionData.topWinners?.length > 0) {
                    // Find actual claimant first
                    const actualClaimant = currentAuctionData.topWinners.find((w: any) => 
                      w.prizeClaimStatus === 'CLAIMED' || w.isPrizeClaimed === true
                    );
                    const rank1Winner = currentAuctionData.topWinners.find((w: any) => w.rank === 1);
                    
                    if (actualClaimant) {
                      winner = actualClaimant.playerUsername;
                      isPrizeClaimed = true;
                    } else if (rank1Winner) {
                      winner = rank1Winner.playerUsername;
                      isPrizeClaimed = rank1Winner.isPrizeClaimed || false;
                    }
                  }
              
                // Check if user has joined this auction
                const hasUserJoined = user?.id && currentAuctionData.participants?.some(
                  (p: ParticipantInfo) => p.playerId === user.id
                );
                
                // Check user's bids per round
                const userRoundBids: Record<number, boolean> = {};
                if (user?.id && currentAuctionData.rounds) {
                  currentAuctionData.rounds.forEach((round: RoundInfo) => {
                    const userBid = round.playersData?.find(p => p.playerId === user.id);
                    if (userBid) {
                      userRoundBids[round.roundNumber] = true;
                    }
                  });
                }
  
                  return {
                    time: timeStr,
                    hour: auctionHour,
                    minute: auctionMinute,
                    status,
                    sequenceNumber: currentAuctionData.auctionNumber || index + 1,
                    hourlyAuctionId: currentAuctionData.hourlyAuctionId,
                    auctionId: currentAuctionData.auctionId,
                    prize: {
                      name: currentAuctionData.auctionName || `Auction ${index + 1}`,
                      value: currentAuctionData.prizeValue || 0,
                      image: currentAuctionData.imageUrl || 'https://images.unsplash.com/photo-1727093493878-874890b4f9fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpUGhvbmUlMjBzbWFydHBob25lJTIwbW9kZXJufGVufDF8fHx8MTc2Mjc5OTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080'
                    },
                      winner,
                      isPrizeClaimed,
                      winnersAnnounced: winnersAnnounced,
                      roundCount: currentAuctionData.roundCount || 4,
                    totalParticipants: currentAuctionData.totalParticipants ?? (currentAuctionData.participants?.length ?? currentAuctionData.rounds?.[0]?.totalParticipants ?? 0),
                    hasUserJoined: hasUserJoined || false,
                    userRoundBids,
                    currentRound: currentAuctionData.currentRound || 1,
                  };
              });

          setScheduleData(auctions);
          
          // Update user participation map
          const participationMap: Record<string, boolean> = {};
          const bidsMap: Record<string, Record<number, boolean>> = {};
          auctions.forEach((a: any) => {
            if (a.hourlyAuctionId) {
              participationMap[a.hourlyAuctionId] = a.hasUserJoined;
              bidsMap[a.hourlyAuctionId] = a.userRoundBids;
            }
          });
          setUserParticipation(participationMap);
          setUserBidsPerAuction(bidsMap);
            
            if (auctions.length > 0) {
            const sortedByTime = [...auctions].sort((a, b) => {
              const timeA = a.hour * 60 + a.minute;
              const timeB = b.hour * 60 + b.minute;
              return timeA - timeB;
            });
            
            const earliest = sortedByTime[0];
            const latest = sortedByTime[sortedByTime.length - 1];
            const firstAuction = auctions[0];
            const totalBoxes = 2 + (firstAuction.roundCount || 4);
            
            setScheduleStats({
              totalAuctions: auctions.length,
              earliestTime: earliest.time,
              latestTime: latest.time,
              boxesPerAuction: totalBoxes
            });
          }
          setHasLoadedOnce(true);
        }
      } catch (error) {
        console.error('Error fetching auction schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctionSchedule();
    const refreshInterval = setInterval(fetchAuctionSchedule, 60000);
    return () => clearInterval(refreshInterval);
  }, [currentHour, hasLoadedOnce]);

  const filteredAuctions = scheduleData.filter(auction => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'live') return auction.status === 'active';
    if (activeFilter === 'upcoming') return auction.status === 'upcoming';
    if (activeFilter === 'completed') return auction.status === 'completed' || auction.status === 'cancelled';
    return true;
  });

    const sortedAuctions = activeFilter === 'completed'
      ? [...filteredAuctions].sort((a, b) => (b.hour * 60 + b.minute) - (a.hour * 60 + a.minute))
      : [...filteredAuctions].sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white border-0';
      case 'active': return 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 shadow-lg shadow-purple-500/50';
      case 'cancelled': return 'bg-red-50 text-red-600 border border-red-200';
      case 'upcoming': return 'bg-gradient-to-r from-purple-300 to-purple-400 text-white border-0';
      default: return 'bg-purple-400 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'active': return 'Live Now';
      case 'cancelled': return 'Cancelled';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        <p className="text-purple-600 mt-4">Loading auction schedule...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="relative overflow-hidden rounded-3xl border-2 border-purple-200/60 bg-white/90 backdrop-blur-xl p-4 sm:p-6 shadow-xl shadow-purple-500/5"
      data-whatsnew-target="auction-schedule"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Calendar className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h2 className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl text-purple-900 font-bold">
                <span>Today's Auction Schedule</span>
                <Sparkles className="w-5 h-5 text-violet-600" />
              </h2>
              <p className="text-purple-600 text-xs sm:text-sm mt-1">
                {scheduleStats.totalAuctions} premium auctions daily • {scheduleStats.earliestTime} - {scheduleStats.latestTime}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'upcoming', label: 'UPCOMING', icon: PlayCircle },
              { id: 'live', label: 'LIVE', icon: Radio },
              { id: 'completed', label: 'COMPLETED', icon: Trophy },
              { id: 'all', label: 'ALL', icon: Calendar }
            ].map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              
              return (
                <motion.button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
                  className={`
                    relative px-4 py-2 rounded-2xl text-xs font-semibold
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/30' 
                      : 'bg-purple-50 text-purple-700 border-2 border-purple-200/60 hover:border-purple-300 hover:bg-purple-100/50'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="flex items-center gap-1.5 relative z-10">
                    <Icon className="w-3.5 h-3.5" />
                    {filter.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
          
        <div className="grid gap-4">
          {sortedAuctions.length === 0 ? (
            <div className="text-center py-12 bg-purple-50/50 rounded-2xl border-2 border-dashed border-purple-200">
              <Calendar className="w-12 h-12 text-purple-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-purple-900">No Auctions Found</h3>
              <p className="text-purple-600 text-sm">Check back later for more auctions!</p>
            </div>
          ) : (
              sortedAuctions.map((auction, index) => {
                const participantCount = auction.totalParticipants ?? 0;
                const isParticipant = !!auction.hasUserJoined;
                return (

                  <motion.div
                    key={`${auction.hour}-${auction.minute}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (auction.status === 'upcoming') {
                        onNavigate?.('prizeshowcase', { hourlyAuctionId: auction.hourlyAuctionId });
                      }
                    }}
                    className={`
                      relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${auction.status === 'upcoming' ? 'cursor-pointer' : ''}
                      ${auction.status === 'active' 
                        ? 'border-violet-300 bg-violet-50/50' 
                        : 'border-purple-100 bg-white hover:border-purple-200'
                      }
                    `}
                  >

                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-purple-900">{auction.time}</span>
                          <Badge className={`${getStatusColor(auction.status)} text-[10px]`}>
                            {getStatusText(auction.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-purple-500 font-medium">Auction #{auction.sequenceNumber}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-purple-100 shrink-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback src={auction.prize.image} alt={auction.prize.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-purple-900 truncate w-32">{auction.prize.name}</div>
                        <div className="text-xs text-violet-600 font-bold">₹{auction.prize.value.toLocaleString()}</div>
                      </div>
                    </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:border-l sm:border-purple-100 sm:pl-4 w-full sm:w-auto">
                          <div className="flex items-center gap-4">
                            <div className="text-center shrink-0">
                              <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Players</div>
                              <div className="text-sm font-bold text-purple-900">{participantCount}</div>
                            </div>

                            {(auction.status === 'completed' || auction.winnersAnnounced) && (
                              <div className="text-center shrink-0 border-l border-purple-100 pl-4">
                                <div className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Prize Claimed By</div>
                                <div className={`text-sm font-bold ${auction.isPrizeClaimed ? 'text-green-600' : 'text-red-500'}`}>
                                  {auction.isPrizeClaimed ? (auction.winner || 'Claimed') : 'Not Claimed'}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-auto sm:ml-0">
                            {auction.status === 'completed' && auction.hourlyAuctionId && (
                              <Button
                                onClick={() => onNavigate?.('auction-leaderboard', { hourlyAuctionId: auction.hourlyAuctionId })}
                                size="sm"
                                variant="ghost"
                                disabled={!isParticipant}
                                className={`h-8 text-xs font-bold px-2 whitespace-nowrap ${
                                  isParticipant
                                    ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                                    : 'text-gray-400 cursor-not-allowed hover:bg-transparent'
                                }`}
                              >
                                <BarChart2 className="w-3.5 h-3.5 mr-1" />
                                Leaderboard
                              </Button>
                            )}

                          {auction.status === 'active' && (() => {
                            const currentMinute = serverTime?.minute ?? new Date().getMinutes();
                            const isFirst15Mins = currentMinute < 15;
                            const hasJoined = auction.hasUserJoined;
                            
                            // Calculate current round based on server time
                            let currentRound = 1;
                            if (currentMinute >= 45) currentRound = 4;
                            else if (currentMinute >= 30) currentRound = 3;
                            else if (currentMinute >= 15) currentRound = 2;
                            
                            // Check if winners are already announced (e.g. auction finished early)
                              if (auction.winnersAnnounced && auction.hourlyAuctionId) {
                                return (
                                  <Button
                                    onClick={() => onNavigate?.('auction-leaderboard', { hourlyAuctionId: auction.hourlyAuctionId })}
                                    size="sm"
                                    disabled={!isParticipant}
                                    className={`h-8 text-xs font-bold px-4 whitespace-nowrap ${
                                      isParticipant
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <Trophy className="w-3.5 h-3.5 mr-1" />
                                    Leaderboard
                                  </Button>
                                );
                              }


                            // Check if user has bid in current round
                            const hasBidInCurrentRound = auction.userRoundBids?.[currentRound] || false;
                            const previousRound = currentRound > 1 ? currentRound - 1 : 0;
                          
                          // Logic: 
                          // 1. First 15 mins && not joined -> Join (enabled)
                          // 2. After 15 mins && not joined -> Join (disabled)
                          // 3. Joined && not bid in current round -> Bid Now
                          // 4. Joined && bid in current round -> View Leaderboard (previous round)
                          
                          if (!hasJoined) {
                            return (
                              <Button
                                onClick={() => {
                                  if (isFirst15Mins) {
                                    // Scroll to auction boxes to join
                                    const auctionGrid = document.querySelector('[data-auction-grid]') || document.querySelector('#auction-grid');
                                    if (auctionGrid) {
                                      auctionGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    } else {
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                  }
                                }}
                                size="sm"
                                disabled={!isFirst15Mins}
                                className={`h-8 text-xs font-bold px-4 whitespace-nowrap ${
                                  isFirst15Mins 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <PlayCircle className="w-3.5 h-3.5 mr-1" />
                                Join
                              </Button>
                            );
                          }
                          
                          if (!hasBidInCurrentRound) {
                            return (
                              <Button
                                onClick={() => {
                                  // Scroll to auction boxes and highlight current round
                                  const auctionGrid = document.querySelector('[data-auction-grid]') || document.querySelector('#auction-grid');
                                  if (auctionGrid) {
                                    auctionGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    // Add highlight effect to current round box
                                    setTimeout(() => {
                                      const roundBox = document.querySelector(`[data-round="${currentRound}"]`);
                                      if (roundBox) {
                                        roundBox.classList.add('ring-4', 'ring-purple-500', 'ring-offset-2');
                                        setTimeout(() => {
                                          roundBox.classList.remove('ring-4', 'ring-purple-500', 'ring-offset-2');
                                        }, 3000);
                                      }
                                    }, 800);
                                  } else {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs font-bold px-4 whitespace-nowrap"
                              >
                                <Trophy className="w-3.5 h-3.5 mr-1" />
                                Bid Now
                              </Button>
                            );
                          }
                          
                          // User has bid in current round - show View Leaderboard for previous round
                          return (
                            <Button
                              onClick={() => {
                                  if (previousRound > 0 && auction.hourlyAuctionId) {
                                    onNavigate?.('auction-leaderboard', { 
                                      hourlyAuctionId: auction.hourlyAuctionId,
                                      roundNumber: previousRound 
                                    });
                                  }
                              }}
                              size="sm"
                              variant="outline"
                              className="text-purple-600 border-purple-300 hover:bg-purple-50 h-8 text-xs font-bold px-3 whitespace-nowrap"
                            >
                              <BarChart2 className="w-3.5 h-3.5 mr-1" />
                              Leaderboard
                            </Button>
                          );
                        })()}
                          </div>
                        </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}