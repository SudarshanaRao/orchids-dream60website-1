import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, AlertTriangle, Info, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

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
          className="relative z-10 w-full max-w-[340px] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-red-100"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-50" />

          {/* Top Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50/50">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-400 via-rose-500 to-red-600"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>

          <div className="p-8 relative">
            <div className="mb-6 flex justify-center">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center relative shadow-lg shadow-red-200"
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="absolute inset-0 bg-red-400 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <XCircle className="w-12 h-12 text-white relative z-10" strokeWidth={2.5} />
              </motion.div>
            </div>

            <div className="text-center space-y-1 mb-6">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-gray-900 tracking-tight"
              >
                Payment Failed
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-gray-500 font-medium"
              >
                Something went wrong with your transaction
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-red-50 rounded-2xl p-5 mb-8 border border-red-100/50 relative overflow-hidden"
            >
              <div className="flex items-start gap-3 text-left relative z-10">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-0.5">Error Message</span>
                  <p className="text-xs text-red-700 leading-relaxed font-bold italic">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/40 rounded-full blur-2xl" />
            </motion.div>
  
            <div className="space-y-4">
              <Button
                onClick={onRetry}
                className="w-full h-16 bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-red-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                Try Again
              </Button>
  
              <Button
                variant="ghost"
                onClick={onBackToHome}
                className="w-full h-12 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl font-bold text-xs uppercase tracking-[0.2em] transition-colors"
              >
                Cancel Transaction
              </Button>

              <div className="flex flex-col items-center gap-2 pt-2">
                <div className="flex items-center justify-center gap-1.5 opacity-40">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Redirecting in {countdown}s</span>
                </div>
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1 rounded-full transition-all duration-300 ${i < (5-countdown) ? 'w-4 bg-red-500' : 'w-2 bg-gray-200'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
  
          <div className="bg-red-50/50 px-6 py-4 border-t border-red-50 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest text-center">
              Automatic refund if amount deducted
            </p>
          </div>
        </motion.div>
      </div>
    );
}
