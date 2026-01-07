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
    // ✅ Track paid status and auction ID to detect genuine changes
    const prevPaidStatus = useRef<{ status: boolean; auctionId: string | null }>({
      status: !!auction?.userHasPaidEntry,
      auctionId: auction?.hourlyAuctionId || null
    });
    const stickyPaidStatus = useRef(false);
    const stickyPaidTimestamp = useRef(0);
    const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (!user?.username) {
        stickyPaidStatus.current = false;
        stickyPaidTimestamp.current = 0;
        prevPaidStatus.current = { status: false, auctionId: null };
      }
    }, [user?.username]);

      useEffect(() => {
        const currentPaid = !!auction?.userHasPaidEntry;
        const currentAuctionId = auction?.hourlyAuctionId || null;
        
        // ✅ Trigger "Synchronizing" ONLY if:
        // 1. User was NOT paid and is NOW paid for the SAME auction
        // 2. OR it's a NEW auction and the user is already paid (initial unlock)
        const isNewlyPaidSameAuction = currentPaid && !prevPaidStatus.current.status && currentAuctionId === prevPaidStatus.current.auctionId;
        const isNewAuctionAlreadyPaid = currentPaid && currentAuctionId !== prevPaidStatus.current.auctionId && prevPaidStatus.current.auctionId !== null;

        if (isNewlyPaidSameAuction || isNewAuctionAlreadyPaid) {
          console.log('✨ [AUCTION GRID] Triggering synchronizing state:', { isNewlyPaidSameAuction, isNewAuctionAlreadyPaid });
          
          // Clear any existing timer
          if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
          
          setIsUnlocking(true);
          stickyPaidStatus.current = true;
          stickyPaidTimestamp.current = Date.now();
          
          unlockTimerRef.current = setTimeout(() => {
            setIsUnlocking(false);
            unlockTimerRef.current = null;
          }, 1200);
        } else if (isUnlocking) {
          // ✅ Force clear stuck synchronizing state after 2 seconds
          const safetyTimer = setTimeout(() => {
            setIsUnlocking(false);
          }, 2000);
          return () => clearTimeout(safetyTimer);
        }
        
        if (currentPaid) {
          stickyPaidStatus.current = true;
          stickyPaidTimestamp.current = Date.now();
        }
        
        prevPaidStatus.current = { status: currentPaid, auctionId: currentAuctionId };
        
        return () => {
          if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
        };
      }, [auction?.userHasPaidEntry, auction?.hourlyAuctionId, isUnlocking]);

  const effectiveUserHasPaidEntry = auction?.userHasPaidEntry || 
    (stickyPaidStatus.current && (Date.now() - stickyPaidTimestamp.current < 60000)) ||
    (auction?.userBidsPerRound && Object.keys(auction.userBidsPerRound).length > 0);

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
      effectiveUserHasPaidEntry,
      stickyPaidStatus: stickyPaidStatus.current,
      isUnlocking,
      roundBoxesCount: roundBoxes.length
    });

  return (
    <div className="relative">
      <motion.div 
        layout
        className="space-y-6 sm:space-y-8"
        initial={false}
      >
        {/* Bidding Rounds Section */}
            <div className={`space-y-4 sm:space-y-5 relative p-0.5 sm:p-1 group ${!effectiveUserHasPaidEntry && !isUnlocking ? 'max-h-[420px] sm:max-h-none overflow-hidden' : ''}`}>
              {!effectiveUserHasPaidEntry && !isUnlocking && (
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
              className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 transition-all duration-700 ${(!effectiveUserHasPaidEntry && !isUnlocking) ? 'opacity-40 blur-[4px] grayscale pointer-events-none' : 'opacity-100 blur-0 grayscale-0 scale-100'}`}
            >
              {( (effectiveUserHasPaidEntry) ? roundBoxes : [1, 2, 3, 4]).map((item, idx) => (
                <div key={typeof item === 'number' ? `placeholder-${item}` : item.id}>
                  {(isUnlocking && typeof item !== 'number') ? (
                    <div className="bg-white/40 border-2 border-purple-100/80 rounded-2xl h-[240px] xs:h-[280px] sm:h-[320px] flex flex-col items-center justify-center p-6 space-y-4 shadow-sm backdrop-blur-[1px] relative overflow-hidden group">
                    {/* Active Loader Animation */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 via-white/5 to-purple-50/10 animate-pulse" />
                    
                    <div className="relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border border-purple-100">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    </div>
                    
                    <div className="relative z-10 space-y-2 text-center">
                      <div className="h-4 w-24 bg-purple-100/50 rounded-full mx-auto" />
                      <div className="h-8 w-32 bg-purple-100/50 rounded-lg mx-auto" />
                    </div>
                    
                    <div className="relative z-10 px-4 py-1.5 bg-purple-50/80 rounded-full border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles className="w-3 h-3 animate-bounce" />
                          Synchronizing...
                        </p>
                      </div>
                    </div>
                    ) : (
                      <AuctionBox
                        box={item}
                        onClick={() => handleBoxClick(item)}
                        isUserHighestBidder={item.bidder === user?.username}
                        onShowLeaderboard={onShowLeaderboard}
                        userHasPaidEntry={effectiveUserHasPaidEntry}
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