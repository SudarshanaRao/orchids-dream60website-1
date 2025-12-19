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
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose || onBackToHome}
        />
  
        {/* Failure Modal */}
        <motion.div 
          className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Progress Timer Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          <div className="p-6 text-center">
            {/* Minimal Failure Icon */}
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Failed</h2>
            <div className="bg-red-50 rounded-xl p-3 mb-6 border border-red-100 text-left">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 leading-relaxed font-medium">
                  {errorMessage}
                </p>
              </div>
            </div>
  
            <div className="space-y-3">
              <Button
                onClick={onRetry}
                className="w-full h-11 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold text-sm transition-all"
              >
                Try Again
              </Button>
  
              <Button
                variant="ghost"
                onClick={onBackToHome}
                className="w-full h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-xs"
              >
                Back to Auction Home
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Redirecting in {countdown}s</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              Refund will be issued if deducted
            </p>
          </div>
        </motion.div>
      </div>
    );
}
