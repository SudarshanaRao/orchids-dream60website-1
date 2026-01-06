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
    
    // ✅ Log the complete conversion process from API to display
    console.log(`📊 [AUCTION BOX - Round ${box.roundNumber}] Time Display (NO CONVERSION - STRICT IST):`, {
      'Round Number': box.roundNumber,
      'Raw opensAt ISO': box.opensAt.toISOString(),
      'Raw closesAt ISO': box.closesAt.toISOString(),
      'opensAt UTC Hours': box.opensAt.getUTCHours(),
      'opensAt UTC Minutes': box.opensAt.getUTCMinutes(),
      'closesAt UTC Hours': box.closesAt.getUTCHours(),
      'closesAt UTC Minutes': box.closesAt.getUTCMinutes(),
      'Formatted Start Time': startTime,
      'Formatted End Time': endTime,
      'Final Display': timeRange
    });
    
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
      console.log(`🔄 [AUCTION BOX - Round ${box.roundNumber}] New auction/round detected, resetting state`, {
        'Previous Identity': boxIdentity,
        'New Identity': newIdentity,
        'Auction ID': hourlyAuctionId,
        'Round Number': box.roundNumber,
        'Opens At': box.opensAt?.toISOString(),
        'Closes At': box.closesAt?.toISOString(),
        'Current Bid': box.currentBid,
        'Status': box.status
      });
      
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
          
          // ✅ Enhanced console logs - Countdown until round opens (UTC times)
          console.log(`⏱️ [AUCTION BOX - Round ${box.roundNumber}] Countdown until round opens (UTC):`, {
            'Round Number': box.roundNumber,
            '📅 Opens At (UTC)': box.opensAt.toUTCString(),
            '📅 Closes At (UTC)': box.closesAt?.toUTCString() || 'N/A',
            '⏰ Opens At (Display)': formatRoundTime(box.opensAt),
            '⏰ Closes At (Display)': box.closesAt ? formatRoundTime(box.closesAt) : 'N/A',
            '⏰ Round Time Range': getRoundTimeRange(),
            '🕐 Current Time (UTC)': now.toUTCString(),
            '🕐 Current Time (Source)': serverTime ? 'Server Time' : 'Local Time',
            '📊 Time Until Open (ms)': distance,
            '📊 Time Until Open (minutes)': minutes,
            '⏱️ Countdown Display': `${minutes}:${seconds.toString().padStart(2, '0')}`
          });
          
          setTimeUntilOpen(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else if (box.isOpen && box.closesAt && box.closesAt > now) {
          const distance = box.closesAt.getTime() - now.getTime();
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          // ✅ Enhanced console logs - Active round countdown (UTC times)
          console.log(`⏱️ [AUCTION BOX - Round ${box.roundNumber}] Active round - Time remaining (UTC):`, {
            'Round Number': box.roundNumber,
            '📅 Round Start (UTC)': box.opensAt!.toUTCString(),
            '📅 Round End (UTC)': box.closesAt.toUTCString(),
            '⏰ Round Start (Display)': formatRoundTime(box.opensAt!),
            '⏰ Round End (Display)': formatRoundTime(box.closesAt),
            '⏰ Round Time Range': getRoundTimeRange(),
            '🕐 Current Time (UTC)': now.toUTCString(),
            '🕐 Current Time (Source)': serverTime ? 'Server Time' : 'Local Time',
            '📊 Time Remaining (ms)': distance,
            '📊 Time Remaining (minutes)': minutes,
            '⏱️ Countdown Display': `${minutes}:${seconds.toString().padStart(2, '0')}`,
            '✅ Round Status': 'ACTIVE'
          });
          
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
    if (status === 'completed') return 'from-purple-100/80 via-violet-100/60 to-purple-100/80';
    if (status === 'winners-announced') return 'from-green-50/80 via-emerald-100/60 to-green-50/80';
    if (status === 'upcoming' || status === 'locked') return 'from-purple-50/70 via-violet-50/50 to-purple-50/70';
    if (status === 'not-qualified') return 'from-red-50/70 via-red-100/50 to-red-50/70';
    if (status === 'paid') return 'from-purple-100/80 via-fuchsia-100/60 to-purple-100/80';
    if (userBidAmount) return 'from-green-50/80 via-emerald-100/60 to-green-50/80';
    if (isUserHighestBidder) return 'from-violet-100/80 via-purple-100/60 to-fuchsia-100/80';
    return 'from-purple-50/80 via-violet-100/60 to-purple-50/80';
  };

  const getBorderColor = () => {
    if (status === 'completed') return 'border-purple-400/50';
    if (status === 'winners-announced') return 'border-green-400/60';
    if (status === 'upcoming' || status === 'locked') return 'border-purple-300/40';
    if (status === 'not-qualified') return 'border-red-300/50';
    if (status === 'paid') return 'border-fuchsia-400/50';
    if (userBidAmount) return 'border-green-400/50';
    if (isUserHighestBidder) return 'border-violet-400/60';
    return 'border-purple-300/50';
  };

  const getShadowColor = () => {
    if (status === 'completed') return 'shadow-purple-500/15';
    if (status === 'winners-announced') return 'shadow-green-500/20';
    if (status === 'upcoming' || status === 'locked') return 'shadow-purple-500/10';
    if (status === 'not-qualified') return 'shadow-red-500/15';
    if (status === 'paid') return 'shadow-fuchsia-500/15';
    if (userBidAmount) return 'shadow-green-500/15';
    if (isUserHighestBidder) return 'shadow-violet-500/20';
    return 'shadow-purple-500/15';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={isClickable ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      className="h-full w-full"
      layout={false}
    >
      <Card 
        className={`
          relative overflow-hidden h-full w-full border-2 backdrop-blur-xl shadow-xl transition-all duration-500
          bg-gradient-to-br ${getBackgroundGradient()} ${getBorderColor()} ${getShadowColor()}
          ${isClickable ? 'cursor-pointer hover:shadow-2xl' : 'cursor-default'}
        `}
        onClick={isClickable ? onClick : undefined}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Orb 1 - Purple/Violet/Green */}
          <motion.div
            className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full blur-3xl opacity-20"
            style={{
              background: status === 'winners-announced'
                ? 'radial-gradient(circle, #86EFAC, #34D399)'
                : isUserHighestBidder 
                ? 'radial-gradient(circle, #D8B4FE, #A78BFA)' 
                : status === 'completed'
                ? 'radial-gradient(circle, #C4B5FD, #8B5CF6)'
                : status === 'locked' || status === 'upcoming'
                ? 'radial-gradient(circle, #DDD6FE, #A78BFA)'
                : 'radial-gradient(circle, #C4B5FD, #8B5CF6)',
              top: '-15%',
              left: '-5%',
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 15, 0],
              y: [0, -15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Gradient Orb 2 - Purple/Violet/Green */}
          <motion.div
            className="absolute w-28 h-28 sm:w-40 sm:h-40 rounded-full blur-3xl opacity-15"
            style={{
              background: status === 'winners-announced'
                ? 'radial-gradient(circle, #34D399, #10B981)'
                : isUserHighestBidder 
                ? 'radial-gradient(circle, #A78BFA, #7C3AED)' 
                : status === 'completed'
                ? 'radial-gradient(circle, #A78BFA, #7C3AED)'
                : status === 'locked' || status === 'upcoming'
                ? 'radial-gradient(circle, #C4B5FD, #9333EA)'
                : 'radial-gradient(circle, #A78BFA, #7C3AED)',
              bottom: '-15%',
              right: '-5%',
            }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -10, 0],
              y: [0, 10, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          {/* Shimmer Effect */}
          {(status === 'open' || status === 'bidding') && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut"
              }}
            />
          )}
        </div>

        <CardContent className="p-3 sm:p-4 md:p-5 relative z-10">
          {/* Header with Title and Status */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-purple-900 truncate">
              {getBoxTitle()}
            </h3>
            
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Info Icon - Only show for round boxes */}
              {box.type === 'round' && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRoundInfo(true);
                  }}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100/50 hover:bg-purple-200/60 backdrop-blur-sm text-purple-700 flex items-center justify-center shadow-md transition-all"
                  title="View round rules"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                </motion.button>
              )}
              
              <div className={`
                flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border
                ${status === 'completed' 
                  ? 'bg-purple-100/80 text-purple-800 border-purple-300/50' 
                  : status === 'winners-announced'
                  ? 'bg-green-100/80 text-green-800 border-green-300/50'
                  : status === 'upcoming' || status === 'locked'
                  ? 'bg-purple-50/80 text-purple-700 border-purple-200/50'
                  : status === 'paid'
                  ? 'bg-fuchsia-100/80 text-fuchsia-800 border-fuchsia-300/50'
                  : 'bg-purple-100/80 text-purple-800 border-purple-300/50'
                }
              `}>
                {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                {status === 'winners-announced' && <Trophy className="w-3 h-3" />}
                {status === 'upcoming' && <Lock className="w-3 h-3" />}
                {status === 'locked' && <Lock className="w-3 h-3" />}
                {status === 'open' && <Zap className="w-3 h-3" />}
                {status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                {status === 'bidding' && <TrendingUp className="w-3 h-3" />}
                <span className="hidden xs:inline">
                  {status === 'completed' 
                    ? 'Completed' 
                    : status === 'winners-announced'
                    ? 'Winners'
                    : status === 'upcoming' 
                    ? 'Locked' 
                    : status === 'locked' 
                    ? 'Locked' 
                    : status === 'open' 
                    ? 'Open' 
                    : status === 'paid' 
                    ? 'Paid' 
                    : 'Active'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Main Icon Area with Spinning Animation */}
          <div className="flex flex-col items-center justify-center mb-3 sm:mb-4 py-2 sm:py-3 md:py-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="relative mb-2 sm:mb-3"
            >
              <div className={`
                w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl border-3 sm:border-4 border-white/60
                ${status === 'completed'
                  ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700'
                  : status === 'upcoming' || status === 'locked'
                  ? 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                  : status === 'paid'
                  ? 'bg-gradient-to-br from-fuchsia-500 via-fuchsia-600 to-purple-700'
                  : 'bg-gradient-to-br from-purple-600 via-purple-700 to-violet-800'
                }
              `}>
                {status === 'upcoming' || status === 'locked' ? (
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                ) : box.type === 'entry' ? (
                  <IndianRupee className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                ) : (
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                )}
              </div>

              {/* Active Status Badge - Purple/Violet */}
              {status === 'open' && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-400 to-violet-500 rounded-full flex items-center justify-center shadow-lg border-2 sm:border-3 border-white">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Timer Display */}
            {timeUntilOpen && !winnersAnnounced && isUserQualified !== false && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="bg-purple-600 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg border-2 border-purple-300/60">
                  <div className="flex items-center gap-1 sm:gap-1.5 text-white">
                    <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="font-mono font-semibold text-xs sm:text-sm">
                      {timeUntilOpen}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Information Section */}
          <div className="space-y-2 sm:space-y-2.5">
            {status === 'winners-announced' ? (
              <>
                {/* Winners Announced Info - Green */}
                <div className="bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-green-200/60">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-green-800 text-xs font-semibold mb-2">
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>Winners Announced</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-green-700 mb-2">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      Auction completed early (≤3 qualified)
                    </span>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2 mt-2 border border-green-200/50">
                    <p className="text-[10px] text-green-800 leading-relaxed">
                      This round was not played as final winners were determined in previous rounds.
                    </p>
                  </div>
                </div>

                {/* Prize Display for Winners Announced */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2 border border-amber-200/50">
                      <p className="text-[10px] text-amber-800 leading-relaxed">
                        <strong>Note:</strong> Prize allocated to earlier round winners due to early completion.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Stats Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-sm rounded-lg p-2 border border-blue-200/60">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span className="text-[10px] text-blue-700 font-medium">Qualifiers</span>
                    </div>
                    <p className="text-xs font-bold text-blue-900">Top 3 Players</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-violet-50/90 to-purple-50/90 backdrop-blur-sm rounded-lg p-2 border border-violet-200/60">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-violet-600" />
                      <span className="text-[10px] text-violet-700 font-medium">Strategy</span>
                    </div>
                    <p className="text-xs font-bold text-violet-900">Unique & High</p>
                  </div>
                </div>
              </>
            ) : status === 'completed' ? (
              <>
                {/* ✅ Completion Info with Round Time */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-purple-800 text-xs font-semibold mb-1 sm:mb-1.5">
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span>Round Completed</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-purple-700">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {getRoundTimeRange()}
                    </span>
                  </div>
                </div>

                {/* Prize Display for Completed Round */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Winner Card - Purple/Violet */}
                {box.highestBidFromAPI && box.highestBidFromAPI > 0 ? (
                  <>
                    <div className="bg-gradient-to-r from-violet-100/90 to-fuchsia-100/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-violet-300/60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs text-violet-700 font-medium">Highest Bid</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-violet-900 font-bold shrink-0 text-sm sm:text-base">
                          <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>{box.highestBidFromAPI.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {onShowLeaderboard && userHasPaidEntry && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowLeaderboard(box.roundNumber!);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>View Leaderboard</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60 text-center">
                    <div className="flex items-center justify-center gap-2 text-purple-600 text-xs sm:text-sm">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>No bids placed</span>
                    </div>
                  </div>
                )}
              </>
            ) : status === 'upcoming' ? (
              <>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60 text-center">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-purple-900 font-bold text-xs sm:text-sm">
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Pay Entry Fee to Unlock</span>
                  </div>
                </div>
                {/* ✅ Round Time Display for Upcoming */}
                {!winnersAnnounced && box.opensAt && box.closesAt && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-purple-700 mb-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">Scheduled Time</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-purple-900 truncate">
                      {getRoundTimeRange()}
                    </div>
                  </div>
                )}
                {/* Prize Display for Upcoming Round */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : status === 'locked' ? (
              <>
                {/* ✅ Round Time Display for Locked */}
                {!winnersAnnounced && box.opensAt && box.closesAt && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-purple-700 mb-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">Opens at</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-purple-900 truncate">
                      {getRoundTimeRange()}
                    </div>
                  </div>
                )}
                {/* Prize Display for Locked Round */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : status === 'paid' ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-fuchsia-200/60 text-center">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-fuchsia-800 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Entry Fee Paid</span>
                </div>
              </div>
            ) : status === 'not-qualified' ? (
              <>
                {/* Not Qualified Warning */}
                <div className="bg-red-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-red-300/60 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div className="text-xs sm:text-sm font-bold text-red-800">
                      Not Qualified
                    </div>
                    <div className="text-xs text-red-700">
                      You did not qualify from Round {(box.roundNumber || 1) - 1}. Only top 3 players can proceed.
                    </div>
                  </div>
                </div>
                {/* ✅ Round Time Display for Not Qualified */}
                {!winnersAnnounced && box.opensAt && box.closesAt && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-purple-700 mb-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">Round Time</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-purple-900 truncate">
                      {getRoundTimeRange()}
                    </div>
                  </div>
                )}
              </>
            ) : userBidAmount && box.opensAt && box.closesAt ? (
              <>
                {/* ✅ Round Timing Card with API times */}
                {!winnersAnnounced && (
                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-purple-200/60">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-purple-700 mb-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="font-medium">Round</span>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-purple-900 truncate">
                      {getRoundTimeRange()}
                    </div>
                  </div>
                )}

                {/* Prize Display for Round with User Bid */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Your Bid Card */}
                <div className="bg-gradient-to-r from-green-50/90 to-emerald-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-green-200/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-green-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                      <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>Your Bid</span>
                    </span>
                    <span className="text-green-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                      <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{userBidAmount.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Prize Display for Active Round */}
                {box.type === 'round' && box.prizeAmount && (
                  <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 border border-amber-200/60">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-amber-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>Round Prize</span>
                      </span>
                      <span className="text-amber-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                        <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{box.prizeAmount.toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Main Price Card */}
                <div className="bg-gradient-to-r from-purple-100/90 to-purple-50/90 backdrop-blur-sm rounded-xl p-2.5 sm:p-3.5 border border-purple-200/60">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-purple-700 font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span>{box.type === 'entry' ? 'Entry Fee' : 'Minimum Bid'}</span>
                    </span>
                    <span className="text-purple-900 font-bold text-base sm:text-lg flex items-center gap-0.5 shrink-0">
                      <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{(box.type === 'entry' ? box.entryFee : box.minBid)?.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Call to Action Button - Purple/Violet Gradient */}
            {/* ✅ Use canPlaceBid instead of isClickable for extra safety */}
            {canPlaceBid && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="rounded-xl p-2.5 sm:p-3.5 text-center font-bold shadow-lg hover:shadow-xl cursor-pointer transition-all bg-gradient-to-r from-purple-600 via-purple-700 to-violet-700 text-white">
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    {status === 'open' && box.type === 'round' && <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {status === 'open' && box.type === 'entry' && <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    {status === 'bidding' && <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    <span className="text-xs sm:text-sm">
                      {status === 'open' && box.type === 'entry' && 'Pay Entry Fee'}
                      {status === 'open' && box.type === 'round' && 'Place Your Bid'}
                      {status === 'bidding' && 'Place Bid'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </motion.div>
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
