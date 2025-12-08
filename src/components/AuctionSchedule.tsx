import { Clock, Calendar, Trophy, Sparkles, IndianRupee, Star, Zap, Lock, Unlock, Radio, PlayCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentIST } from '../utils/timezone';
import { API_ENDPOINTS } from '../lib/api-config';

interface WinnerInfo {
  rank: number;
  playerId?: string;
  playerUsername?: string;
  finalBidAmount?: number;
  totalAmountPaid?: number;
  isPrizeClaimed?: boolean;
  prizeClaimedAt?: Date | null;
}

interface AuctionConfig {
  auctionNumber: number;
  auctionId: string;
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
}

type TabFilter = 'all' | 'live' | 'upcoming' | 'completed';

export function AuctionSchedule() {
  // ✅ Use IST time instead of browser local time
  const now = getCurrentIST();
  const currentHour = now.getHours();
  const [activeFilter, setActiveFilter] = useState<TabFilter>('all');
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleStats, setScheduleStats] = useState({
    totalAuctions: 0,
    earliestTime: '',
    latestTime: '',
    boxesPerAuction: 6 // Default fallback
  });
  
  // Fetch auction schedule from API
  useEffect(() => {
    const fetchAuctionSchedule = async () => {
      setIsLoading(true);
      try {
        
        const response = await fetch(`${API_ENDPOINTS.scheduler.dailyAuction}?`);
        const data = await response.json();
        
        if (response.ok && data.success && data.data?.dailyAuctionConfig) {
          // Map API data to schedule format
          const auctions = data.data.dailyAuctionConfig.map((auction: AuctionConfig, index: number) => {
            // ✅ Parse TimeSlot - backend sends in IST format (HH:MM)
            const [auctionHour, auctionMinute] = auction.TimeSlot.split(':').map(Number);
            const hour12 = auctionHour > 12 ? auctionHour - 12 : (auctionHour === 0 ? 12 : auctionHour);
            const period = auctionHour >= 12 ? 'PM' : 'AM';
            const timeStr = `${hour12}:${auctionMinute?.toString().padStart(2, '0') || '00'} ${period}`;
            
            // Map API Status to internal status
            let status = 'upcoming';
            let winner = null;
            
            if (auction.Status === 'LIVE') {
              status = 'active';
            } else if (auction.Status === 'COMPLETED') {
              status = 'completed';
              // ✅ Use real winner data from API instead of hardcoded values
              if (auction.topWinners && auction.topWinners.length > 0) {
                // Get rank 1 winner (the top winner)
                const topWinner = auction.topWinners.find((w: any) => w.rank === 1);
                if (topWinner && topWinner.playerUsername) {
                  winner = topWinner.playerUsername;
                }
              }
            } else if (auction.Status === 'UPCOMING') {
              status = 'upcoming';
            }
            
            return {
              time: timeStr,
              hour: auctionHour,
              minute: auctionMinute,
              status,
              prize: {
                name: auction.auctionName || `Auction ${index + 1}`,
                value: auction.prizeValue || 0,
                image: auction.imageUrl || 'https://images.unsplash.com/photo-1727093493878-874890b4f9fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpUGhvbmUlMjBzbWFydHBob25lJTIwbW9kZXJufGVufDF8fHx8MTc2Mjc5OTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080'
              },
              winner,
              roundCount: auction.roundCount || 4 // Get from backend or default to 4
            };
          });
          
          setScheduleData(auctions);
          
          // ✅ Calculate dynamic schedule statistics
          if (auctions.length > 0) {
            // Find earliest and latest time slots
            const sortedByTime = [...auctions].sort((a, b) => {
              const timeA = a.hour * 60 + a.minute;
              const timeB = b.hour * 60 + b.minute;
              return timeA - timeB;
            });
            
            const earliest = sortedByTime[0];
            const latest = sortedByTime[sortedByTime.length - 1];
            
            // Get boxes per auction (2 entry boxes + round count bidding boxes)
            const firstAuction = auctions[0];
            const totalBoxes = 2 + (firstAuction.roundCount || 4); // 2 entry boxes + bidding boxes
            
            setScheduleStats({
              totalAuctions: auctions.length,
              earliestTime: earliest.time,
              latestTime: latest.time,
              boxesPerAuction: totalBoxes
            });
          }
        } else {
          toast.error('Failed to load auction schedule');
        }
      } catch (error) {
        console.error('Error fetching auction schedule:', error);
        toast.error('Network error loading schedule');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctionSchedule();
    
    // ✅ Refresh every minute to keep status updated with IST time
    const refreshInterval = setInterval(() => {
      fetchAuctionSchedule();
    }, 60000); // Refresh every 60 seconds
    
    return () => clearInterval(refreshInterval);
  }, [currentHour]);

  // Filter auctions based on active filter
  const filteredAuctions = scheduleData.filter(auction => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'live') return auction.status === 'active';
    if (activeFilter === 'upcoming') return auction.status === 'upcoming';
    if (activeFilter === 'completed') return auction.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gradient-to-r from-purple-400 to-purple-500 text-white border-0';
      case 'active': return 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white border-0 shadow-lg shadow-purple-500/50';
      case 'upcoming': return 'bg-gradient-to-r from-purple-300 to-purple-400 text-white border-0';
      default: return 'bg-purple-400 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'active': return 'Live Now';
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
    <div className="relative space-y-6">
      {/* Header Section - No Card Background */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
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
              {scheduleStats.totalAuctions} premium auctions daily • {scheduleStats.earliestTime} - {scheduleStats.latestTime} • {scheduleStats.boxesPerAuction} boxes per auction
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 flex-wrap"
        >
          {[
            { id: 'all', label: 'ALL', icon: Calendar },
            { id: 'live', label: 'LIVE', icon: Radio },
            { id: 'upcoming', label: 'UPCOMING', icon: PlayCircle },
            { id: 'completed', label: 'COMPLETED', icon: Trophy }
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
                    : 'bg-white/80 text-purple-700 border-2 border-purple-200/60 hover:border-purple-300 hover:bg-purple-50/80'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {filter.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-700 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
        
      {/* Auctions List */}
      <div className="space-y-3">
        {filteredAuctions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 px-4"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-purple-900 mb-2">
                No Auctions At This Moment
              </h3>
              <p className="text-purple-600">
                {activeFilter === 'live' && "No auctions are currently live. Check back soon!"}
                {activeFilter === 'upcoming' && "No upcoming auctions scheduled right now."}
                {activeFilter === 'completed' && "No completed auctions to show yet."}
                {activeFilter === 'all' && "No auctions available at this time."}
              </p>
            </div>
          </motion.div>
        ) : (
          filteredAuctions.map((auction, index) => (
            <motion.div
              key={auction.hour}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
              layout
            >
              <div 
                className={`
                  relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                  ${auction.status === 'active' 
                    ? 'border-violet-300/70 bg-gradient-to-r from-violet-100/90 via-fuchsia-100/80 to-purple-100/70 shadow-xl shadow-purple-400/30 backdrop-blur-xl' 
                    : auction.status === 'completed'
                    ? 'border-purple-200/60 bg-gradient-to-r from-purple-50/80 to-violet-50/70 backdrop-blur-lg hover:shadow-lg'
                    : 'border-purple-200/60 bg-gradient-to-r from-white/80 to-purple-50/70 backdrop-blur-lg hover:shadow-lg hover:border-purple-300/70'
                  }
                `}
              >
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm pointer-events-none rounded-2xl" />
                
                {/* Active auction pulse animation */}
                {auction.status === 'active' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 rounded-2xl"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}

                <div className="relative z-10 p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    {/* Left side - Time and Status */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-br from-purple-500 to-purple-700`}>
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-bold text-purple-900">{auction.time}</span>
                          <Badge className={`${getStatusColor(auction.status)} text-xs flex items-center gap-2 rounded-2xl`} >
                            {auction.status === 'active' && (
                              <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Radio className="w-3 h-4" />
                              </motion.div>
                            )}
                            {auction.status === 'upcoming' && <PlayCircle className="w-4 h-4" />}
                            {getStatusText(auction.status)}
                          </Badge>
                        </div>
                        <div className="text-xs text-purple-600 mt-0.5">
                          Auction #{index + 1} of {scheduleData.length}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Prize with Image */}
                    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-purple-200/50 w-full lg:w-80">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-300/60 shadow-md shrink-0">
                        <ImageWithFallback 
                          src={auction.prize.image}
                          alt={auction.prize.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                          <Trophy className="w-3 h-3" />
                          <span>Prize</span>
                        </div>
                        <div className="font-bold text-purple-900 text-sm mb-1 line-clamp-2 h-10 leading-5">
                          {auction.prize.name}
                        </div>
                        <div className="flex items-center gap-0.5 text-violet-700 font-semibold text-sm">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>{auction.prize.value.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Winner info for completed auctions */}
                  {auction.winner && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 bg-purple-50/80 backdrop-blur-sm rounded-2xl p-2 border border-purple-200/60"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-purple-700">Winner</div>
                        <div className="text-sm font-bold text-purple-900">{auction.winner}</div>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Active auction CTA */}
                  {auction.status === 'active' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 backdrop-blur-sm rounded-2xl p-2.5 border-2 border-violet-300/60"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Zap className="w-5 h-5 text-violet-600" />
                      </motion.div>
                      <div>
                        <div className="text-sm font-bold text-violet-900">Entry opens 5 minutes early!</div>
                        <div className="text-xs text-violet-700">Pay one entry fee to unlock all 6 boxes (split into Box 1 & 2)</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Box Schedule Info - 6 BOXES TOTAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative overflow-hidden rounded-2xl border-2 border-purple-300/60 backdrop-blur-xl bg-gradient-to-br from-purple-50/90 via-violet-50/80 to-fuchsia-50/70 shadow-lg"
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm pointer-events-none rounded-2xl" />
        
        <div className="relative z-10 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-purple-900 text-sm sm:text-base">6 Box System (per auction)</h4>
          </div>
          
          {/* Entry Fee Boxes */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-purple-700" />
              <span className="text-xs sm:text-sm font-bold text-purple-800">Entry Fee Boxes (Opens 5 mins before auction)</span>
            </div>
            <div className="bg-purple-50/80 backdrop-blur-sm rounded-2xl p-3 border border-purple-300/60 mb-3">
              <p className="text-xs text-purple-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span><span className="font-semibold">One Payment:</span> Pay single entry fee (₹1,000-₹3,500) split across Box 1 & 2. Opens at <span className="font-bold">:55</span> (5 mins early)</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { box: 'Box 1', time: ':55-:15', desc: 'Half of entry fee' },
                { box: 'Box 2', time: ':55-:15', desc: 'Half of entry fee' }
              ].map((round, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="bg-gradient-to-br from-purple-100/90 to-purple-200/80 backdrop-blur-sm rounded-2xl p-3 border-2 border-purple-300/60 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-bold text-purple-900 text-sm">{round.box}</div>
                  </div>
                  <div className="text-xs text-purple-700 mb-1">
                    <span className="font-semibold">{round.time}</span>
                  </div>
                  <div className="text-[10px] text-purple-600">{round.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bidding Boxes */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Unlock className="w-4 h-4 text-violet-700" />
              <span className="text-xs sm:text-sm font-bold text-violet-800">Bidding Boxes (After Entry Payment)</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { box: 'Box 3', time: ':00-:15', unlock: 'Opens at :00' },
                { box: 'Box 4', time: ':15-:30', unlock: 'Opens at :15' },
                { box: 'Box 5', time: ':30-:45', unlock: 'Opens at :30' },
                { box: 'Box 6', time: ':45-:00', unlock: 'Opens at :45' }
              ].map((round, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + idx * 0.1 }}
                  className="bg-gradient-to-br from-violet-100/90 to-fuchsia-100/80 backdrop-blur-sm rounded-2xl p-3 border-2 border-violet-300/60 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-xl flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-bold text-violet-900 text-sm">{round.box}</div>
                  </div>
                  <div className="text-xs text-violet-700 mb-1">
                    <span className="font-semibold">{round.time}</span>
                  </div>
                  <div className="text-[10px] text-violet-600">{round.unlock}</div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-start gap-2 bg-violet-50/80 backdrop-blur-sm rounded-2xl p-3 border border-violet-200/60">
              <Star className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm text-violet-700">
                <span className="font-semibold">How it works:</span> Pay ONE entry fee at :55 (5 mins before auction). This unlocks Box 1 & 2 (your entry is split between them). Then Box 3, 4, 5, 6 open every 15 minutes for bidding.
              </p>
            </div>
            <div className="flex items-start gap-2 bg-purple-50/80 backdrop-blur-sm rounded-2xl p-3 border border-purple-200/60">
              <Clock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <p className="text-xs text-purple-700">
                <span className="font-semibold">Example Timeline:</span> If auction starts at 2:00 PM → Entry opens at 1:55 PM → Box 3 at 2:00 PM → Box 4 at 2:15 PM → Box 5 at 2:30 PM → Box 6 at 2:45 PM → Results at 3:00 PM
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}