import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trophy, Download, Eye, BarChart2, Clock, Users, IndianRupee, Medal, Crown, Award, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { API_ENDPOINTS, buildQueryString } from '../lib/api-config';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';

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
  winners: {
    rank: number;
    playerId: string;
    playerUsername: string;
    prizeAmount: number;
    isCurrentUser: boolean;
  }[];
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
          setAuction(data.auction);
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

    const csvContent = [
      ['Rank', 'Username', 'Bid Amount', 'Bid Time', 'Qualified'].join(','),
      ...round.leaderboard.map(entry => [
        entry.rank,
        entry.playerUsername,
        entry.bidAmount,
        new Date(entry.bidTime).toLocaleString('en-IN'),
        entry.isQualified ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${auction?.hourlyAuctionCode || 'auction'}_round${roundNumber}_leaderboard.csv`;
    link.click();
    toast.success(`Round ${roundNumber} leaderboard downloaded`);
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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button onClick={onBack} variant="ghost" className="mb-6 text-purple-700 hover:text-purple-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Auctions
        </Button>

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
                        winner.isCurrentUser 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                          : 'bg-purple-50/80 border-purple-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getRankIcon(winner.rank)}
                        <span className={`font-bold ${winner.isCurrentUser ? 'text-green-700' : 'text-purple-900'}`}>
                          {winner.playerUsername}
                          {winner.isCurrentUser && ' (You)'}
                        </span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Prize: {winner.prizeAmount.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
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