import  { useState, useEffect} from 'react';
import { ArrowLeft, Trophy, Crown, Award, Medal, IndianRupee, Users, Clock, ChevronUp, TrendingUp, BarChart3, Activity, Target, Zap, Loader2, AlertCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_ENDPOINTS } from '../lib/api-config';
import jsPDF from 'jspdf';

interface LeaderboardEntry {
  username: string;
  bid: number;
  timestamp: Date;
  rank: number | null;
}

interface LeaderboardProps {
  roundNumber: number;
  leaderboard: LeaderboardEntry[];
  opensAt?: Date;
  closesAt?: Date;
  onBack: () => void;
}

export function Leaderboard({ roundNumber, onBack }: LeaderboardProps) {
  const [selectedRank, setSelectedRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opensAt, setOpensAt] = useState<Date | undefined>(undefined);
  const [closesAt, setClosesAt] = useState<Date | undefined>(undefined);

  // ✅ Helper function to format round times WITHOUT timezone conversion (display API times as-is)
  const formatRoundTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      timeZone: 'UTC', // ✅ Use UTC to prevent conversion - 12:00 UTC displays as 12:00 pm
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // ✅ Get formatted round time range (API times without conversion)
  const getRoundTimeRange = () => {
    if (!opensAt || !closesAt) return '';
    
    const startTime = formatRoundTime(opensAt);
    const endTime = formatRoundTime(closesAt);
    const timeRange = `${startTime} to ${endTime}`;
    
    // ✅ Log the complete conversion process from API to display
    console.log(`📊 [LEADERBOARD - Round ${roundNumber}] Time Display (NO CONVERSION):`, {
      'Round Number': roundNumber,
      'Raw opensAt Date Object': opensAt,
      'Raw closesAt Date Object': closesAt,
      'opensAt ISO String': opensAt.toISOString(),
      'closesAt ISO String': closesAt.toISOString(),
      'opensAt UTC String': opensAt.toUTCString(),
      'closesAt UTC String': closesAt.toUTCString(),
      'Formatted Start Time (UTC)': startTime,
      'Formatted End Time (UTC)': endTime,
      'Final Display': timeRange
    });
    
    return timeRange;
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch live auction data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ENDPOINTS.scheduler.liveAuction);
        
        if (!response.ok) {
          throw new Error('Failed to fetch auction data');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error('Invalid response format');
        }

        const liveAuction = result.data;

        // Find the specific round data
        const roundData = liveAuction.rounds?.find(
          (round: any) => round.roundNumber === roundNumber
        );

        if (!roundData) {
          throw new Error(`Round ${roundNumber} not found`);
        }

        // ✅ Set round timing from API (startedAt and completedAt)
        if (roundData.startedAt) {
          const startDate = new Date(roundData.startedAt);
          setOpensAt(startDate);
          console.log(`✅ [LEADERBOARD] Round ${roundNumber} startedAt set:`, {
            'API Value': roundData.startedAt,
            'Date Object': startDate,
            'ISO String': startDate.toISOString(),
            'UTC String': startDate.toUTCString()
          });
        }
        if (roundData.completedAt) {
          const endDate = new Date(roundData.completedAt);
          setClosesAt(endDate);
          console.log(`✅ [LEADERBOARD] Round ${roundNumber} completedAt set:`, {
            'API Value': roundData.completedAt,
            'Date Object': endDate,
            'ISO String': endDate.toISOString(),
            'UTC String': endDate.toUTCString()
          });
        }

        // Transform playersData to leaderboard entries
        const entries: LeaderboardEntry[] = roundData.playersData?.map((player: any) => ({
          username: player.playerUsername || 'Unknown Player',
          bid: player.auctionPlacedAmount || 0,
          timestamp: new Date(player.auctionPlacedTime || Date.now()),
          rank: player.rank || null,
        })) || [];

        // Sort by rank (ascending), then by bid (descending) for null ranks
        const sortedEntries = entries.sort((a, b) => {
          if (a.rank !== null && b.rank !== null) {
            return a.rank - b.rank;
          }
          if (a.rank !== null) return -1;
          if (b.rank !== null) return 1;
          if (b.bid !== a.bid) return b.bid - a.bid;
          return a.timestamp.getTime() - b.timestamp.getTime();
        });

        setLeaderboard(sortedEntries);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();

    // Remove auto-refresh - only fetch once when page opens
  }, [roundNumber]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30 animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-black text-purple-900 mb-2">Loading Leaderboard...</h3>
          <p className="text-purple-600 font-semibold">Fetching Round {roundNumber} data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-red-200 shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-red-900 mb-3">Unable to Load Leaderboard</h3>
            <p className="text-red-600 font-semibold mb-6">{error}</p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-8 py-3 rounded-xl hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTop3BidGroups = () => {
    if (leaderboard.length === 0) return [];
    
    // Group by rank for ranks 1, 2, 3
    const rank1Entries = leaderboard.filter(entry => entry.rank === 1);
    const rank2Entries = leaderboard.filter(entry => entry.rank === 2);
    const rank3Entries = leaderboard.filter(entry => entry.rank === 3);
    
    const groups = [];
    
    if (rank1Entries.length > 0) {
      groups.push({
        rank: 1,
        bidAmount: rank1Entries[0].bid,
        entries: rank1Entries
      });
    }
    
    if (rank2Entries.length > 0) {
      groups.push({
        rank: 2,
        bidAmount: rank2Entries[0].bid,
        entries: rank2Entries
      });
    }
    
    if (rank3Entries.length > 0) {
      groups.push({
        rank: 3,
        bidAmount: rank3Entries[0].bid,
        entries: rank3Entries
      });
    }
    
    return groups;
  };

  const top3Groups = getTop3BidGroups();

  const getAllRankedEntries = () => {
    return [...leaderboard];
  };

  const allEntries = getAllRankedEntries();

  const getRankConfig = (rank: number) => {
    if (rank === 1) {
      return {
        bgGradient: 'from-violet-100 to-purple-100',
        borderColor: 'border-violet-300',
        textColor: 'text-violet-700',
        badgeGradient: 'from-violet-500 to-purple-600',
        lightBg: 'bg-violet-50',
        position: '1st'
      };
    } else if (rank === 2) {
      return {
        bgGradient: 'from-purple-100 to-violet-100',
        borderColor: 'border-purple-300',
        textColor: 'text-purple-700',
        badgeGradient: 'from-purple-500 to-violet-600',
        lightBg: 'bg-purple-50',
        position: '2nd'
      };
    } else {
      return {
        bgGradient: 'from-violet-50 to-purple-50',
        borderColor: 'border-violet-200',
        textColor: 'text-violet-600',
        badgeGradient: 'from-violet-400 to-purple-500',
        lightBg: 'bg-violet-50',
        position: '3rd'
      };
    }
  };

  const getPodiumHeight = (rank: number) => {
    if (rank === 1) return 'h-32';
    if (rank === 2) return 'h-24';
    return 'h-20';
  };

  // Calculate stats
  const calculateStats = () => {
    if (leaderboard.length === 0) {
      return {
        totalPlayers: 0,
        highestBid: 0,
        averageBid: 0,
        totalBids: 0
      };
    }

    const totalPlayers = leaderboard.length;
    const highestBid = Math.max(...leaderboard.map(entry => entry.bid));
    const totalBidAmount = leaderboard.reduce((sum, entry) => sum + entry.bid, 0);
    const averageBid = Math.round(totalBidAmount / totalPlayers);
    const totalBids = leaderboard.length;

    return {
      totalPlayers,
      highestBid,
      averageBid,
      totalBids
    };
  };

  const stats = calculateStats();

  // ✅ Function to generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Set light purple background
    doc.setFillColor(250, 245, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header with purple gradient
    doc.setFillColor(107, 63, 160);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`DREAM60 - Round ${roundNumber} Leaderboard`, pageWidth / 2, 15, { align: 'center' });
    
    // Subtitle with time range
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const timeRange = getRoundTimeRange();
    doc.text(timeRange || 'Completed', pageWidth / 2, 25, { align: 'center' });
    
    // Stats Section
    let yPos = 45;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(107, 63, 160);
    doc.setFont('helvetica', 'bold');
    
    const statX = 20;
    const stat2X = pageWidth / 2 + 10;
    
    // Column 1
    doc.text('Total Players:', statX, yPos + 10);
    doc.text(`${stats.totalPlayers}`, statX + 30, yPos + 10);
    
    doc.text('Highest Bid:', statX, yPos + 20);
    doc.text(`Rs ${stats.highestBid.toLocaleString('en-IN')}`, statX + 30, yPos + 20);
    
    // Column 2
    doc.text('Average Bid:', stat2X, yPos + 10);
    doc.text(`Rs ${stats.averageBid.toLocaleString('en-IN')}`, stat2X + 30, yPos + 10);
    
    doc.text('Total Bids:', stat2X, yPos + 20);
    doc.text(`${stats.totalBids}`, stat2X + 30, yPos + 20);
    
    // Top 3 Winners Section
    yPos += 45;
    doc.setFontSize(14);
    doc.setTextColor(107, 63, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 3 Winners', 15, yPos);
    
    yPos += 8;
    
    // Top 3 boxes
    const rankColors = [
      { bg: [216, 180, 254], text: [88, 28, 135], label: '1st Place' },
      { bg: [192, 132, 252], text: [88, 28, 135], label: '2nd Place' },
      { bg: [168, 85, 247], text: [255, 255, 255], label: '3rd Place' }
    ];
    
    top3Groups.forEach((group, index) => {
      const color = rankColors[index];
      
      doc.setFillColor(...color.bg);
      doc.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(...color.text);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rank ${group.rank} - ${color.label}`, 20, yPos + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Rs ${group.bidAmount.toLocaleString('en-IN')}`, 20, yPos + 14);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${group.entries.length} Winner${group.entries.length > 1 ? 's' : ''}`, pageWidth - 55, yPos + 11);
      
      yPos += 22;
    });
    
    // Complete Rankings Section
    yPos += 5;
    doc.setFontSize(14);
    doc.setTextColor(107, 63, 160);
    doc.setFont('helvetica', 'bold');
    doc.text('Complete Rankings', 15, yPos);
    
    yPos += 8;
    
    // Table header
    doc.setFillColor(147, 51, 234);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Rank', 20, yPos + 7);
    doc.text('Username', 45, yPos + 7);
    doc.text('Bid Amount', 120, yPos + 7);
    doc.text('Time', 165, yPos + 7);
    
    yPos += 10;
    
    // Table rows
    allEntries.forEach((entry, idx) => {
      // Check if we need a new page
      if (yPos > pageHeight - 35) {
        doc.addPage();
        doc.setFillColor(250, 245, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 20;
      }
      
      const displayRank = entry.rank || (idx + 1);
      const isTopThree = entry.rank !== null && entry.rank <= 3;
      
      // Alternate row colors
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      } else {
        doc.setFillColor(250, 245, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      }
      
      doc.setFontSize(8);
      doc.setFont('helvetica', isTopThree ? 'bold' : 'normal');
      
      // Rank with color
      if (isTopThree) {
        const rankColors = [
          [147, 51, 234],
          [126, 34, 206],
          [107, 33, 168]
        ];
        doc.setTextColor(...rankColors[entry.rank! - 1]);
      } else {
        doc.setTextColor(75, 85, 99);
      }
      
      doc.text(displayRank.toString(), 25, yPos + 6);
      
      // Username
      doc.setTextColor(31, 41, 55);
      const username = entry.username.length > 25 ? entry.username.substring(0, 25) + '...' : entry.username;
      doc.text(username, 45, yPos + 6);
      
      // Bid amount
      doc.setTextColor(107, 63, 160);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs ${entry.bid.toLocaleString('en-IN')}`, 120, yPos + 6);
      
      // Time
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      const time = entry.timestamp.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      doc.text(time, 165, yPos + 6);
      
      yPos += 8;
    });
    
    // Footer with copyright and terms
    doc.setFillColor(107, 63, 160);
    doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('All rights reserved to dream60.com', pageWidth / 2, pageHeight - 17, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Terms and conditions applicable', pageWidth / 2, pageHeight - 12, { align: 'center' });
    
    doc.setFontSize(7);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    
    // Save PDF
    doc.save(`Dream60_Round${roundNumber}_Leaderboard.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen pb-8">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-purple-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={onBack}
                className="group flex items-center gap-2 text-purple-700 hover:text-purple-900 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
                <span className="font-bold hidden sm:inline">Back</span>
              </button>

              <div className="flex items-center gap-3">
                {/* Download PDF Button */}
                <button
                  onClick={generatePDF}
                  className="group flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  <span className="font-bold text-sm hidden sm:inline">Download PDF</span>
                  <span className="font-bold text-sm sm:hidden">PDF</span>
                </button>
                
                <div className="flex items-center gap-2 bg-purple-100 rounded-xl px-4 py-2 border border-purple-200">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-black text-purple-900">{leaderboard.length}</span>
                </div>
                {opensAt && closesAt && (
                  <div className="hidden md:flex items-center gap-2 bg-purple-100 rounded-xl px-4 py-2 border border-purple-200">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-900">
                      {getRoundTimeRange()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-5 py-2 rounded-full shadow-lg shadow-purple-500/30 mb-3"
              >
                <Trophy className="w-4 h-4" />
                <span className="font-black text-sm uppercase tracking-wider">Round {roundNumber}</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-900 via-violet-800 to-purple-900 bg-clip-text text-transparent mb-2"
              >
                Leaderboard
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-purple-600 font-semibold"
              >
                Competition results and rankings
              </motion.p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {top3Groups.length > 0 ? (
            <div className="space-y-8">
              {/* Top 3 Podium with Player Count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="flex items-end justify-center gap-4 sm:gap-6 mb-8">
                  {/* 2nd Place */}
                  {top3Groups[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      className="flex flex-col items-center flex-1 max-w-[160px]"
                    >
                      {/* Player Count Circle */}
                      <button
                        onClick={() => setSelectedRank(selectedRank === 1 ? null : 1)}
                        className="relative mb-3 group cursor-pointer"
                      >
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/70 backdrop-blur-xl border-4 ${getRankConfig(top3Groups[1].rank).borderColor} flex items-center justify-center shadow-xl hover:scale-105 transition-transform`}>
                          <div className="text-center">
                            <Users className={`w-6 h-6 ${getRankConfig(top3Groups[1].rank).textColor} mx-auto mb-1`} />
                            <span className={`text-2xl font-black ${getRankConfig(top3Groups[1].rank).textColor}`}>
                              {top3Groups[1].entries.length}
                            </span>
                          </div>
                        </div>
                        {/* Medal Badge */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br ${getRankConfig(top3Groups[1].rank).badgeGradient} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                          <span className="text-white text-xs font-black">2</span>
                        </div>
                      </button>

                      {/* Bid Amount */}
                      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-purple-200 mb-2">
                        <IndianRupee className="w-3 h-3 text-purple-600" />
                        <span className="text-purple-900 text-sm font-bold">{top3Groups[1].bidAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Podium Stand */}
                      <div className={`w-full ${getPodiumHeight(top3Groups[1].rank)} bg-white/60 backdrop-blur-lg border-2 ${getRankConfig(top3Groups[1].rank).borderColor} rounded-t-2xl flex items-center justify-center shadow-lg`}>
                        <span className={`text-4xl font-black ${getRankConfig(top3Groups[1].rank).textColor} opacity-50`}>2</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {top3Groups[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="flex flex-col items-center flex-1 max-w-[180px]"
                    >
                      {/* Crown Icon */}
                      <div className="mb-2">
                        <Crown className="w-8 h-8 text-yellow-500" fill="#eab308" />
                      </div>

                      {/* Player Count Circle */}
                      <button
                        onClick={() => setSelectedRank(selectedRank === 0 ? null : 0)}
                        className="relative mb-3 group cursor-pointer"
                      >
                        <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/70 backdrop-blur-xl border-4 ${getRankConfig(top3Groups[0].rank).borderColor} flex items-center justify-center shadow-2xl hover:scale-105 transition-transform`}>
                          <div className="text-center">
                            <Users className={`w-7 h-7 ${getRankConfig(top3Groups[0].rank).textColor} mx-auto mb-1`} />
                            <span className={`text-3xl font-black ${getRankConfig(top3Groups[0].rank).textColor}`}>
                              {top3Groups[0].entries.length}
                            </span>
                          </div>
                        </div>
                        {/* Medal Badge */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-9 h-9 bg-gradient-to-br ${getRankConfig(top3Groups[0].rank).badgeGradient} rounded-full flex items-center justify-center shadow-xl border-2 border-white`}>
                          <span className="text-white text-sm font-black">1</span>
                        </div>
                      </button>

                      {/* Bid Amount */}
                      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-violet-300 mb-2">
                        <IndianRupee className="w-4 h-4 text-violet-600" />
                        <span className="text-violet-900 text-base font-black">{top3Groups[0].bidAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Podium Stand */}
                      <div className={`w-full ${getPodiumHeight(top3Groups[0].rank)} bg-white/60 backdrop-blur-lg border-2 ${getRankConfig(top3Groups[0].rank).borderColor} rounded-t-2xl flex items-center justify-center shadow-2xl`}>
                        <span className={`text-5xl font-black ${getRankConfig(top3Groups[0].rank).textColor} opacity-50`}>1</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {top3Groups[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="flex flex-col items-center flex-1 max-w-[160px]"
                    >
                      {/* Player Count Circle */}
                      <button
                        onClick={() => setSelectedRank(selectedRank === 2 ? null : 2)}
                        className="relative mb-3 group cursor-pointer"
                      >
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/70 backdrop-blur-xl border-4 ${getRankConfig(top3Groups[2].rank).borderColor} flex items-center justify-center shadow-xl hover:scale-105 transition-transform`}>
                          <div className="text-center">
                            <Users className={`w-6 h-6 ${getRankConfig(top3Groups[2].rank).textColor} mx-auto mb-1`} />
                            <span className={`text-2xl font-black ${getRankConfig(top3Groups[2].rank).textColor}`}>
                              {top3Groups[2].entries.length}
                            </span>
                          </div>
                        </div>
                        {/* Medal Badge */}
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br ${getRankConfig(top3Groups[2].rank).badgeGradient} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                          <span className="text-white text-xs font-black">3</span>
                        </div>
                      </button>

                      {/* Bid Amount */}
                      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-violet-200 mb-2">
                        <IndianRupee className="w-3 h-3 text-violet-600" />
                        <span className="text-violet-900 text-sm font-bold">{top3Groups[2].bidAmount.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Podium Stand */}
                      <div className={`w-full ${getPodiumHeight(top3Groups[2].rank)} bg-white/60 backdrop-blur-lg border-2 ${getRankConfig(top3Groups[2].rank).borderColor} rounded-t-2xl flex items-center justify-center shadow-lg`}>
                        <span className={`text-4xl font-black ${getRankConfig(top3Groups[2].rank).textColor} opacity-50`}>3</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Expanded Players List for Selected Rank */}
                <AnimatePresence>
                  {selectedRank !== null && top3Groups[selectedRank] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-8 overflow-hidden"
                    >
                      <div className={`bg-white/80 backdrop-blur-2xl rounded-3xl border-2 ${getRankConfig(top3Groups[selectedRank].rank).borderColor} shadow-2xl shadow-purple-500/20 overflow-hidden`}>
                        {/* Header */}
                        <div className={`bg-gradient-to-r ${getRankConfig(top3Groups[selectedRank].rank).bgGradient} px-6 py-4 border-b-2 ${getRankConfig(top3Groups[selectedRank].rank).borderColor} flex items-center justify-between backdrop-blur-xl`}>
                          <h3 className={`font-black ${getRankConfig(top3Groups[selectedRank].rank).textColor} flex items-center gap-3 text-lg`}>
                            <div className={`w-10 h-10 bg-gradient-to-br ${getRankConfig(top3Groups[selectedRank].rank).badgeGradient} rounded-xl flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-black text-xl">{top3Groups[selectedRank].rank}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{getRankConfig(top3Groups[selectedRank].rank).position} Place</span>
                                <div className="px-2.5 py-0.5 bg-white/70 backdrop-blur-md rounded-full text-xs">
                                  {top3Groups[selectedRank].entries.length} Players
                                </div>
                              </div>
                            </div>
                          </h3>
                          <button
                            onClick={() => setSelectedRank(null)}
                            className={`w-9 h-9 rounded-xl bg-white/70 backdrop-blur-md ${getRankConfig(top3Groups[selectedRank].rank).textColor} hover:bg-white transition-all shadow-md hover:scale-105 flex items-center justify-center`}
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Players Grid */}
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {top3Groups[selectedRank].entries.map((entry, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-purple-200/50 p-4 hover:bg-white/80 hover:border-purple-300 hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  {/* Avatar */}
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRankConfig(top3Groups[selectedRank].rank).badgeGradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                    <span className="text-white font-black text-lg">
                                      {entry.username.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-black text-purple-900 text-sm truncate">
                                      {entry.username}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-purple-600 font-medium mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {entry.timestamp.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </div>
                                  </div>
                                  
                                  {/* Bid Badge */}
                                  <div className="flex items-center gap-1 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl px-3 py-2 border border-purple-200 shadow-sm">
                                    <IndianRupee className="w-4 h-4 text-purple-600" />
                                    <span className="font-black text-purple-900 text-sm">
                                      {entry.bid.toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* All Rankings List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-purple-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                    All Rankings
                  </h2>
                  <div className="text-sm font-bold text-purple-600">
                    {leaderboard.length} Total Players
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-purple-200 shadow-xl overflow-hidden">
                  <div className="divide-y divide-purple-100">
                    {allEntries.map((entry, idx) => {
                      const isTopThree = entry.rank !== null && entry.rank <= 3;
                      const config = isTopThree && entry.rank ? getRankConfig(entry.rank) : null;
                      const displayRank = entry.rank || (idx + 1);

                      return (
                        <motion.div
                          key={`${entry.username}-${idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + idx * 0.02, duration: 0.4 }}
                          className="px-5 py-4 hover:bg-purple-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            {/* Rank Badge */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${
                              isTopThree && config
                                ? `bg-gradient-to-br ${config.badgeGradient}`
                                : 'bg-purple-100 border-2 border-purple-200'
                            }`}>
                              <span className={`font-black text-lg ${isTopThree ? 'text-white' : 'text-purple-900'}`}>
                                {displayRank}
                              </span>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-purple-900 truncate">
                                  {entry.username}
                                </h3>
                                {isTopThree && entry.rank && (
                                  <div className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                    entry.rank === 1 ? 'bg-violet-100 text-violet-700' :
                                    entry.rank === 2 ? 'bg-purple-100 text-purple-700' :
                                    'bg-violet-50 text-violet-600'
                                  }`}>
                                    RANK {entry.rank}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-purple-600">
                                <Clock className="w-3 h-3" />
                                {entry.timestamp.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                })}
                              </div>
                            </div>

                            {/* Bid Amount */}
                            <div className={`flex items-center gap-1 px-4 py-2 rounded-xl shadow-md ${
                              isTopThree && config
                                ? `${config.lightBg} border-2 ${config.borderColor}`
                                : 'bg-purple-50 border-2 border-purple-200'
                            }`}>
                              <IndianRupee className={`w-5 h-5 ${isTopThree && config ? config.textColor : 'text-purple-600'}`} />
                              <span className={`font-black ${isTopThree && config ? config.textColor : 'text-purple-900'}`}>
                                {entry.bid.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="bg-white rounded-3xl border-2 border-purple-200 shadow-2xl p-16 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-black text-purple-900 mb-3">No Results Yet</h3>
              <p className="text-purple-600 font-semibold text-lg">Waiting for bids in this round</p>
            </motion.div>
          )}

          {/* Stats Section */}
          {leaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-black text-purple-900">Round Statistics</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Players */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-purple-200 p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-purple-900 mb-1">{stats.totalPlayers}</div>
                  <div className="text-sm font-bold text-purple-600">Total Players</div>
                </motion.div>

                {/* Highest Bid */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.4 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-purple-200 p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <IndianRupee className="w-5 h-5 text-purple-900" />
                    <div className="text-3xl font-black text-purple-900">{stats.highestBid.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-sm font-bold text-purple-600">Highest Bid</div>
                </motion.div>

                {/* Average Bid */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.4 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-purple-200 p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    <IndianRupee className="w-5 h-5 text-purple-900" />
                    <div className="text-3xl font-black text-purple-900">{stats.averageBid.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-sm font-bold text-purple-600">Average Bid</div>
                </motion.div>

                {/* Total Bids */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3, duration: 0.4 }}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border-2 border-purple-200 p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl flex items-center justify-center shadow-md">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-purple-900 mb-1">{stats.totalBids}</div>
                  <div className="text-sm font-bold text-purple-600">Total Bids</div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}