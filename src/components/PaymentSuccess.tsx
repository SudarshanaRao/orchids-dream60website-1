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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm will-change-transform"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose || onBackToHome}
        />
  
        {/* Success Modal */}
        <motion.div 
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden will-change-transform"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Progress Timer Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <motion.div 
              className="h-full bg-green-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          <div className="p-6 text-center">
            {/* Minimal Success Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Success!</h2>
            <p className="text-sm text-gray-500 mb-6">
              {type === 'entry' 
                ? boxNumber === 0 ? 'Auction Entry Confirmed' : `Box ${boxNumber} Entry Confirmed`
                : 'Bid Placed Successfully'
              }
            </p>
  
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div className="flex items-center justify-center gap-1">
                <IndianRupee className="w-4 h-4 text-gray-900" strokeWidth={2.5} />
                <span className="text-2xl font-black text-gray-900">
                  {amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
  
            <div className="space-y-3">
              <Button
                onClick={onBackToHome}
                className="w-full h-11 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm transition-all"
              >
                Continue
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Auto-closing in {countdown}s</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
}
