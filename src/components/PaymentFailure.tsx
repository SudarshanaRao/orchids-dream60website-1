import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, AlertTriangle, Info, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface PaymentFailureProps {
  amount: number;
  errorMessage?: string;
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentFailure({ 
  amount, 
  errorMessage = 'Payment processing failed',
  onRetry,
  onBackToHome,
  onClose
}: PaymentFailureProps) {
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

      {/* Failure Modal */}
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
        <div className="relative h-32 bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          </div>
          
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="relative w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center"
          >
            <XCircle className="w-12 h-12 text-red-600" strokeWidth={2.5} />
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
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
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-red-600 font-bold uppercase tracking-wider text-sm mb-6">
              Transaction Could Not Be Completed
            </p>
          </motion.div>

          <motion.div 
            className="bg-red-50 rounded-2xl p-6 mb-6 border border-red-100 text-left"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800 mb-1">Error Details:</p>
                <p className="text-sm text-red-600 leading-relaxed font-medium">
                  {errorMessage}
                </p>
              </div>
            </div>
          </motion.div>

            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-2 p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
                <div className="flex items-center gap-2 text-red-600">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Returning to home</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-4xl font-black text-red-700">{countdown}</span>
                  <span className="text-lg font-bold text-red-600/70">seconds remaining</span>
                </div>
              </div>

              <Button
                onClick={onRetry}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 shadow-lg shadow-purple-200 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </Button>

              <Button
                variant="ghost"
                onClick={onBackToHome}
                className="w-full h-12 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Auction Home
              </Button>
            </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
            Don't worry, if any amount was deducted, it will be refunded.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
