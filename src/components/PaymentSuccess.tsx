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
      const [isMobile, setIsMobile] = useState(false);

      useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
      }, []);
    
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
          color="#A78BFA"
          snowflakeCount={isMobile ? 40 : 100}
          radius={[0.5, 3.0]}
          speed={[1.0, 3.0]}
          style={{ zIndex: 101, position: 'fixed' }}
        />
        <motion.div 
          className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose || onBackToHome}
        />
    
        <motion.div 
          className="relative z-10 w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-purple-100"
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 40 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-purple-50 to-transparent opacity-50" />
          <motion.div 
            className="absolute -top-24 -right-24 w-64 h-64 bg-purple-100 rounded-full blur-[80px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-100 rounded-full blur-[80px]"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />

          {/* Top Progress Indicator */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
  
          <div className="p-8 sm:p-10 relative flex flex-col items-center">
            {/* Success Icon Wrapper */}
            <div className="mb-8 relative">
              <motion.div 
                className="w-28 h-28 bg-gradient-to-tr from-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center relative shadow-2xl shadow-purple-200"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 12 }}
              >
                <motion.div
                  className="absolute inset-[-8px] border-2 border-purple-200 rounded-[2.2rem]"
                  animate={{ scale: [1, 1.1, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Check className="w-14 h-14 text-white relative z-10" strokeWidth={3.5} />
              </motion.div>
              
              {/* Floating Accents */}
              <motion.div 
                className="absolute -top-4 -left-4"
                animate={{ y: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <motion.div 
                className="absolute -bottom-2 -right-6"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Trophy className="w-10 h-10 text-purple-200 opacity-60" />
              </motion.div>
            </div>
  
            <div className="text-center space-y-2 mb-10">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-gray-900 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Excellent!
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 font-medium max-w-[240px]"
              >
                {type === 'entry' 
                  ? boxNumber === 0 ? 'Your entry has been secured' : `Entry for Box ${boxNumber} confirmed`
                  : 'Your bid has been placed successfully'
                }
              </motion.p>
            </div>
  
            {/* Amount Display */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full bg-gray-50 rounded-3xl p-6 mb-10 border border-gray-100 flex flex-col items-center group hover:bg-white hover:shadow-xl transition-all duration-500"
            >
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Transaction Value</span>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-purple-200 transition-colors">
                  <IndianRupee className="w-5 h-5 text-purple-600" strokeWidth={2.5} />
                </div>
                <span className="text-4xl font-bold text-gray-900 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {amount.toLocaleString('en-IN')}
                </span>
              </div>
            </motion.div>
  
            <div className="w-full space-y-5">
              <Button
                onClick={onBackToHome}
                className="w-full h-16 bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-700 hover:to-indigo-800 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-purple-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Dashboard
              </Button>
  
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold tracking-wide uppercase">Redirecting in {countdown}s</span>
                </div>
                <div className="flex justify-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="h-1.5 rounded-full bg-gray-100 overflow-hidden"
                      style={{ width: i === 2 ? '24px' : '12px' }}
                    >
                      {i < (5 - countdown + 1) && (
                        <motion.div 
                          className="h-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );

}
