import { useState, useEffect, useCallback } from 'react';
import Snowfall from 'react-snowfall';
import { 
  Trophy, 
  Clock, 
  X, 
  ChevronRight, 
  Timer, 
  Gift,
  AlertTriangle,
  History
} from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';

interface WinnerClaimBannerProps {
  userId: string;
  onNavigate: (page: string, data?: any) => void;
  serverTime: any;
}

type BannerType = 
  | 'WIN' 
  | 'WAITING' 
  | 'NOT_QUALIFIED' 
  | 'CLAIMED'
  | 'EXPIRED'
  | null;

export function WinnerClaimBanner({ userId, onNavigate, serverTime }: WinnerClaimBannerProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [bannerType, setBannerType] = useState<BannerType>(null);
  const [bannerData, setBannerData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBannerStatus = useCallback(async () => {
    const effectiveUserId = userId || localStorage.getItem('user_id');
    
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    // ✅ Try to load from cache first for "ASAP" rendering
    const cachedData = localStorage.getItem(`banner_cache_${effectiveUserId}`);
    if (cachedData && isLoading) {
      try {
          const parsed = JSON.parse(cachedData);
          const isSameDay = new Date(parsed.timestamp).getUTCDate() === new Date().getUTCDate();
          if (isSameDay && (Date.now() - parsed.timestamp < 10000)) { // 10 seconds cache within same day
            setBannerType(parsed.type);
            setBannerData(parsed.data);
            setIsVisible(true);
            setIsLoading(false);
          } else {
            localStorage.removeItem(`banner_cache_${effectiveUserId}`);
          }
      } catch (e) {}
    }

      try {
        // ✅ Use limit=5 for faster API response, added cache-busting
        const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${effectiveUserId}&limit=5&t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          const sortedData = [...result.data].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          const latestAuction = sortedData[0];
          const now = serverTime?.timestamp || Date.now();
          const completedAtTime = new Date(latestAuction.completedAt).getTime();
          
          // Slot durations as requested: 15m for 2nd, 30m for 3rd (cumulative)
          // This implies 15m slots for each rank
          const SLOT_DURATION = 15 * 60 * 1000;
          const totalBannerVisibility = 45 * 60 * 1000; // Show for 45 minutes total
          const isWithinBannerTime = (now - completedAtTime) < totalBannerVisibility;

          if (isWithinBannerTime) {
            let status: BannerType = 'NOT_QUALIFIED';
            const rank = latestAuction.finalRank;
            const currentEligibleRank = latestAuction.currentEligibleRank || 1;
            const claimNotes = latestAuction.claimNotes || '';
            const isWinner = latestAuction.isWinner;

            // 1. Keyword Check (Priority)
            if (claimNotes.toLowerCase().includes('successfully') || latestAuction.claimedAt) {
              status = 'CLAIMED';
            } 
            else if (claimNotes.toLowerCase().includes('expired') || claimNotes.toLowerCase().includes('forfeited')) {
              status = 'EXPIRED';
            }
            // 2. Winner Status Check
            else if (isWinner && [1, 2, 3].includes(rank)) {
              if (rank === currentEligibleRank) {
                status = 'WIN';
              } else if (rank > currentEligibleRank) {
                status = 'WAITING';
              } else {
                status = 'EXPIRED';
              }
            } else {
              status = 'NOT_QUALIFIED';
            }

            // 3. Deadline Calculation
            let deadline = completedAtTime + (currentEligibleRank * SLOT_DURATION);
            let timerLabel = "EXPIRES IN";

            if (status === 'WAITING') {
              deadline = completedAtTime + ((rank - 1) * SLOT_DURATION);
              timerLabel = "STARTS IN";
            } else if (status === 'CLAIMED' || status === 'EXPIRED' || status === 'NOT_QUALIFIED') {
              deadline = completedAtTime + totalBannerVisibility;
              timerLabel = "BANNER ENDS";
            }

            const closedKey = `closed_banner_${latestAuction._id}_${latestAuction.completedAt}_${status}`;
            
            if (localStorage.getItem(closedKey) !== 'true') {
              const newBannerData = {
                ...latestAuction,
                resultStatus: status,
                resultAnnouncedAt: latestAuction.completedAt,
                queuePosition: rank || (latestAuction.eliminatedInRound ? `Eliminated R${latestAuction.eliminatedInRound}` : 'N/A'),
                deadline: deadline,
                timerLabel: timerLabel,
                claimedByRank: latestAuction.claimedByRank,
                claimNotes: claimNotes
              };

              setBannerType(status);
              setBannerData(newBannerData);
              setIsVisible(true);

              // ✅ Cache the result
              localStorage.setItem(`banner_cache_${effectiveUserId}`, JSON.stringify({
                type: status,
                data: newBannerData,
                timestamp: Date.now()
              }));
            } else {
              setIsVisible(false);
            }
          } else {
            setIsVisible(false);
            setBannerType(null);
            localStorage.removeItem(`banner_cache_${effectiveUserId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching banner status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, serverTime, isLoading]);

  useEffect(() => {
    fetchBannerStatus();
    const interval = setInterval(fetchBannerStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchBannerStatus]);

  useEffect(() => {
    if (!bannerData || !serverTime) return;

    const updateTimer = () => {
      const now = serverTime.timestamp || Date.now();
      const expiresAt = bannerData.deadline;
      const diff = expiresAt - now;

      if (diff <= 0) {
        setIsVisible(false);
        setBannerType(null);
      } else {
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [bannerData, serverTime]);

  const handleClose = () => {
    setIsVisible(false);
    if (bannerData) {
      const closedKey = `closed_banner_${bannerData._id}_${bannerData.completedAt}_${bannerType}`;
      localStorage.setItem(closedKey, 'true');
    }
  };

  if (isLoading || !isVisible || !bannerType || bannerType === 'QUALIFIED') return null;

  const getBannerConfig = () => {
    switch (bannerType) {
      case 'WIN':
        return {
          gradient: 'from-emerald-600 via-green-500 to-teal-600',
          icon: <Trophy className="w-5 h-5 text-white" />,
          message: `🎉 CONGRATULATIONS! YOU ARE CURRENTLY ELIGIBLE TO CLAIM THE "${bannerData.auctionName.toUpperCase()}" PRIZE! CLAIM IT NOW!`,
          buttonText: "CLAIM NOW",
          navigateTo: "history",
          timerLabel: "EXPIRES IN"
        };
      case 'WAITING':
        return {
          gradient: 'from-blue-700 via-indigo-600 to-violet-700',
          icon: <Clock className="w-5 h-5 text-white" />,
          message: `⏳ YOU ARE IN THE WAITING LIST FOR "${bannerData.auctionName.toUpperCase()}". YOUR RANK IS #${bannerData.finalRank}. CURRENTLY RANK #${bannerData.currentEligibleRank} IS CLAIMING.`,
          buttonText: "CHECK STATUS",
          navigateTo: "history",
          timerLabel: "STARTS IN"
        };
      case 'CLAIMED':
        const claimedBy = bannerData.claimedByRank ? `RANK #${bannerData.claimedByRank}` : 'ANOTHER WINNER';
        return {
          gradient: 'from-purple-800 via-violet-700 to-indigo-800',
          icon: <Gift className="w-5 h-5 text-white" />,
          message: `🎁 THE PRIZE FOR "${bannerData.auctionName.toUpperCase()}" HAS BEEN CLAIMED BY ${claimedBy}. ${bannerData.claimNotes || ''}`,
          buttonText: "VIEW DETAILS",
          navigateTo: "history",
          timerLabel: "BANNER ENDS"
        };
      case 'EXPIRED':
        return {
          gradient: 'from-red-800 via-rose-700 to-orange-800',
          icon: <Timer className="w-5 h-5 text-white" />,
          message: `⚠️ THE CLAIM PERIOD FOR "${bannerData.auctionName.toUpperCase()}" HAS EXPIRED OR BEEN FORFEITED. ${bannerData.claimNotes || ''}`,
          buttonText: "VIEW HISTORY",
          navigateTo: "history",
          timerLabel: "BANNER ENDS"
        };
      case 'NOT_QUALIFIED':
        return {
          gradient: 'from-slate-800 via-zinc-700 to-gray-800',
          icon: <X className="w-5 h-5 text-white" />,
          message: `📢 "${bannerData.auctionName.toUpperCase()}" RESULTS: YOU RANKED #${bannerData.finalRank || bannerData.queuePosition}. BETTER LUCK NEXT TIME!`,
          buttonText: "VIEW DETAILS",
          navigateTo: "history",
          timerLabel: "EXPIRES IN"
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className="sticky top-[60px] sm:top-[76px] z-[45] w-full overflow-hidden shadow-2xl border-b border-white/20">
      <div className={`relative h-12 flex items-center bg-gradient-to-r ${config.gradient}`}>
        <Snowfall color="white" snowflakeCount={isMobile ? 5 : 20} radius={[1.5, 3.5]} speed={[0.2, 0.6]} />
        
        {/* Marquee Container */}
        <div className="flex-1 overflow-hidden h-full flex items-center relative group">
          <div className="flex items-center gap-4 whitespace-nowrap animate-marquee px-4">
            {/* Repeated text for seamless loop - using 8 copies for absolute continuity */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 mr-12 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                    {config.icon}
                  </div>
                  <span className="text-sm sm:text-[15px] font-black text-white tracking-tight uppercase italic drop-shadow-sm">
                    {config.message}
                  </span>
                </div>
                
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-md shadow-inner">
                    <Timer className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-xs font-extrabold text-white tabular-nums tracking-wider">
                      {bannerData.timerLabel || config.timerLabel}: {timeLeft}
                    </span>
                  </div>

                <button
                  onClick={() => onNavigate(config.navigateTo)}
                  className="flex items-center gap-1.5 px-5 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase bg-white text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-white/20"
                >
                  {config.buttonText}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                
                <div className="h-4 w-[2px] bg-white/30 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="relative z-10 px-4 h-full flex items-center bg-black/10 hover:bg-black/20 transition-colors border-l border-white/10"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-12.5%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
