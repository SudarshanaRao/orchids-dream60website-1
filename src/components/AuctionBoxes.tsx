import { useMemo } from "react";
import { AuctionGrid } from "./AuctionGrid";
import { API_ENDPOINTS } from "@/lib/api-config";
import { parseAPITimestamp } from "../utils/timezone";

interface EntryBox {
  id: number;
  type: "entry";
  entryFee?: number;
  hasPaid?: boolean;
}

interface RoundBox {
  id: number;
  type: "round";
  roundNumber: number;
  hasBid?: boolean;
  currentBid?: number;
  bidder?: string | null;
  isOpen?: boolean;
  isQualified?: boolean;
}

interface ServerTime {
  timestamp: number;
  minute: number;
}

interface AuctionBoxesProps {
  boxes: Array<EntryBox | RoundBox>;
  userBidsPerRound: Record<number, number>;
  userQualificationPerRound: Record<number, boolean>;
  onBidSuccess?: (roundNumber: number, bidAmount: number) => void;
  onBidFailure?: (roundNumber: number, bidAmount: number, errorMessage: string) => void;
  onViewLeaderboard?: (roundNumber: number) => void;
  isLoggedIn: boolean;
  currentUser?: { id?: string; name?: string } | null;
  serverTime?: ServerTime | null;
  liveAuctionData?: any;
}

export function AuctionBoxes({
  boxes,
  userBidsPerRound,
  userQualificationPerRound,
  onBidSuccess,
  onBidFailure,
  onViewLeaderboard,
  isLoggedIn,
  currentUser,
  serverTime,
  liveAuctionData,
}: AuctionBoxesProps) {
  const entryBox = boxes.find((box): box is EntryBox => box.type === "entry");
  const roundDataByNumber = useMemo(() => {
    const rounds = liveAuctionData?.rounds || [];
    return rounds.reduce((acc: Record<number, any>, round: any) => {
      if (round?.roundNumber) acc[round.roundNumber] = round;
      return acc;
    }, {});
  }, [liveAuctionData?.rounds]);

  const hourlyAuctionId = liveAuctionData?.hourlyAuctionId || null;
  const isJoinWindowOpen = serverTime ? serverTime.minute < 15 : true;

  const userHasPaidEntry = Boolean(
    entryBox?.hasPaid || liveAuctionData?.participants?.some((p: any) => p?.playerId === currentUser?.id)
  );

  const transformedRoundBoxes = boxes
    .filter((box): box is RoundBox => box.type === "round")
    .map((box) => {
      const roundData = box.roundNumber ? roundDataByNumber[box.roundNumber] : null;
      const opensAt = roundData?.startedAt ? parseAPITimestamp(roundData.startedAt) : undefined;
      const closesAt = roundData?.completedAt ? parseAPITimestamp(roundData.completedAt) : undefined;

      const computedIsOpen = (() => {
        if (typeof box.isOpen === "boolean") return box.isOpen;
        if (serverTime && box.roundNumber) {
          const startMinute = (box.roundNumber - 1) * 15;
          const endMinute = box.roundNumber * 15;
          return serverTime.minute >= startMinute && serverTime.minute < endMinute;
        }
        return false;
      })();

        return {
          id: box.id,
          type: "round" as const,
          roundNumber: box.roundNumber,
          isOpen: computedIsOpen,
          currentBid: box.currentBid || 0,
          bidder: box.bidder || null,
          opensAt,
          closesAt,
          status: liveAuctionData?.winnersAnnounced && roundData?.status?.toLowerCase?.() !== "completed" 
            ? "winners-announced" 
            : roundData?.status?.toLowerCase?.() === "completed" 
              ? "completed" 
              : computedIsOpen 
                ? "active" 
                : "upcoming",
          leaderboard: roundData?.playersData,
          prizeAmount: roundData?.prizeAmount,
          highestBidFromAPI: Array.isArray(roundData?.playersData)
            ? Math.max(0, ...roundData.playersData.map((p: any) => p.auctionPlacedAmount || p.bidAmount || 0))
            : undefined,
          hasPaid: userHasPaidEntry,
          isQualified: box.isQualified,
          entryFee: entryBox?.entryFee,
        };
      });

  const handleBid = async (boxId: number, amount: number) => {
    const round = transformedRoundBoxes.find((b) => b.id === boxId);
    const roundNumber = round?.roundNumber || boxId;

    if (!isLoggedIn || !currentUser?.id) {
      onBidFailure?.(roundNumber, amount, "Please log in to place a bid.");
      return;
    }

    if (!hourlyAuctionId) {
      onBidFailure?.(roundNumber, amount, "No active auction found. Please refresh.");
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.scheduler.placeBid, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: currentUser.id,
          playerUsername: currentUser.name || "Player",
          auctionValue: amount,
          hourlyAuctionId,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Failed to place bid");
      }

      onBidSuccess?.(roundNumber, amount);
    } catch (error: any) {
      onBidFailure?.(roundNumber, amount, error?.message || "Failed to place bid");
    }
  };

  return (
    <AuctionGrid
      auction={{
        boxes: transformedRoundBoxes as any,
        prizeValue: liveAuctionData?.prizeValue || 0,
        userBidsPerRound,
        userHasPaidEntry,
        userQualificationPerRound,
        winnersAnnounced: liveAuctionData?.winnersAnnounced,
        userEntryFee: entryBox?.entryFee,
        hourlyAuctionId,
      }}
      user={{ username: currentUser?.name || "Player" }}
      onBid={handleBid}
      onShowLeaderboard={(roundNumber) => onViewLeaderboard?.(roundNumber)}
      serverTime={serverTime ? { timestamp: serverTime.timestamp } : null}
      isJoinWindowOpen={isJoinWindowOpen}
    />
  );
}