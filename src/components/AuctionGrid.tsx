import { useState } from 'react';
import { motion } from 'motion/react';
import { AuctionBox } from './AuctionBox';
import { BidModal } from './BidModal';
import { Lock } from 'lucide-react';

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
  const canShowBoxes = isJoinWindowOpen || auction.userHasPaidEntry;
  const showGuestPreview = isJoinWindowOpen && !auction.userHasPaidEntry;

  console.log('🎯 [AUCTION GRID] Visibility check:', {
    isJoinWindowOpen,
    userHasPaidEntry: auction.userHasPaidEntry,
    canShowBoxes,
    showGuestPreview,
    roundBoxesCount: roundBoxes.length
  });

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
        {/* Prize Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden"
        >
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
        </motion.div>

        {/* Bidding Rounds Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 sm:space-y-5"
        >
          {canShowBoxes ? (
            <>
              {showGuestPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl border border-purple-200/60 bg-white/80 backdrop-blur-md p-4 shadow-lg"
                >
                  <div className="flex items-center gap-2 text-purple-800 font-semibold text-sm sm:text-base">
                    <Lock className="w-4 h-4" />
                    <span>Join within the first 15 minutes to participate. Boxes are preview-only until you pay the entry fee.</span>
                  </div>
                </motion.div>
              )}

              <motion.div 
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {roundBoxes.map((box) => (
                  <motion.div
                    key={box.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        transition: {
                          duration: 0.5
                        }
                      }
                    }}
                  >
                    <AuctionBox
                      box={box}
                      onClick={() => handleBoxClick(box)}
                      isUserHighestBidder={box.bidder === user.username}
                      onShowLeaderboard={onShowLeaderboard}
                      userHasPaidEntry={auction.userHasPaidEntry}
                      userBidAmount={box.roundNumber ? auction.userBidsPerRound?.[box.roundNumber] : undefined}
                      isUserQualified={box.roundNumber ? auction.userQualificationPerRound?.[box.roundNumber] : undefined}
                      winnersAnnounced={auction.winnersAnnounced}
                      serverTime={serverTime}
                      hourlyAuctionId={auction.hourlyAuctionId} 
                    />
                  </motion.div>
                ))}
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-purple-50/90 via-violet-50/80 to-purple-100/90 backdrop-blur-xl border-2 border-purple-200/60 rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
                  style={{
                    background: 'radial-gradient(circle, #DDD6FE, #A78BFA)',
                    top: '-20%',
                    right: '-10%',
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                    x: [0, 10, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute w-48 h-48 rounded-full blur-3xl opacity-15"
                  style={{
                    background: 'radial-gradient(circle, #C4B5FD, #9333EA)',
                    bottom: '-15%',
                    left: '-5%',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    y: [0, 10, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />
              </div>

              <div className="relative flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="relative"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/60">
                    <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-purple-400/30 rounded-2xl blur-xl"
                  />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">
                    Join Window Closed
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-purple-700 max-w-md mx-auto">
                    Auction boxes are visible only to participants after the first 15 minutes of the hour.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

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
    </>
  );
}