import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Lock, Loader2, Sparkles } from 'lucide-react';
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
  const [isUnlocking, setIsUnlocking] = useState(false);
  const prevPaidStatus = useRef(auction?.userHasPaidEntry);

  useEffect(() => {
    // ✅ Reduced delay from 1000ms to 300ms for a snappier feel
    if (auction?.userHasPaidEntry && !prevPaidStatus.current) {
      setIsUnlocking(true);
      const timer = setTimeout(() => {
        setIsUnlocking(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    prevPaidStatus.current = auction?.userHasPaidEntry;
  }, [auction?.userHasPaidEntry]);

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

    return (
      <div className="relative">
        <motion.div 
          layout
          className="space-y-6 sm:space-y-8"
          initial={false}
        >
          {/* Bidding Rounds Section */}
              <div className={`space-y-4 sm:space-y-5 relative p-0.5 sm:p-1 group ${!auction.userHasPaidEntry ? 'max-h-[420px] sm:max-h-none overflow-hidden' : ''}`}>
                {!auction.userHasPaidEntry && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300/50 bg-white/60 backdrop-blur-[2px] transition-all duration-500 overflow-hidden px-4">
                    <div className="flex flex-col items-center gap-2.5 sm:gap-4">
                      <div className="w-10 h-10 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center shadow-sm">
                        <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-purple-600" />
                      </div>
                      
                      <div className="text-center space-y-0.5 sm:space-y-2">
                        <h3 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight">
                          Bidding Rounds Locked
                        </h3>
                        <p className="text-gray-500 text-[10px] sm:text-sm font-medium">
                          Complete your entry to unlock these rounds
                        </p>
                      </div>

                        <div className="mt-0.5 sm:mt-2 px-2.5 sm:px-4 py-0.5 sm:py-1.5 bg-purple-50 rounded-full border border-purple-100">
                          <span className="text-[8px] sm:text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                            Entry fee Required
                          </span>
                        </div>

                    </div>
                  </div>
                )}

            <div 
              className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 transition-all duration-700 ${!auction.userHasPaidEntry ? 'opacity-40 blur-[4px] grayscale pointer-events-none' : 'opacity-100 blur-0 grayscale-0 scale-100'}`}
            >
              {roundBoxes.map((item) => (
                <div key={item.id}>
                    <AuctionBox
                      box={item}
                      onClick={() => handleBoxClick(item)}
                      isUserHighestBidder={item.bidder === user?.username}
                      onShowLeaderboard={onShowLeaderboard}
                      userHasPaidEntry={auction.userHasPaidEntry}
                      userBidAmount={item.roundNumber ? auction.userBidsPerRound?.[item.roundNumber] : undefined}
                      isUserQualified={
                        item.roundNumber 
                          ? (
                              // If user is explicitly unqualified in this round
                              auction.userQualificationPerRound?.[item.roundNumber] === false ||
                              // OR if they were unqualified in ANY previous round
                              Object.entries(auction.userQualificationPerRound || {})
                                .some(([round, qualified]) => parseInt(round) < item.roundNumber! && qualified === false)
                              ? false 
                              : auction.userQualificationPerRound?.[item.roundNumber]
                            )
                          : undefined
                      }
                      winnersAnnounced={auction.winnersAnnounced}
                      serverTime={serverTime}
                      hourlyAuctionId={auction.hourlyAuctionId} 
                    />
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
