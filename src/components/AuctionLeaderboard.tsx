import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Download, Eye, BarChart2, Clock, Users, IndianRupee, Medal, Crown, Award, CheckCircle, XCircle, Gift, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { API_ENDPOINTS, buildQueryString } from '../lib/api-config';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import jsPDF from 'jspdf';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerUsername: string;
  bidAmount: number;
  bidTime: string;
  isQualified: boolean;
  isCurrentUser: boolean;
}

interface RoundData {
  roundNumber: number;
  status: string;
  totalParticipants: number;
  qualifiedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  leaderboard: LeaderboardEntry[];
}

interface WinnerData {
  rank: number;
  playerId: string;
  playerUsername: string;
  prizeAmount: number;
  isPrizeClaimed: boolean;
  prizeClaimStatus?: string;
  prizeClaimedAt: string | null;
  prizeClaimedBy: string | null;
  claimNotes?: string | null;
  isCurrentUser: boolean;
}

interface AuctionSummary {
  hourlyAuctionId: string;
  hourlyAuctionCode: string;
  auctionName: string;
  auctionDate: string;
  timeSlot: string;
  prizeValue: number;
  imageUrl: string;
  status: string;
  totalParticipants: number;
  totalRounds: number;
  winners: WinnerData[];
}

interface AuctionLeaderboardProps {
  hourlyAuctionId: string;
  userId?: string;
  onBack: () => void;
}

