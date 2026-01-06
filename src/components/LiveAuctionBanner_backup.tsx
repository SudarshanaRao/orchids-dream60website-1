import { Trophy, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LiveAuctionBannerProps {
  onBidNow?: () => void;
  currentRound?: number;
  userHasPaidEntry?: boolean;
}

export function LiveAuctionBanner({
  onBidNow,
  currentRound = 1,
  userHasPaidEntry = false,
}: LiveAuctionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-gradient-to-r from-[#1a0b2e] via-[#2d1b4d] to-[#1a0b2e] border-y border-purple-500/30 overflow-hidden relative"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-32 h-full bg-green-500 blur-[80px] animate-pulse" />
        <div className="absolute top-0 right-1/4 w-32 h-full bg-emerald-500 blur-[80px] animate-pulse delay-700" />
      </div>

      <div className="relative py-3 sm:py-4">
        <div className="flex items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute" />
              <div className="w-3 h-3 bg-green-400 rounded-full relative" />
            </div>
            <span className="text-sm sm:text-base font-bold text-white">
              Round {currentRound} is LIVE!
            </span>
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/20" />

          <span className="text-xs sm:text-sm text-purple-200">
            {userHasPaidEntry
              ? 'Place your bid before the round ends'
              : 'Pay Entry Fee now to participate and win!'}
          </span>

          {onBidNow && (
            <button
              onClick={onBidNow}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-black text-white transition-all shadow-lg active:scale-95 animate-pulse ${
                userHasPaidEntry
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400'
                  : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500'
              }`}
            >
              <Trophy className="w-4 h-4" />
              {userHasPaidEntry ? 'BID NOW' : 'PARTICIPATE NOW'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
