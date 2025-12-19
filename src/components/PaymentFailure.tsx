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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose || onBackToHome}
        />
  
        <motion.div 
          className="relative z-10 w-full max-w-[320px] bg-white rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-400 to-rose-600"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <motion.div 
                className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
              >
                <motion.div
                  className="absolute inset-0 bg-red-100 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <XCircle className="w-12 h-12 text-red-500 relative z-10" />
              </motion.div>
            </div>

            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Failed</h2>
              <p className="text-sm text-gray-500 font-medium">Payment could not be processed</p>
            </div>

            <div className="bg-red-50 rounded-2xl p-4 mb-8 border border-red-100/50">
              <div className="flex items-start gap-2 text-left">
                <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 leading-relaxed font-bold">
                  {errorMessage}
                </p>
              </div>
            </div>
  
            <div className="space-y-3">
              <Button
                onClick={onRetry}
                className="w-full h-14 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-bold text-base transition-all shadow-lg shadow-red-100"
              >
                Try Again
              </Button>
  
              <Button
                variant="ghost"
                onClick={onBackToHome}
                className="w-full h-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-[10px] uppercase tracking-widest"
              >
                Cancel
              </Button>

              <div className="flex items-center justify-center gap-1.5 opacity-40 pt-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Redirecting in {countdown}s</span>
              </div>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              Refund will be issued if deducted
            </p>
          </div>
        </motion.div>
      </div>
    );
}
