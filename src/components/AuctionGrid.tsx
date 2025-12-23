import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    winnersAnnounced?: boolean;
    userEntryFee?: number;
    hourlyAuctionId?: string | null;
  };
  user: {
    username: string;
  };
  onBid: (boxId: number, amount: number) => void;
  onShowLeaderboard?: (roundNumber: number, leaderboard: any[], opensAt?: Date, closesAt?: Date) => void;
  serverTime?: { timestamp: number } | null;
  isJoinWindowOpen: boolean;
}

export function AuctionGrid({ auction, user, onBid, onShowLeaderboard, serverTime, isJoinWindowOpen }: AuctionGridProps) {
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);

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
  const canShowBoxes = auction.userHasPaidEntry;
  const showGuestPreview = false;

  return (
    <>
      <div className="space-y-6 sm:space-y-8 min-h-[400px]">
        <AnimatePresence mode="wait">
          {canShowBoxes ? (
            <motion.div
              key={auction.hourlyAuctionId || 'auction-grid'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {roundBoxes.map((box, index) => (
                  <motion.div
                    key={`${auction.hourlyAuctionId}-${box.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05
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
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20 border border-gray-200 rounded-3xl bg-gray-50/50"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-gray-100">
                  <Lock className="w-8 h-8 text-gray-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-gray-900 font-semibold">Bidding Rounds Locked</p>
                  <p className="text-gray-500 text-sm">Join the auction to see all active rounds</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
