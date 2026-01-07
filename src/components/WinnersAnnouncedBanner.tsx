import { useState, useEffect, useRef } from 'react';
import { Trophy, Sparkles, ChevronRight, Crown, Star } from 'lucide-react';
import { API_ENDPOINTS } from '@/lib/api-config';
import { motion } from 'framer-motion';

interface WinnersAnnouncedBannerProps {
  onBidNow?: () => void;
}

const BANNER_VISIBILITY_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const STORAGE_KEY = 'winnersAnnouncedBannerData';

interface StoredBannerData {
  winnersHash: string;
  lastUpdatedAt: number;
}

function generateWinnersHash(winners: any[], auctionName: string): string {
  const winnerIds = winners.map(w => w.playerId || w.id).sort().join('-');
  return `${auctionName}-${winnerIds}`;
}

export function WinnersAnnouncedBanner({
  onBidNow
}: WinnersAnnouncedBannerProps) {
  const [winners, setWinners] = useState<any[]>([]);
  const [auctionName, setAuctionName] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isWithin15Minutes, setIsWithin15Minutes] = useState(false);
  const lastWinnersHashRef = useRef<string>('');

  useEffect(() => {
    const checkVisibilityTimeout = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredBannerData = JSON.parse(stored);
        const elapsed = Date.now() - data.lastUpdatedAt;
        if (elapsed < BANNER_VISIBILITY_DURATION) {
          setIsWithin15Minutes(true);
          // Set a timeout to hide the banner when 15 minutes expire
          const remainingTime = BANNER_VISIBILITY_DURATION - elapsed;
          const timeout = setTimeout(() => {
            setIsWithin15Minutes(false);
          }, remainingTime);
          return () => clearTimeout(timeout);
        } else {
          setIsWithin15Minutes(false);
        }
      }
    };

    checkVisibilityTimeout();
  }, []);

  useEffect(() => {
    const fetchRecentWinners = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        if (!response.ok) return;

        const result = await response.json();

        let fetchedWinners: any[] = [];
        let fetchedAuctionName = '';

        if (result.success && result.data && result.data.winnersAnnounced) {
          const liveAuction = result.data;

          const lbResponse = await fetch(`${API_ENDPOINTS.scheduler.leaderboard}?hourlyAuctionId=${liveAuction.hourlyAuctionId}`);
          if (lbResponse.ok) {
            const lbResult = await lbResponse.json();
            if (lbResult.success && lbResult.data) {
              fetchedWinners = lbResult.data.slice(0, 3);
              fetchedAuctionName = liveAuction.auctionName || liveAuction.productName;
            }
          }
        } else {
          const dailyResponse = await fetch(API_ENDPOINTS.scheduler.dailyAuction);
          if (dailyResponse.ok) {
            const dailyResult = await dailyResponse.json();
            if (dailyResult.success && dailyResult.data && dailyResult.data.auctions) {
              const completedAuctions = dailyResult.data.auctions.filter((a: any) => a.winnersAnnounced || a.status === 'COMPLETED');
              if (completedAuctions.length > 0) {
                const lastAuction = completedAuctions[completedAuctions.length - 1];

                const lbResponse = await fetch(`${API_ENDPOINTS.scheduler.leaderboard}?hourlyAuctionId=${lastAuction.hourlyAuctionId}`);
                if (lbResponse.ok) {
                  const lbResult = await lbResponse.json();
                  if (lbResult.success && lbResult.data) {
                    fetchedWinners = lbResult.data.slice(0, 3);
                    fetchedAuctionName = lastAuction.auctionName;
                  }
                }
              }
            }
          }
        }

        if (fetchedWinners.length > 0) {
          const newHash = generateWinnersHash(fetchedWinners, fetchedAuctionName);
          
          // Check if data has changed
          const stored = localStorage.getItem(STORAGE_KEY);
          let storedData: StoredBannerData | null = stored ? JSON.parse(stored) : null;
          
          if (!storedData || storedData.winnersHash !== newHash) {
            // Data changed - update timestamp and show banner for 15 minutes
            const newData: StoredBannerData = {
              winnersHash: newHash,
              lastUpdatedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            setIsWithin15Minutes(true);
            lastWinnersHashRef.current = newHash;
            
            // Set timeout to hide after 15 minutes
            setTimeout(() => {
              setIsWithin15Minutes(false);
            }, BANNER_VISIBILITY_DURATION);
          } else {
            // Data hasn't changed - check if still within 15 minutes
            const elapsed = Date.now() - storedData.lastUpdatedAt;
            if (elapsed < BANNER_VISIBILITY_DURATION) {
              setIsWithin15Minutes(true);
            } else {
              setIsWithin15Minutes(false);
            }
          }
          
          setWinners(fetchedWinners);
          setAuctionName(fetchedAuctionName);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error fetching recent winners:', error);
      }
    };

    fetchRecentWinners();
    const interval = setInterval(fetchRecentWinners, 30000);
    return () => clearInterval(interval);
  }, []);

  const shouldShowBanner = () => {
    // Only show banner if there are winners AND we're within 15 minutes of data change
    if (isVisible && winners.length > 0 && isWithin15Minutes) {
      return true;
    }

    return false;
  };

  if (!shouldShowBanner()) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4d] to-[#1a0b2e] border-y border-purple-500/30 overflow-hidden relative"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-full bg-purple-500 blur-[80px] animate-pulse" />
        <div className="absolute top-0 right-1/4 w-32 h-full bg-indigo-500 blur-[80px] animate-pulse delay-700" />
      </div>

      <div className="relative py-2 sm:py-3">
        <div className="marquee-container overflow-hidden">
          <div className="marquee-content flex items-center whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 mx-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-400/30 backdrop-blur-sm">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tighter">
                    Winners Announced: {auctionName}
                  </span>
                </div>

                {winners.map((winner, idx) => (
                  <div key={winner.playerId} className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-sm ${
                      idx === 0
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                        : idx === 1
                        ? 'bg-slate-300/10 border-slate-300/30 text-slate-200'
                        : 'bg-amber-600/10 border-amber-600/30 text-amber-200'
                    }`}>
                      {idx === 0 ? <Crown className="w-3.5 h-3.5 fill-yellow-500/20" /> : <Star className="w-3.5 h-3.5" />}
                      <span className="text-xs font-bold">#{idx + 1}</span>
                      <span className="text-xs sm:text-sm font-black tracking-wide uppercase">
                        {winner.playerUsername || winner.username}
                      </span>
                      <div className="w-px h-3 bg-white/20 mx-1" />
                      <span className="text-[10px] sm:text-xs font-mono font-bold opacity-80">
                        ₹{winner.auctionPlacedAmount?.toLocaleString() || winner.bid?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 group cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'leaderboard' }))}>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:animate-spin" />
                    <span className="text-[10px] sm:text-xs font-bold text-purple-300 group-hover:text-white transition-colors">
                      VIEW ALL WINNERS
                    </span>
                    <ChevronRight className="w-3 h-3 text-purple-400" />
                  </div>

                  {onBidNow && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBidNow();
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full text-[10px] sm:text-xs font-black text-white hover:from-purple-500 hover:to-violet-500 transition-all shadow-lg active:scale-95"
                    >
                      <Trophy className="w-3 h-3" />
                      BID NOW
                    </button>
                  )}
                </div>

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
          animation: scroll-winners 30s linear infinite;
          width: fit-content;
        }
        .marquee-content:hover {
          animation-play-state: paused;
        }
        @keyframes scroll-winners {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-25%);
          }
        }
      `}</style>
    </motion.div>
  );
}
