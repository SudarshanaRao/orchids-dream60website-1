import { motion } from 'framer-motion';
import { Check, Trophy, Home, IndianRupee, Sparkles, CheckCircle2, Star, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

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
      const timer = setTimeout(() => {
        onBackToHome();
      }, 5000);
  
      const interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
  
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }, [onBackToHome]);
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
        <Snowfall 
          color="#8B5CF6"
          snowflakeCount={80}
          radius={[0.5, 2.5]}
          speed={[0.5, 2.0]}
          style={{ zIndex: 101, position: 'fixed' }}
        />
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose || onBackToHome}
        />
  
        <motion.div 
          className="relative z-10 w-full max-w-[340px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-green-100"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />

          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50/50">
            <motion.div 
              className="h-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          <div className="p-8 relative">
            <div className="mb-6 flex justify-center">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center relative shadow-lg shadow-green-200"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="absolute inset-0 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Check className="w-12 h-12 text-white relative z-10" strokeWidth={4} />
                <motion.div 
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
            </div>

            <div className="text-center space-y-1 mb-8">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-gray-900 tracking-tight"
              >
                Payment Success!
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 font-medium px-4"
              >
                {type === 'entry' 
                  ? boxNumber === 0 ? 'Your auction entry is confirmed' : `Box ${boxNumber} entry is confirmed`
                  : 'Your bid has been placed successfully'
                }
              </motion.p>
            </div>
  
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50/30 rounded-2xl p-6 mb-8 border border-green-100/50 flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-200 to-transparent opacity-30" />
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Total Paid</span>
              <div className="flex items-center gap-1.5">
                <IndianRupee className="w-5 h-5 text-green-700" strokeWidth={3} />
                <span className="text-4xl font-black text-green-700">
                  {amount.toLocaleString('en-IN')}
                </span>
              </div>
            </motion.div>
  
            <div className="space-y-4">
              <Button
                onClick={onBackToHome}
                className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-green-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue Winning
              </Button>

              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-1.5 opacity-40">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Redirecting in {countdown}s</span>
                </div>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i < (5-countdown) ? 'w-4 bg-green-500' : 'w-2 bg-gray-200'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
}
