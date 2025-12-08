import { useState } from 'react';
import { motion } from 'motion/react';
import { AuctionBox } from './AuctionBox';
import { BidModal } from './BidModal';
// import { Trophy, TrendingUp, Zap, Target, IndianRupee, Clock, Users } from 'lucide-react';

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
}

export function AuctionGrid({ auction, user, onBid, onShowLeaderboard, serverTime }: AuctionGridProps) {
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

  const handleBoxClick = (box: Box) => {
    if (box.isOpen && !(box.type === 'entry' && box.hasPaid)) {
      setSelectedBox(box);
      setShowBidModal(true);
    }
  };

  const handleBid = (amount: number) => {
    if (selectedBox) {
      // For entry boxes, always use the entry fee amount
      const actualAmount = selectedBox.type === 'entry' ? selectedBox.entryFee! : amount;
      onBid(selectedBox.id, actualAmount);
      setShowBidModal(false);
      setSelectedBox(null);
    }
  };

  // const entryBoxes = auction.boxes.filter(box => box.type === 'entry');
  const roundBoxes = auction.boxes.filter(box => box.type === 'round');

  // Calculate statistics
  // const totalActiveBids = roundBoxes.filter(box => box.currentBid > 0).length;
  // const totalBidValue = roundBoxes.reduce((sum, box) => sum + box.currentBid, 0);

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
{/*
          <div className="relative bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-fuchsia-50/80 backdrop-blur-xl border-2 border-purple-200/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-4 sm:gap-6">
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
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-600 via-purple-700 to-violet-800 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white/60">
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-purple-400/30 rounded-2xl blur-xl"
                  />
                </motion.div>
                
                <div>
                  <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Grand Prize</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-purple-900" />
                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-purple-900">
                      {auction.prizeValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-600 mt-1">Win by placing the highest bid!</p>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-purple-200/60 shadow-lg min-w-[100px] sm:min-w-[120px]">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs font-medium">Active Bids</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">{totalActiveBids}</p>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-purple-200/60 shadow-lg min-w-[120px] sm:min-w-[140px]">
                  <div className="flex items-center gap-2 text-purple-700 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs font-medium">Total Value</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 sm:w-5 sm:h-5 text-purple-900" />
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">
                      {totalBidValue.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
         */}</motion.div>

        {/* Bidding Rounds Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4 sm:space-y-5"
        >
          {/* Section Header */}
          {/* <div className="relative overflow-hidden bg-gradient-to-r from-purple-100/80 via-violet-100/70 to-purple-100/80 backdrop-blur-xl border-2 border-purple-200/50 rounded-xl p-4 sm:p-5 shadow-lg">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-violet-700 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white/60"
                >
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-900">
                    Bidding Rounds
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-700 mt-0.5">
                    4 rounds • 15 minutes each
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl border border-purple-200/60 shadow-md">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="text-xs sm:text-sm font-semibold text-purple-800">
                  New round opens every 15 min
                </span>
              </div>
            </div>
          </div> */}

          {/* Strategy Info Card */}
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-violet-50/80 to-fuchsia-50/80 backdrop-blur-xl border border-purple-200/50 rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-purple-900 text-sm sm:text-base mb-1">Strategic Bidding</h3>
                <p className="text-xs sm:text-sm text-purple-700 leading-relaxed">
                  Place your bids strategically across all rounds to maximize your chances. The highest bidder at the end wins the grand prize!
                </p>
              </div>
            </div>
          </motion.div> */}
          
          {/* Auction Boxes Grid */}
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