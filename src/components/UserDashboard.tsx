import  { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Users, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface UserDashboardProps {
    user: {
        username: string;
        totalAuctions: number;
    };
    auction: {
        endTime: Date;
        totalParticipants: number;
        currentRound: number;
        boxes: {
            id: number;
            type: 'entry' | 'round';
            entryFee?: number;
            isOpen: boolean;
            minBid?: number;
            currentBid: number;
            bidder: string | null;
            hasPaid?: boolean;
            opensAt?: Date;
            closesAt?: Date;
            leaderboard?: {
                round: number;
                username: string;
                bid: number;
                timestamp: Date;
            }[];
            status?: string;
            roundNumber?: number;
        }[];
    };
}


export function UserDashboard({ user: _user, auction }: UserDashboardProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = auction.endTime.getTime() - now;
      
      if (distance > 0) {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeLeft('00:00:00');
      }
    };

    updateTimer(); // Initial call
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [auction.endTime]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {/* Time Left Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-purple-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-purple-500/20 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] hover:shadow-purple-500/30 hover:border-purple-300/70 transition-all duration-300 group ring-1 ring-purple-100/40">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut"
            }}
          />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-red-500/50 transition-all">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-purple-700 font-semibold">Time Left</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-lg sm:text-xl md:text-2xl font-black text-red-600 font-mono tracking-tight">
              {timeLeft}
            </div>
            <p className="text-[10px] sm:text-xs text-purple-600/70 mt-1 font-medium">Until auction ends</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Players Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-purple-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-purple-500/20 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] hover:shadow-purple-500/30 hover:border-purple-300/70 transition-all duration-300 group ring-1 ring-purple-100/40">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5.5,
              ease: "easeInOut"
            }}
          />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-purple-700 font-semibold">Players</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-lg sm:text-xl md:text-2xl font-black text-purple-700 tracking-tight">
              {auction.totalParticipants}
            </div>
            <p className="text-[10px] sm:text-xs text-purple-600/70 mt-1 font-medium">Active bidders</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Round Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-purple-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-purple-500/20 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] hover:shadow-purple-500/30 hover:border-purple-300/70 transition-all duration-300 group ring-1 ring-purple-100/40">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 6,
              ease: "easeInOut"
            }}
          />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/50 transition-all">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-purple-700 font-semibold">Round</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-lg sm:text-xl md:text-2xl font-black text-emerald-600 tracking-tight">
              {auction.currentRound}/6
            </div>
            <p className="text-[10px] sm:text-xs text-purple-600/70 mt-1 font-medium">Boxes opened</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-2 border-purple-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-purple-500/20 hover:shadow-[0_20px_50px_rgb(0,0,0,0.15)] hover:shadow-purple-500/30 hover:border-purple-300/70 transition-all duration-300 group ring-1 ring-purple-100/40">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-purple-50/20 to-transparent pointer-events-none" />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 6.5,
              ease: "easeInOut"
            }}
          />

          <CardHeader className="pb-2 sm:pb-3 relative">
            <CardTitle className="flex items-center space-x-2 text-xs sm:text-sm">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-purple-700 font-semibold">Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 mb-1 sm:mb-2 text-[10px] sm:text-xs font-semibold shadow-lg shadow-emerald-500/40 flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3" />
              Participating
            </Badge>
            <p className="text-[10px] sm:text-xs text-purple-600/70 font-medium">Entry fee paid</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}