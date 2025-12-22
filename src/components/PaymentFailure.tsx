import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, AlertTriangle, Info, Clock, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

interface PaymentFailureProps {
  amount: number;
  errorMessage?: string;
  auctionId?: string;
  auctionNumber?: string | number;
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentFailure({ 
  amount, 
  errorMessage = 'Payment processing failed',
  auctionId,
  auctionNumber,
  onRetry,
  onBackToHome,
  onClose
}: PaymentFailureProps) {
    const [countdown, setCountdown] = useState(5);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
  
    useEffect(() => {
      // Fast redirect for FAILURE - 5 ticks of 100ms = 500ms total
      const timer = setTimeout(() => {
        onBackToHome();
      }, 500);
      
      return () => clearTimeout(timer);
    }, [onBackToHome]);

    useEffect(() => {
      if (countdown === 0) return;
  
      const interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 100);
  
      return () => clearInterval(interval);
    }, [countdown]);
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <Snowfall 
          color="#EF4444"
          snowflakeCount={isMobile ? 2 : 20}
          radius={[0.3, 1.2]}
          speed={[0.2, 0.6]}
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
          className="relative z-10 w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          {/* Header Section with Red Gradient */}
          <div className="bg-gradient-to-br from-red-500 to-rose-700 p-8 flex flex-col items-center relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            
            <motion.div 
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <X className="w-10 h-10 text-red-500" strokeWidth={4} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">
                Transaction Failed
              </div>
              <h2 className="text-white text-2xl font-bold tracking-tight">Oh No!</h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">
                Your payment couldn't be processed
              </p>
            </motion.div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                  Error Details
                </p>
                <div className="bg-red-50 rounded-2xl p-4 border border-dashed border-red-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Transaction Type</span>
                    <span className="text-gray-900 font-bold">Entry Fee</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 text-xs">Amount Attempted</span>
                    <span className="text-red-600 font-bold flex items-center gap-1 text-base">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {auctionId && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Auction ID</span>
                      <span className="text-gray-900 font-mono text-[9px] bg-white px-2 py-0.5 border border-gray-100 rounded">
                        {auctionId}
                      </span>
                    </div>
                  )}

                  {auctionNumber && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Auction Number</span>
                      <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded text-[10px]">
                        #{auctionNumber}
                      </span>
                    </div>
                  )}

                  <div className="text-left pt-2 border-t border-red-100">
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest block mb-1">Error Message</span>
                    <p className="text-red-500 text-[10px] font-medium leading-relaxed italic">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={onRetry}
                  className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-base transition-all shadow-lg"
                >
                  Try Again
                </Button>
                
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Returning in few milliseconds...
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-0.5 w-6 rounded-full transition-all duration-300 ${i < (5-countdown) ? 'bg-red-500' : 'bg-gray-100'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
}