export function AuctionLeaderboard({ hourlyAuctionId, userId, onBack }: AuctionLeaderboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [auction, setAuction] = useState<AuctionSummary | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!hourlyAuctionId || !userId) {
        setError('Missing required information');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const queryString = buildQueryString({ hourlyAuctionId, userId });
        const response = await fetch(`${API_ENDPOINTS.scheduler.auctionLeaderboard}${queryString}`);
          const data = await response.json();

          if (response.ok && data.success) {
              const normalizedWinners: WinnerData[] = (data.auction?.winners || []).map((winner: any) => {
                const status = winner?.prizeClaimStatus || (winner?.isPrizeClaimed ? 'CLAIMED' : undefined);
                const isClaimed = status === 'CLAIMED';

                return {
                  ...winner,
                  prizeClaimStatus: status,
                  isPrizeClaimed: isClaimed,
                  prizeClaimedBy: winner?.prizeClaimedBy || null,
                  claimNotes: winner?.claimNotes || null,
                } as WinnerData;
              });


            if (data.auction) {
              setAuction({ ...data.auction, winners: normalizedWinners });
            } else {
              setAuction(null);
            }
            setRounds(data.rounds || []);
          } else {
            setError(data.message || 'Failed to load leaderboard');
            if (!data.isParticipant) {
              toast.error('You did not participate in this auction');
            }
          }

      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [hourlyAuctionId, userId]);

  const downloadLeaderboard = (roundNumber: number) => {
    const round = rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    doc.setFillColor(250, 245, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setFillColor(107, 63, 160);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`DREAM60 - ${auction?.auctionName || 'Auction'}`, pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Round ${roundNumber} Leaderboard`, pageWidth / 2, 25, { align: 'center' });
    
    let yPos = 45;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, 25, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(107, 63, 160);
    doc.setFont('helvetica', 'bold');
    
    doc.text('Total Players:', 20, yPos + 10);
    doc.text(`${round.totalParticipants}`, 55, yPos + 10);
    
    doc.text('Qualified:', 100, yPos + 10);
    doc.text(`${round.qualifiedCount}`, 125, yPos + 10);
    
    doc.text('Status:', 150, yPos + 10);
    doc.text(`${round.status}`, 170, yPos + 10);
    
    yPos += 35;
    
    doc.setFillColor(147, 51, 234);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Rank', 20, yPos + 7);
    doc.text('Username', 45, yPos + 7);
    doc.text('Bid Amount', 120, yPos + 7);
    doc.text('Qualified', 170, yPos + 7);
    
    yPos += 10;
    
    round.leaderboard.forEach((entry, idx) => {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        doc.setFillColor(250, 245, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        yPos = 20;
      }
      
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      } else {
        doc.setFillColor(250, 245, 255);
        doc.rect(15, yPos, pageWidth - 30, 8, 'F');
      }
      
      doc.setFontSize(8);
      doc.setFont('helvetica', entry.rank <= 3 ? 'bold' : 'normal');
      
      if (entry.rank <= 3) {
        const rankColors = [[147, 51, 234], [126, 34, 206], [107, 33, 168]];
        doc.setTextColor(...rankColors[entry.rank - 1]);
      } else {
        doc.setTextColor(75, 85, 99);
      }
      
      doc.text(entry.rank.toString(), 25, yPos + 6);
      
      doc.setTextColor(31, 41, 55);
      const username = entry.playerUsername.length > 25 ? entry.playerUsername.substring(0, 25) + '...' : entry.playerUsername;
      doc.text(username + (entry.isCurrentUser ? ' (You)' : ''), 45, yPos + 6);
      
      doc.setTextColor(107, 63, 160);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs ${entry.bidAmount.toLocaleString('en-IN')}`, 120, yPos + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(entry.isQualified ? 34 : 185, entry.isQualified ? 197 : 28, entry.isQualified ? 94 : 28);
      doc.text(entry.isQualified ? 'Yes' : 'No', 175, yPos + 6);
      
      yPos += 8;
    });
    
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
    
    doc.save(`Dream60_${auction?.hourlyAuctionCode || 'Auction'}_Round${roundNumber}_Leaderboard.pdf`);
    toast.success(`Round ${roundNumber} leaderboard downloaded as PDF`);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-purple-600">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-purple-600 mt-4">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <div className="container mx-auto px-4 py-8">
          <Button onClick={onBack} variant="ghost" className="mb-6 text-purple-700 hover:text-purple-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Access Denied</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header with Logo */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Auctions
              </Button>
              <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
              <div className="hidden sm:flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-purple-600" />
                <h1 className="text-lg font-bold text-purple-800">Auction Leaderboard</h1>
              </div>
            </div>
            
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Platform</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Mobile Title */}
        <motion.div 
          className="flex sm:hidden items-center space-x-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BarChart2 className="w-5 h-5 text-purple-600" />
          <h1 className="text-xl font-bold text-purple-800">Auction Leaderboard</h1>
        </motion.div>

        {/* Auction Header */}
        {auction && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-purple-200/60 shadow-xl p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-300/60 shadow-md shrink-0">
                <ImageWithFallback 
                  src={auction.imageUrl}
                  alt={auction.auctionName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  <h1 className="text-xl md:text-2xl font-bold text-purple-900">{auction.auctionName}</h1>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-purple-600">
                    <Clock className="w-4 h-4" />
                    <span>{auction.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1 text-purple-600">
                    <Users className="w-4 h-4" />
                    <span>{auction.totalParticipants} Participants</span>
                  </div>
                  <div className="flex items-center gap-1 text-violet-700 font-semibold">
                    <IndianRupee className="w-4 h-4" />
                    <span>{auction.prizeValue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-xs text-purple-500 mt-2">
                  Auction Code: {auction.hourlyAuctionCode}
                </p>
              </div>
            </div>

            {/* Winners Section */}
            {auction.winners && auction.winners.length > 0 && (
              <div className="mt-6 pt-6 border-t border-purple-200/60">
                <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Final Winners
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {auction.winners.map((winner) => (
                    <div 
                      key={winner.rank}
                      className={`rounded-xl p-3 border-2 ${
                        winner.rank === 1 
                          ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300' 
                          : winner.rank === 2
                          ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300'
                          : winner.rank === 3
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
                          : winner.isCurrentUser 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                          : 'bg-purple-50/80 border-purple-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getRankIcon(winner.rank)}
                        <div className="flex-1">
                          <span className={`font-bold ${winner.isCurrentUser ? 'text-green-700' : 'text-purple-900'}`}>
                            {winner.playerUsername}
                            {winner.isCurrentUser && ' (You)'}
                          </span>
                          <div className="text-xs text-purple-500">
                            {winner.rank === 1 ? '1st Place' : winner.rank === 2 ? '2nd Place' : '3rd Place'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Prize: {winner.prizeAmount.toLocaleString('en-IN')}
                      </div>
                        <div className={`text-xs mt-2 flex items-center gap-1 ${
                          winner.prizeClaimStatus === 'CLAIMED'
                            ? 'text-green-600'
                            : winner.prizeClaimStatus === 'CANCELLED' || winner.prizeClaimStatus === 'EXPIRED'
                            ? 'text-orange-600'
                            : 'text-purple-600'
                        }`}>
                          {winner.prizeClaimStatus === 'CLAIMED' ? (
                            <>
                              <Gift className="w-3 h-3" />
                              Claimed by {winner.prizeClaimedBy || winner.playerUsername}
                            </>
                          ) : winner.prizeClaimStatus === 'CANCELLED' ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Claim cancelled
                            </>
                          ) : winner.prizeClaimStatus === 'EXPIRED' ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Claim expired
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Prize not claimed yet
                            </>
                          )}
                        </div>

                    </div>
                  ))}
                </div>
                
                {/* Sorry message for non-winners */}
                {!auction.winners.some(w => w.isCurrentUser) && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-100/60 to-violet-100/60 rounded-xl border border-purple-200/60">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">Better luck next time!</p>
                        <p className="text-sm text-purple-600 mt-1">
                          You participated in this auction but didn't make it to the top 3 winners. 
                          Keep trying, your winning moment is just around the corner!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Round Boxes */}
        <h2 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-600" />
          Round-wise Leaderboards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((roundNum) => {
            const round = rounds.find(r => r.roundNumber === roundNum);
            const hasData = round && round.leaderboard.length > 0;
            
            return (
              <motion.div
                key={roundNum}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: roundNum * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-purple-200/60 shadow-lg overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-purple-100/80 to-violet-100/80 border-b border-purple-200/60">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-violet-700 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{roundNum}</span>
                      </div>
                      Round {roundNum}
                    </h3>
                    {round && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        round.status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-700' 
                          : round.status === 'ACTIVE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {round.status}
                      </span>
                    )}
                  </div>
                  {round && (
                    <div className="flex gap-4 mt-2 text-xs text-purple-600">
                      <span>{round.totalParticipants} Participants</span>
                      <span>{round.qualifiedCount} Qualified</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {!hasData ? (
                    <p className="text-center text-purple-400 py-4">No data available</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setExpandedRound(expandedRound === roundNum ? null : roundNum)}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {expandedRound === roundNum ? 'Hide' : 'View'} Leaderboard
                        </Button>
                          <Button
                            onClick={() => downloadLeaderboard(roundNum)}
                            size="sm"
                            variant="outline"
                            className="flex-1 text-violet-700 border-violet-300 hover:bg-violet-50"
                            data-tutorial-target="download-leaderboard"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>

                      </div>

                      {/* Expanded Leaderboard */}
                      {expandedRound === roundNum && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 border-t border-purple-200/60 pt-3"
                        >
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {round.leaderboard.map((entry) => (
                              <div 
                                key={entry.playerId}
                                className={`flex items-center justify-between p-2 rounded-xl text-sm ${
                                  entry.isCurrentUser 
                                    ? 'bg-gradient-to-r from-purple-100 to-violet-100 border border-purple-300' 
                                    : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {getRankIcon(entry.rank)}
                                  <span className={`font-medium ${entry.isCurrentUser ? 'text-purple-900' : 'text-gray-800'}`}>
                                    {entry.playerUsername}
                                    {entry.isCurrentUser && <span className="text-purple-600 text-xs ml-1">(You)</span>}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-purple-700">
                                    ₹{entry.bidAmount.toLocaleString('en-IN')}
                                  </span>
                                  {entry.isQualified ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}