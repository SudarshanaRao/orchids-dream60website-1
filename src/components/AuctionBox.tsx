import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Crown, Clock, Zap, Target, TrendingUp, Sparkles, Trophy, CheckCircle2, AlertCircle, Timer, IndianRupee, Users, Award, ChevronRight, Info } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface Box {
  id: number;
  type: 'entry' | 'round';
  isOpen: boolean;
  minBid?: number;
  entryFee?: number;
  currentBid: number;
  bidder: string | null;
  opensAt?: Date;
  closesAt?: Date;
  hasPaid?: boolean;
  roundNumber?: number;
  status?: 'upcoming' | 'active' | 'completed';
  leaderboard?: Array<{
    username: string;
    bid: number;
    timestamp: Date;
  }> ;
  highestBidFromAPI?: number; // Rank 1 bid amount from live API
  prizeAmount?: number; // Prize for this specific round
}

interface AuctionBoxProps {
  box: Box;
  onClick: () => void;
  isUserHighestBidder: boolean;
  onShowLeaderboard?: (roundNumber: number) => void;
  userHasPaidEntry?: boolean;
  userBidAmount?: number;
  isUserQualified?: boolean;
  winnersAnnounced?: boolean;
  currentRound?: number;
  serverTime?: { timestamp: number } | null;
  hourlyAuctionId?: string | null; // ✅ Add auction ID prop
}

