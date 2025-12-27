import { useState } from 'react';
import { motion } from 'motion/react';
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

    // Only render the auction grid when user has paid entry fee
    if (!auction.userHasPaidEntry) {
      return null;
    }

      return (
        <>
          <div className="space-y-6 sm:space-y-8">
            {/* Prize Showcase Card */}
            <div className="relative overflow-hidden">
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

            {/* Bidding Rounds Section - Only rendered when user has paid entry fee */}
            <div className="space-y-4 sm:space-y-5">
              <div 
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              >
                {roundBoxes.map((box) => (
                  <div
                    key={box.id}
                  >
                    <AuctionBox
                      box={box}
                      onClick={() => handleBoxClick(box)}
                      isUserHighestBidder={box.bidder === user?.username}
                      onShowLeaderboard={onShowLeaderboard}
                      userHasPaidEntry={auction.userHasPaidEntry}
                      userBidAmount={box.roundNumber ? auction.userBidsPerRound?.[box.roundNumber] : undefined}
                      isUserQualified={box.roundNumber ? auction.userQualificationPerRound?.[box.roundNumber] : undefined}
                      winnersAnnounced={auction.winnersAnnounced}
                      serverTime={serverTime}
                      hourlyAuctionId={auction.hourlyAuctionId} 
                    />
                  </div>
                ))}
              </div>
            </div>
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