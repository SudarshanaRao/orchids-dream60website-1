import { useState, useEffect, useCallback } from 'react';
import Snowfall from 'react-snowfall';
import { Trophy, Clock, Sparkles, X, Gift, ChevronRight, AlertTriangle, XCircle, Award, Timer } from 'lucide-react';
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
    // Fallback to localStorage if userId prop is missing
    const effectiveUserId = userId || localStorage.getItem('user_id');
    
    if (!effectiveUserId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.scheduler.userAuctionHistory}?userId=${effectiveUserId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data)) {
          // Sort by completedAt desc to find the most recent one
          const sortedData = [...result.data].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );

          // Find the most recent pending claim with rank 1, 2, or 3
          const pendingAuction = sortedData.find((item: any) => 
            item.prizeClaimStatus === 'PENDING' && 
            [1, 2, 3].includes(item.finalRank)
          );

          if (pendingAuction) {
            const data = pendingAuction;
            
            // Map the result status
            const status = data.finalRank === 1 ? 'WIN' : 'WAITING';
            
            // Check if within deadline
            const deadline = data.claimDeadline ? new Date(data.claimDeadline).getTime() : 
                           (new Date(data.completedAt).getTime() + 15 * 60 * 1000);
            const now = serverTime?.timestamp || Date.now();

            if (now < deadline) {
              // Check if user manually closed this specific banner
              const closedKey = `closed_banner_${data._id}_${data.completedAt}`;
              if (localStorage.getItem(closedKey) !== 'true') {
                setBannerType(status);
                setBannerData({
                  ...data,
                  resultStatus: status,
                  resultAnnouncedAt: data.completedAt,
                  queuePosition: data.finalRank,
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
          } else {
            setIsVisible(false);
            setBannerType(null);
          }
        } else {
          setIsVisible(false);
          setBannerType(null);
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
      const closedKey = `closed_banner_${bannerData._id}_${bannerData.completedAt}`;
      localStorage.setItem(closedKey, 'true');
    }
  };

  if (isLoading || !isVisible || !bannerType || bannerType === 'QUALIFIED') return null;

  const getBannerConfig = () => {
    switch (bannerType) {
      case 'WIN':
        return {
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          icon: <Trophy className="w-5 h-5 text-white animate-bounce" />,
          message: `🎉 Congratulations! You won the "${bannerData.auctionName}" round.`,
          subMessage: "Claim your prize now!",
          buttonText: "CLAIM NOW",
          navigateTo: "history"
        };
      case 'WAITING':
        return {
          gradient: 'from-blue-600 via-indigo-500 to-violet-500',
          icon: <Clock className="w-5 h-5 text-white animate-spin-slow" />,
          message: `⏳ You are in the waiting list for "${bannerData.auctionName}". Rank #${bannerData.queuePosition}.`,
          subMessage: "Kindly check the details in history.",
          buttonText: "CHECK STATUS",
          navigateTo: "history"
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div className="sticky top-[60px] sm:top-[76px] z-[45] w-full overflow-hidden shadow-lg border-b border-white/10">
      <div className={`relative py-3 bg-gradient-to-r ${config.gradient}`}>
        <Snowfall color="white" snowflakeCount={isMobile ? 2 : 15} radius={[1.5, 3.5]} speed={[0.2, 0.6]} />
        <button
          onClick={handleClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-center justify-center gap-4 px-8 text-center sm:text-left flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3">
            {config.icon}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                {config.message}
              </span>
              <span className="text-xs text-white/80">
                {config.subMessage}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
              <Timer className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-white">
                Expires in: {timeLeft}
              </span>
            </div>

            <button
              onClick={() => onNavigate(config.navigateTo)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black uppercase bg-white text-gray-900 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              {config.buttonText}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
