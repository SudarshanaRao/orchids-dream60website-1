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
        if (countdown === 0) {
          onBackToHome();
          // Attempt to close the window if it's a popup
          try {
            if (window.opener || window.history.length === 1) {
              window.close();
            }
          } catch (e) {
            console.log('Window close blocked by browser');
          }
          return;
        }
    
        const interval = setInterval(() => {
          setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
    
        return () => clearInterval(interval);
      }, [countdown, onBackToHome]);

  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
        <Snowfall 
          color="#A78BFA"
          snowflakeCount={isMobile ? 8 : 40}
          radius={[0.5, 3.0]}
          speed={[1.0, 3.0]}
          style={{ zIndex: 101, position: 'fixed' }}
        />
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
          {/* Header Section with Gradient */}
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-10 flex flex-col items-center relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            
            <motion.div 
              className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Check className="w-12 h-12 text-green-500" strokeWidth={4} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-center"
            >
              <div className="bg-white/20 backdrop-blur-md px-4 py-1 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-2 inline-block">
                Awesome!
              </div>
              <h2 className="text-white text-3xl font-bold tracking-tight">Congratulations.</h2>
              <p className="text-white/80 text-sm font-medium mt-1">
                {type === 'entry' ? 'Your order is accepted!' : 'Your bid is accepted!'}
              </p>
            </motion.div>
          </div>

          <div className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                  {type === 'entry' ? 'Join Details' : 'Bid Details'}
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 text-sm">Amount Paid</span>
                    <span className="text-gray-900 font-bold flex items-center gap-1 text-lg">
                      <IndianRupee className="w-4 h-4" />
                      {amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {boxNumber !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Box Number</span>
                      <span className="text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-lg text-sm">
                        #{boxNumber === 0 ? 'AUTO' : boxNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={onBackToHome}
                  className="w-full h-14 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-green-100"
                >
                  {type === 'entry' ? "Let's do again" : 'Back to Home'}
                </Button>
                
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Redirecting to home in {countdown}s
                  </span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-8 rounded-full transition-all duration-300 ${i < (5-countdown) ? 'bg-green-500' : 'bg-gray-100'}`} 
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
