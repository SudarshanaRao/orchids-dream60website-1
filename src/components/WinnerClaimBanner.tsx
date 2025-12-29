import { useState, useEffect, useCallback } from 'react';
import Snowfall from 'react-snowfall';
import { Trophy, Clock, X, ChevronRight, Timer } from 'lucide-react';
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
  | 'QUALIFIED'
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

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${effectiveUserId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
          // Get the absolute latest auction entry
          const sortedData = [...result.data].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          const latestAuction = sortedData[0];
          const now = serverTime?.timestamp || Date.now();
          const completedAtTime = new Date(latestAuction.completedAt).getTime();
          const fifteenMinsInMs = 15 * 60 * 1000;
          const isWithin15Mins = (now - completedAtTime) < fifteenMinsInMs;

          if (isWithin15Mins) {
            let status: BannerType = 'NOT_QUALIFIED';
            
            if ([1, 2, 3].includes(latestAuction.finalRank)) {
              const isEligibleToClaim = 
                latestAuction.finalRank === latestAuction.currentEligibleRank || 
                (latestAuction.claimNotes && latestAuction.claimNotes.toLowerCase().includes(`rank ${latestAuction.finalRank} is now eligible to claim`));

              status = isEligibleToClaim ? 'WIN' : 'WAITING';
            }

            const deadline = completedAtTime + fifteenMinsInMs;
            const closedKey = `closed_banner_${latestAuction._id}_${latestAuction.completedAt}_${status}`;
            
            if (localStorage.getItem(closedKey) !== 'true') {
              setBannerType(status);
              setBannerData({
                ...latestAuction,
                resultStatus: status,
                resultAnnouncedAt: latestAuction.completedAt,
                queuePosition: latestAuction.finalRank,
                deadline: deadline
              });
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          } else {
            setIsVisible(false);
            setBannerType(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching banner status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, serverTime]);

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
          message: `🎉 CONGRATULATIONS! YOU WON THE "${bannerData.auctionName.toUpperCase()}" ROUND! CLAIM YOUR PRIZE NOW BEFORE IT EXPIRES!`,
          buttonText: "CLAIM NOW",
          navigateTo: "history"
        };
      case 'WAITING':
        return {
          gradient: 'from-blue-700 via-indigo-600 to-violet-700',
          icon: <Clock className="w-5 h-5 text-white" />,
          message: `⏳ YOU ARE IN THE WAITING LIST FOR "${bannerData.auctionName.toUpperCase()}". YOUR RANK IS #${bannerData.queuePosition}. CHECK STATUS IN HISTORY!`,
          buttonText: "CHECK STATUS",
          navigateTo: "history"
        };
      case 'NOT_QUALIFIED':
        return {
          gradient: 'from-slate-700 via-gray-600 to-zinc-700',
          icon: <X className="w-5 h-5 text-white" />,
          message: `📢 RESULTS ANNOUNCED FOR "${bannerData.auctionName.toUpperCase()}". YOUR RANK IS #${bannerData.queuePosition}. BETTER LUCK NEXT TIME!`,
          buttonText: "VIEW LEADERBOARD",
          navigateTo: "history"
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
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <div className="flex items-center gap-4 whitespace-nowrap animate-marquee px-4">
            {/* Repeated text for seamless loop */}
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 mr-12">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <span className="text-sm sm:text-base font-black text-white tracking-tighter uppercase italic">
                    {config.message}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full border border-white/20 backdrop-blur-sm">
                  <Timer className="w-4 h-4 text-yellow-300" />
                  <span className="text-xs font-bold text-white tabular-nums">
                    EXPIRES IN: {timeLeft}
                  </span>
                </div>

                <button
                  onClick={() => onNavigate(config.navigateTo)}
                  className="flex items-center gap-1 px-4 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase bg-white text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  {config.buttonText}
                  <ChevronRight className="w-3 h-3" />
                </button>
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
          100% { transform: translateX(-25%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
