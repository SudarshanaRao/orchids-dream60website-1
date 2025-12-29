import { useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Lock } from 'lucide-react';
import { AuctionBox } from './AuctionBox';
import { BidModal } from './BidModal';

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
  }>;
}

interface AuctionGridProps {
  auction: {
    boxes: Box[];
    prizeValue: number;
    userBidsPerRound?: { [roundNumber: number]: number };
    userHasPaidEntry?: boolean;
    userQualificationPerRound?: { [roundNumber: number]: boolean };
    winnersAnnounced?: boolean; // NEW: Early completion flag
    userEntryFee?: number; // NEW: User's entry fee amount
    hourlyAuctionId?: string | null; // ✅ Add auction ID to detect changes
  };
  user: {
    username: string;
  };
  onBid: (boxId: number, amount: number) => void;
  onShowLeaderboard?: (roundNumber: number, leaderboard: any[], opensAt?: Date, closesAt?: Date) => void;
  serverTime?: { timestamp: number } | null; // ✅ Add server time prop
  isJoinWindowOpen: boolean;
}

export function AuctionGrid({ auction, user, onBid, onShowLeaderboard, serverTime, isJoinWindowOpen }: AuctionGridProps) {
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

  // ✅ Add null safety check for auction and boxes
  if (!auction || !auction.boxes) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600">Loading auction data...</p>
        </div>
      </div>
    );
  }

  const handleBoxClick = (box: Box) => {
    if (box.isOpen && !(box.type === 'entry' && box.hasPaid)) {
      setSelectedBox(box);
      setShowBidModal(true);
    }
  };

  const handleBid = (amount: number) => {
    if (selectedBox) {
      const actualAmount = selectedBox.type === 'entry' ? selectedBox.entryFee! : amount;
      onBid(selectedBox.id, actualAmount);
      setShowBidModal(false);
      setSelectedBox(null);
    }
  };

  const roundBoxes = auction.boxes.filter(box => box.type === 'round');

    console.log('🎯 [AUCTION GRID] Visibility check:', {
      userHasPaidEntry: auction.userHasPaidEntry,
      roundBoxesCount: roundBoxes.length
    });

  return (
    <div className="relative">
      <motion.div 
        layout
        className="space-y-6 sm:space-y-8"
        initial={false}
      >
        {/* Prize Showcase Card */}
        <div className="relative overflow-hidden">
          {!auction.userHasPaidEntry ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/50 to-violet-50/50 border border-purple-100/50 p-6 sm:p-8 h-[180px] sm:h-[220px] flex items-center justify-center animate-in fade-in duration-500">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6 text-purple-400 opacity-50" />
                </div>
                <p className="text-sm font-medium text-purple-400">Complete Entry to Unlock Prize Details</p>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden animate-in zoom-in-95 duration-500">
              {/* Animated Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
                  style={{
                    background: 'radial-gradient(circle, #C4B5FD, #8B5CF6)',
                    top: '-30%',
                    right: '-20%',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 20, 0],
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
                  style={{
                    background: 'radial-gradient(circle, #A78BFA, #7C3AED)',
                    bottom: '-20%',
                    left: '-15%',
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -15, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>
            </div>
          )}
        </div>

            {/* Bidding Rounds Section */}
            <div className="space-y-4 sm:space-y-5 relative p-1 group">
              {!auction.userHasPaidEntry && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[2.5rem] border-[6px] border-dotted border-purple-500/40 bg-gradient-to-br from-purple-900/10 via-transparent to-purple-900/10 backdrop-blur-[3px] transition-all duration-700 overflow-hidden group-hover:border-purple-500/60 shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)]">
                  {/* Enhanced Watermark Grid */}
                  <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 grid-rows-3 gap-8 p-8 pointer-events-none opacity-[0.03] select-none">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="flex items-center justify-center rotate-[-25deg] scale-150">
                        <span className="text-4xl font-black tracking-tighter uppercase whitespace-nowrap">
                          LOCKED
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Light Rays */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      animate={{
                        x: ['-100%', '100%'],
                        opacity: [0, 0.3, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent skew-x-12"
                    />
                  </div>
                  
                  <div className="relative flex flex-col items-center gap-8">
                    <motion.div 
                      initial={{ scale: 1 }}
                      animate={{ 
                        scale: [1, 1.15, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{ 
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="relative w-28 h-28 sm:w-32 sm:h-32"
                    >
                      {/* Outer Glow Ring */}
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse" />
                      
                      {/* Glass Container */}
                      <div className="absolute inset-0 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(168,85,247,0.2)]">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 duration-500">
                          <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                        </div>
                      </div>

                      {/* Floating Orbs */}
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-4 h-4 bg-purple-400 rounded-full blur-sm"
                      />
                      <motion.div 
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                        className="absolute -bottom-2 -left-2 w-6 h-6 bg-violet-400 rounded-full blur-sm"
                      />
                    </motion.div>
                    
                    <div className="text-center space-y-4">
                      <div className="relative inline-block">
                        <h3 className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-900/20 to-purple-900/5 tracking-tighter uppercase select-none transition-all duration-1000 group-hover:from-purple-900/30 group-hover:to-purple-900/10">
                          LOCKED
                        </h3>
                        {/* Shimmer Effect on Text */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                          <motion.div
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                            className="w-1/2 h-full bg-white/10 skew-x-12 blur-md"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-purple-400/30" />
                        <span className="text-purple-600/60 font-black text-[10px] sm:text-xs uppercase tracking-[0.5em] whitespace-nowrap">
                          Premium Access
                        </span>
                        <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-purple-400/30" />
                      </div>

                      <motion.p 
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-purple-700 font-bold text-sm sm:text-base tracking-wide"
                      >
                        Pay entry fee to unlock bidding
                      </motion.p>
                    </div>
                  </div>
                </div>
              )}

            <div 
              className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 transition-all duration-1000 ${!auction.userHasPaidEntry ? 'opacity-30 blur-[8px] grayscale scale-[0.99] pointer-events-none' : 'opacity-100 blur-0 grayscale-0 scale-100'}`}
            >
            {(auction.userHasPaidEntry ? roundBoxes : [1, 2, 3, 4]).map((item, idx) => (
              <div key={typeof item === 'number' ? `placeholder-${item}` : item.id}>
                {typeof item === 'number' ? (
                  <div className="bg-white/40 border-2 border-dotted border-purple-300 rounded-2xl h-[280px] sm:h-[320px] flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                      <Lock className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="h-4 w-24 bg-purple-50 rounded-full" />
                    <div className="h-8 w-32 bg-purple-50 rounded-lg" />
                  </div>
                ) : (
                  <AuctionBox
                    box={item}
                    onClick={() => handleBoxClick(item)}
                    isUserHighestBidder={item.bidder === user?.username}
                    onShowLeaderboard={onShowLeaderboard}
                    userHasPaidEntry={auction.userHasPaidEntry}
                    userBidAmount={item.roundNumber ? auction.userBidsPerRound?.[item.roundNumber] : undefined}
                    isUserQualified={item.roundNumber ? auction.userQualificationPerRound?.[item.roundNumber] : undefined}
                    winnersAnnounced={auction.winnersAnnounced}
                    serverTime={serverTime}
                    hourlyAuctionId={auction.hourlyAuctionId} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {showBidModal && selectedBox && (
        <BidModal
          box={selectedBox}
          prizeValue={auction.prizeValue}
          onBid={handleBid}
          onClose={() => {
            setShowBidModal(false);
            setSelectedBox(null);
          }}
          userPreviousBid={
            selectedBox.roundNumber && selectedBox.roundNumber > 1
              ? auction.userBidsPerRound?.[selectedBox.roundNumber - 1]
              : undefined
          }
          userHasBidInRound={
            selectedBox.roundNumber
              ? !!auction.userBidsPerRound?.[selectedBox.roundNumber]
              : false
          }
          isUserQualified={
            selectedBox.roundNumber
              ? auction.userQualificationPerRound?.[selectedBox.roundNumber]
              : undefined
          }
          userEntryFee={auction.userEntryFee}
        />
      )}
    </div>
  );
}