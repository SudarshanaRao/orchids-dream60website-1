
import { motion } from 'motion/react';
import { Check, Trophy, Home, IndianRupee, Sparkles, CheckCircle2, Star } from 'lucide-react';
import { Button } from './ui/button';
import { AnimatedBackground } from './AnimatedBackground';

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
}: PaymentSuccessProps) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40">
        <AnimatedBackground />
      </div>
      
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-violet-900/50 to-purple-900/50 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Success Card */}
      <motion.div 
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ 
          duration: 0.5,
          ease: [0.6, -0.05, 0.01, 0.99]
        }}
      >
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 rounded-3xl blur-xl opacity-40" />
        
        {/* Main Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-purple-50 via-white to-violet-50 px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-purple-300/20 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-300/20 rounded-full blur-2xl" />
            
            <div className="relative">
              {/* Animated Success Icon */}
              <div className="flex justify-center mb-4">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/40"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    rotate: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <CheckCircle2 className="w-9 h-9 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>

              {/* Sparkles */}
              <div className="flex justify-center gap-8 mb-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Star className="w-5 h-5 text-purple-500 fill-purple-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Star className="w-4 h-4 text-violet-500 fill-violet-500" />
                </motion.div>
              </div>

              {/* Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-black bg-gradient-to-r from-purple-800 via-violet-700 to-purple-800 bg-clip-text text-transparent mb-1"
              >
                Payment Success!
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-sm text-purple-600 font-medium"
              >
                {type === 'entry' 
                  ? boxNumber === 0 
                    ? 'Entry fee processed' 
                    : `Box ${boxNumber} entry paid`
                  : `Bid placed on Box ${boxNumber || ''}`
                }
              </motion.p>
            </div>
          </div>

          {/* Amount Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="px-6 py-5 bg-gradient-to-br from-purple-50 to-violet-50"
          >
            <div className="text-center space-y-3">
              {/* Amount */}
              <div className="flex items-center justify-center gap-1.5">
                <IndianRupee className="w-7 h-7 text-purple-700" strokeWidth={2.5} />
                <div className="text-4xl font-black bg-gradient-to-r from-purple-800 via-violet-700 to-purple-800 bg-clip-text text-transparent">
                  {amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-green-500/30">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  COMPLETED
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Message */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="px-6 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  {type === 'entry' 
                    ? boxNumber === 0
                      ? 'Both entry boxes paid! Round 1 is now open.'
                      : 'Round boxes open every 15 minutes.'
                    : 'Your bid is now active. Good luck!'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="px-6 py-5"
          >
            <Button
              onClick={onBackToHome}
              className="w-full h-12 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 rounded-xl font-bold text-sm hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" strokeWidth={2.5} />
                Continue to Auction
              </span>
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-gradient-to-r from-purple-50 via-white to-violet-50 border-t border-purple-100 px-6 py-3 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 text-purple-600">
              <Trophy className="w-3.5 h-3.5" />
              <p className="text-xs font-bold">
                Best of luck!
              </p>
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
