// Shared type definitions for Dream60 auction application

export interface LeaderboardEntry {
    username: string;
    bid: number;
    timestamp: Date;
}

export type BoxStatus = 'upcoming' | 'active' | 'completed' | 'locked';

export interface EntryBox {
    id: number;
    type: 'entry';
    isOpen: boolean;
    entryFee: number;
    currentBid: number;
    bidder: string | null;
    hasPaid?: boolean;
}

export interface RoundBox {
    id: number;
    type: 'round';
    isOpen: boolean;
    minBid: number;
    currentBid: number;
    bidder: string | null;
    roundNumber: number;
    opensAt: Date;
    closesAt: Date;
    status: BoxStatus;
    leaderboard: LeaderboardEntry[];
}

export type Box = EntryBox | RoundBox;

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
    userBidsPerRound: { [roundNumber: number]: number };
    boxes: Box[];
}

export interface User {
    id: number;
    username: string;
    totalWins: number;
    totalAuctions: number;
}