export function AuctionBox({ box, onClick, isUserHighestBidder, onShowLeaderboard, userHasPaidEntry, userBidAmount, isUserQualified, winnersAnnounced, currentRound, serverTime, hourlyAuctionId }: AuctionBoxProps) {
  const [timeUntilOpen, setTimeUntilOpen] = useState('');
  const [showRoundInfo, setShowRoundInfo] = useState(false);
  // ✅ Track box identity to detect when auction/round changes
  const [boxIdentity, setBoxIdentity] = useState<string>('');

  // ✅ Helper function to format round times WITHOUT timezone conversion (display API times as-is)
  const formatRoundTime = (date: Date) => {
    // Extract UTC hours and minutes directly (API sends IST times, stored as UTC to prevent conversion)
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Convert to 12-hour format
    const hour12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const period = hours >= 12 ? 'pm' : 'am';
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // ✅ Get formatted round time range (API times without conversion)
    const getRoundTimeRange = () => {
      if (!box.opensAt || !box.closesAt) return '';
      
      const startTime = formatRoundTime(box.opensAt);
      const endTime = formatRoundTime(box.closesAt);
      const timeRange = `${startTime} to ${endTime}`;
      
      return timeRange;
    };

  // Get round explanation for the round
  const getRoundExplanation = () => {
    const roundNum = box.roundNumber || 1;
    
    // Round-specific strategies and tips
    const roundStrategies = {
      1: {
        strategy: 'Start conservative! Many players overbid in Round 1. Consider mid-range unique amounts.',
        tip: 'Observe patterns - avoid common numbers like 100, 500, 1000',
        focus: 'Qualification is key - you need to be in top 3 to advance'
      },
      2: {
        strategy: 'Competition intensifies! Analyze Round 1 patterns and adjust your auction amount accordingly.',
        tip: 'Players often stick to similar ranges - break the pattern',
        focus: 'Only 9 players remain - stakes are higher, be strategic'
      },
      3: {
        strategy: 'Mid-round advantage! Use insights from previous rounds to identify winning ranges.',
        tip: 'Psychology matters - think what others might avoid',
        focus: 'Top 3 advance from 9 players - precision is crucial'
      },
      4: {
        strategy: 'Semi-finals! Every auction amount counts. Balance between being unique and competitive.',
        tip: 'Avoid predictable increments like multiples of 50 or 100',
        focus: 'Only 9 players left - your auction amount must stand out'
      },
      5: {
        strategy: 'Almost there! Study previous winners\' patterns. Think outside the box.',
        tip: 'Consider unusual amounts that others might overlook',
        focus: 'Final qualification round - make it count'
      },
      6: {
        strategy: 'GRAND FINALE! This is it - highest unique auction amount wins everything. Go bold!',
        tip: 'Maximum uniqueness + highest amount = Victory',
        focus: 'Winner takes all - no holding back now!'
      }
    };

    const roundData = roundStrategies[roundNum as keyof typeof roundStrategies] || roundStrategies[1];
    
    return {
      title: `Round ${roundNum} Details`,
      description: roundNum === 6 ? 'The final showdown for the grand prize!' : `Strategic insights for Round ${roundNum}`,
      rules: [
        {
          icon: Target,
          title: 'Objective',
          text: roundNum === 6 
            ? 'Place the HIGHEST unique auction amount to win the grand prize!' 
            : 'Place the Highest unique auction amount to qualify for the next round (Highest 3 Auction Amounts will be only considered)'
        },
        {
          icon: Trophy,
          title: 'Prize Pool',
          text: box.prizeAmount 
            ? `Winner gets ₹${box.prizeAmount.toLocaleString('en-IN')} Amazon voucher`
            : 'Amazon voucher for the winner'
        },
        {
          icon: Users,
          title: 'Qualification',
          text: roundNum === 6 
            ? 'Final round - Winner takes the grand prize!'
            : 'Top 3 highest unique auction amounts advance to next round'
        },
        {
          icon: Zap,
          title: `Round ${roundNum} Strategy`,
          text: roundData.strategy
        },
        {
          icon: Clock,
          title: 'Timing',
          text: box.opensAt && box.closesAt
            ? `Round runs from ${formatRoundTime(box.opensAt)} to ${formatRoundTime(box.closesAt)}`
            : '30-minute auction window per round'
        },
        {
          icon: Award,
          title: 'Smart Tip',
          text: roundData.tip
        }
      ],
      proTip: roundData.focus
    };
  };

  // ✅ UPDATED: Detect when box data changes (new auction/round) and reset state
    useEffect(() => {
      // Create a unique identity including auction ID to detect new auctions
      const newIdentity = `${hourlyAuctionId}-${box.roundNumber}-${box.opensAt?.getTime()}-${box.closesAt?.getTime()}-${box.currentBid}-${box.status}`;
      
      // If box identity changed, this is a new auction or round update
      if (boxIdentity && newIdentity !== boxIdentity) {
        // Reset timer state for the new auction/round
        setTimeUntilOpen('');
      }
      
      setBoxIdentity(newIdentity);
    }, [hourlyAuctionId, box.roundNumber, box.opensAt, box.closesAt, box.currentBid, box.status]);

  useEffect(() => {
    if (box.type === 'round' && box.opensAt) {
      const updateTimer = () => {
        // ✅ Use server time instead of local browser time
        const now = serverTime ? new Date(serverTime.timestamp) : new Date();

          if (!box.isOpen && box.opensAt! > now) {
            const distance = box.opensAt!.getTime() - now.getTime();
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeUntilOpen(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          } else if (box.isOpen && box.closesAt && box.closesAt > now) {
            const distance = box.closesAt.getTime() - now.getTime();
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeUntilOpen(`${minutes}:${seconds.toString().padStart(2, '0')}`);
          } else {
            setTimeUntilOpen('');
          }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [box.isOpen, box.opensAt, box.closesAt, box.type, box.roundNumber, serverTime]); // ✅ Add serverTime as dependency

  const getBoxTitle = () => {
    if (box.type === 'entry') {
      return `Entry Box ${box.id}`;
    }
    // ✅ FIX: Use box.roundNumber instead of box.id - 2
    return `Round ${box.roundNumber || 1}`;
  };

  const getBoxStatus = () => {
    if (box.type === 'entry') {
      return box.hasPaid ? 'paid' : 'open';
    }
    
    // ✅ CRITICAL FIX: Check if user hasn't paid entry fee FIRST
    // If user hasn't paid entry, ALL round boxes should show as 'upcoming' (locked)
    if (!userHasPaidEntry) {
      return 'upcoming';
    }
    
    // ✅ CRITICAL FIX: Check winnersAnnounced FIRST - ALL unplayed rounds should show winners-announced
    // If winners were announced early (≤3 qualified), all remaining rounds with no bids = winners-announced
    if (winnersAnnounced && box.currentBid === 0) {
      return 'winners-announced';
    }
    
    // Show normal "Completed" status for rounds that were actually played (have bids)
    if (box.status === 'completed') return 'completed';
    
    // ✅ CRITICAL: Only show "not-qualified" if explicitly false (failed qualification)
    // If undefined (previous round not completed), show normal "locked" status instead
    if (box.roundNumber && box.roundNumber > 1 && isUserQualified === false) {
      return 'not-qualified';
    }
    
    // If user has paid, show actual status based on time
    if (!box.isOpen) return 'locked';
    if (box.currentBid === 0) return 'open';
    return 'bidding';
  };

  const status = getBoxStatus();
  const isClickable = box.isOpen && status !== 'paid' && status !== 'completed' && status !== 'upcoming' && status !== 'not-qualified' && status !== 'winners-announced' && !userBidAmount;

  // ✅ CRITICAL: Extra safeguard - never allow clicking if explicitly not qualified or winners announced
  const canPlaceBid = isClickable && !(box.roundNumber && box.roundNumber > 1 && isUserQualified === false) && !winnersAnnounced;

    // Background gradient based on status - All Purple/Violet
    const getBackgroundGradient = () => {
      if (status === 'completed') return 'bg-gray-50';
      if (status === 'winners-announced') return 'bg-emerald-50';
      if (status === 'upcoming' || status === 'locked') return 'bg-gray-50/50';
      if (status === 'not-qualified') return 'bg-red-50/50';
      if (status === 'paid') return 'bg-purple-50';
      if (userBidAmount) return 'bg-green-50';
      if (isUserHighestBidder) return 'bg-violet-50';
      return 'bg-white';
    };

    const getBorderColor = () => {
      if (status === 'completed') return 'border-gray-200';
      if (status === 'winners-announced') return 'border-emerald-200';
      if (status === 'upcoming' || status === 'locked') return 'border-gray-200';
      if (status === 'not-qualified') return 'border-red-200';
      if (status === 'paid') return 'border-purple-200';
      if (userBidAmount) return 'border-green-200';
      if (isUserHighestBidder) return 'border-violet-300';
      return 'border-gray-200';
    };

    const getShadowColor = () => {
      return 'shadow-sm';
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={isClickable ? { y: -4, transition: { duration: 0.2 } } : {}}
        className="h-full w-full"
        layout={false}
      >
        <Card 
          className={`
            relative overflow-hidden h-full w-full border-2 transition-all duration-300
            ${getBackgroundGradient()} ${getBorderColor()} ${getShadowColor()}
            ${isClickable ? 'cursor-pointer hover:border-purple-400 hover:shadow-md' : 'cursor-default'}
            rounded-2xl
          `}
          onClick={isClickable ? onClick : undefined}
        >
          <CardContent className="p-4 sm:p-5 relative z-10">
            {/* Header with Title and Status */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {getBoxTitle()}
              </h3>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Info Icon - Only show for round boxes */}
                {box.type === 'round' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRoundInfo(true);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}
                
                <div className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider
                  ${status === 'completed' 
                    ? 'bg-gray-100 text-gray-600 border-gray-200' 
                    : status === 'winners-announced'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : status === 'upcoming' || status === 'locked'
                    ? 'bg-gray-50 text-gray-400 border-gray-100'
                    : status === 'paid'
                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                  }
                `}>
                  <span className="">
                    {status === 'completed' 
                      ? 'Completed' 
                      : status === 'winners-announced'
                      ? 'WINNERS Announced'
                      : status === 'upcoming' 
                      ? 'Locked' 
                      : status === 'locked' 
                      ? 'Locked' 
                      : status === 'open' 
                      ? 'Open' 
                      : status === 'paid' 
                      ? 'Paid' 
                      : winnersAnnounced 
                        ? 'WINNERS Announced'
                        : 'Active'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Main Icon Area */}
            <div className="flex flex-col items-center justify-center mb-4">
                <div className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-white/20 mb-3
                  ${status === 'completed'
                    ? 'bg-gray-400'
                    : status === 'upcoming' || status === 'locked'
                    ? 'bg-gray-200'
                    : status === 'paid'
                    ? 'bg-purple-500'
                    : 'bg-purple-600'
                  }
                `}>
                  {status === 'upcoming' || status === 'locked' ? (
                    <Lock className="w-8 h-8 text-gray-400" />
                  ) : box.type === 'entry' ? (
                    <IndianRupee className="w-8 h-8 text-white" />
                  ) : (
                    <Target className="w-8 h-8 text-white" />
                  )}
                </div>

              {/* Timer Display */}
              {timeUntilOpen && !winnersAnnounced && isUserQualified !== false && (
                <div className="bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-mono font-bold shadow-sm">
                  {timeUntilOpen}
                </div>
              )}
            </div>

            {/* Information Section */}
            <div className="space-y-2.5">
              {status === 'winners-announced' ? (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-[10px] text-emerald-700 font-bold mb-1 uppercase tracking-wide">Status</div>
                  <p className="text-xs text-emerald-800 font-medium">Winners Announced Early</p>
                </div>
              ) : status === 'completed' ? (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wide">Closed at</div>
                  <p className="text-xs text-gray-700 font-medium">{formatRoundTime(box.closesAt!)}</p>
                </div>
              ) : status === 'upcoming' || status === 'locked' ? (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-bold mb-1 uppercase tracking-wide">Opens at</div>
                  <p className="text-xs text-gray-500 font-medium">{box.opensAt ? formatRoundTime(box.opensAt) : 'TBD'}</p>
                </div>
              ) : userBidAmount ? (
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="text-[10px] text-green-600 font-bold mb-1 uppercase tracking-wide">Your Bid</div>
                  <p className="text-sm font-bold text-green-900">₹{userBidAmount.toLocaleString('en-IN')}</p>
                </div>
              ) : (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <div className="text-[10px] text-purple-600 font-bold mb-1 uppercase tracking-wide">
                    {box.type === 'entry' ? 'Entry Fee' : 'Min Bid'}
                  </div>
                  <p className="text-sm font-bold text-purple-900">
                    ₹{(box.type === 'entry' ? box.entryFee : box.minBid)?.toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {canPlaceBid && (
                <div className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs text-center transition-colors">
                  {status === 'open' && box.type === 'entry' ? 'Pay Entry Fee' : 'Place Your Bid'}
                </div>
              )}

              {status === 'completed' && box.highestBidFromAPI && (
                 <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                    <div className="text-[10px] text-violet-600 font-bold mb-1 uppercase tracking-wide">Winning Bid</div>
                    <p className="text-sm font-bold text-violet-900">₹{box.highestBidFromAPI.toLocaleString('en-IN')}</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Round Information Dialog */}
      {box.type === 'round' && (
        <Dialog open={showRoundInfo} onOpenChange={setShowRoundInfo}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 border-2 border-purple-300 p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg sm:text-xl font-bold text-purple-900 flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="leading-tight">{getRoundExplanation().title}</span>
              </DialogTitle>
              <DialogDescription className="text-purple-700 text-sm sm:text-base">
                {getRoundExplanation().description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-2.5 sm:space-y-3 mt-3 sm:mt-4">
              {getRoundExplanation().rules.map((rule, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2.5 sm:p-3 border border-purple-200/60 shadow-sm"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shrink-0">
                      <rule.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-purple-900 text-xs sm:text-sm mb-0.5 sm:mb-1">{rule.title}</h4>
                      <p className="text-[11px] sm:text-xs text-purple-700 leading-relaxed">{rule.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-3 sm:mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
              <p className="text-[11px] sm:text-xs text-amber-900 text-center font-medium leading-relaxed">
                🎯 <strong>Focus:</strong> {getRoundExplanation().proTip}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}