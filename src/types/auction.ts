// src/types/auction.ts

// Status for round boxes
export type BoxStatus = "completed" | "upcoming" | "active" | "locked";

// Common base for all boxes
export interface BaseBox {
  id: number;
  type: "entry" | "round";
  isOpen: boolean;
  currentBid: number;
  bidder: string | null;
  status?: BoxStatus;
}

// Entry fee box (Box A / Box B)
export interface EntryBox extends BaseBox {
  type: "entry";
  entryFee: number;
  hasPaid: boolean;
}

// Leaderboard entry for a round
export interface RoundLeaderboardEntry {
  round: number;
  username: string;
  bid: number;
  timestamp: Date;
}

// Round bidding box
export interface RoundBox extends BaseBox {
  type: "round";
  roundNumber: number;
  minBid: number;
  opensAt: Date;
  closesAt: Date;
  leaderboard: RoundLeaderboardEntry[];
  highestBidFromAPI?: number; // Rank 1 bid amount from live API
}

// Union of all boxes
export type AnyBox = EntryBox | RoundBox;

// Auction model used in the game UI
export interface Auction {
  id: string;
  title: string;
  prize: string;
  prizeValue: number;
  startTime: Date;
  endTime: Date;
  currentRound: number;
  totalParticipants: number;
  userHasPaidEntry: boolean;
  auctionHour: number;
  userBidsPerRound: Record<number, number>;
  userQualificationPerRound: Record<number, boolean>; // Track qualification status per round
  winnersAnnounced?: boolean; // NEW: Early completion flag - winners announced before auction ends
  boxes: AnyBox[];
}

// Optional: user type if you want it here
export interface User {
  username: string;
}