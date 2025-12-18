import { motion } from 'framer-motion';
import { Check, Trophy, Home, IndianRupee, Sparkles, CheckCircle2, Star, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface PaymentSuccessProps {
  amount: number;
  type: 'entry' | 'bid';
  boxNumber?: number;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentSuccess({ 
  amount, 
  type, 
  boxNumber, 
  onBackToHome,
  onClose
}: PaymentSuccessProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBackToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBackToHome]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose || onBackToHome}
      />

      {/* Success Modal */}
      <motion.div 
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose || onBackToHome}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Decorative Header */}
        <div className="relative h-32 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          </div>
          
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="relative w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center"
          >
            <CheckCircle2 className="w-12 h-12 text-purple-600" strokeWidth={2.5} />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-2 border-2 border-white/50 rounded-2xl"
            />
          </motion.div>
        </div>

        <div className="px-8 pt-8 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Success!</h2>
            <p className="text-purple-600 font-bold uppercase tracking-wider text-sm mb-6">
              {type === 'entry' 
                ? boxNumber === 0 ? 'Auction Entry Confirmed' : `Box ${boxNumber} Entry Confirmed`
                : 'Bid Placed Successfully'
              }
            </p>
          </motion.div>

          <motion.div 
            className="bg-purple-50 rounded-2xl p-6 mb-6 border border-purple-100"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <IndianRupee className="w-6 h-6 text-purple-700" strokeWidth={3} />
              <span className="text-4xl font-black text-gray-900">
                {amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md">
              <Check className="w-3 h-3" strokeWidth={3} />
              TRANSACTION COMPLETED
            </div>
          </motion.div>

            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                <div className="flex items-center gap-2 text-purple-600">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Auto-closing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-purple-700">{countdown}</span>
                  <span className="text-lg font-bold text-purple-600/70">seconds remaining</span>
                </div>
              </div>

              <Button
                onClick={onBackToHome}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Home className="w-5 h-5" />
                Continue to Auction
              </Button>
            </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Best of Luck for the Auction!
          </span>
          <Trophy className="w-4 h-4 text-yellow-500" />
        </div>
      </motion.div>

        {/* Confetti-like elements - reduced for smooth performance */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                top: "50%", 
                left: "50%", 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 2.5, 
                delay: 0.3 + i * 0.1,
                ease: "easeOut"
              }}
              className="absolute will-change-transform"
            >
              {i % 2 === 0 ? (
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-400" />
              )}
            </motion.div>
          ))}
        </div>
    </div>
  );
}
