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
          <div className="space-y-4 sm:space-y-5 relative p-1">
            {!auction.userHasPaidEntry && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/5 backdrop-blur-[1px] rounded-[2rem] border-4 border-dotted border-purple-400/30">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                  <div className="w-20 h-20 bg-purple-100/50 rounded-full flex items-center justify-center border-2 border-purple-200/50">
                    <Lock className="w-10 h-10 text-purple-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-4xl sm:text-6xl font-black text-purple-900/10 tracking-[0.2em] uppercase select-none">
                      LOCKED
                    </h3>
                    <p className="text-purple-600 font-bold text-xs sm:text-sm uppercase tracking-widest mt-2 animate-bounce">
                      Pay Entry Fee to Unlock Grid
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div 
            className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 transition-all duration-700 ${!auction.userHasPaidEntry ? 'opacity-30 blur-[4px] grayscale' : 'opacity-100 blur-0 grayscale-0'}`}
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