import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Trophy, Zap, X, ArrowRight, IndianRupee, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';

interface EntrySuccessModalProps {
  entryFee: number;
  boxNumber: number;
  onContinue: () => void;
  onClose: () => void;
}

export function EntrySuccessModal({ entryFee, boxNumber, onContinue, onClose }: EntrySuccessModalProps) {
  const [countdown, setCountdown] = useState(3);
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    // Disable body scroll when modal opens
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowContinue(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Re-enable body scroll when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
      clearInterval(timer);
    };
  }, [onClose]);

  return (
    <motion.div 
      className="fixed inset-0 bg-gradient-to-br from-[#221432]/95 via-[#3A2257]/90 to-[#221432]/95 backdrop-blur-xl z-50 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 py-6 sm:py-8">
        <motion.div 
          className="w-full max-w-md sm:max-w-lg my-auto relative group/modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            duration: 0.5,
            ease: [0.6, -0.05, 0.01, 0.99]
          }}
        >
          {/* Outer glow effect */}
          <motion.div 
            className="absolute -inset-[3px] bg-gradient-to-br from-[#9F7ACB]/40 via-[#B99FD9]/30 to-[#8456BC]/40 rounded-[28px] blur-2xl"
            animate={{ 
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Main modal container */}
          <div className="relative">
            {/* Layered glass background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/95 via-white/98 to-purple-100/95 rounded-[26px]"></div>
            <div className="absolute inset-0 backdrop-blur-3xl bg-white/60 rounded-[26px]"></div>
            
            {/* Content */}
            <div className="relative backdrop-blur-xl bg-white/40 rounded-[26px] border border-white/60 shadow-2xl overflow-hidden">
              
              {/* Animated Success Header */}
              <div className="relative overflow-hidden">
                {/* Background gradient animation */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-[#9F7ACB]/10 via-[#B99FD9]/15 to-[#9F7ACB]/10"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-300/10 to-emerald-400/10"></div>
                
                <div className="relative px-4 sm:px-6 py-6 sm:py-8 text-center backdrop-blur-sm">
                  {/* Success Icon with animation */}
                  <div className="flex items-center justify-center mb-4 sm:mb-5">
                    <div className="relative">
                      {/* Animated rings */}
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0"
                          initial={{ scale: 1, opacity: 0 }}
                          animate={{ 
                            scale: [1, 2, 2.5],
                            opacity: [0.5, 0.3, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut"
                          }}
                        >
                          <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400" />
                        </motion.div>
                      ))}
                      
                      {/* Main icon */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.2
                        }}
                      >
                        <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-500 drop-shadow-lg relative z-10" />
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Success Title */}
                  <motion.h2 
                    className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent mb-2 sm:mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    PAYMENT SUCCESS!
                  </motion.h2>
                  
                  {/* Subtitle with icons */}
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent uppercase tracking-wider"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8456BC]" />
                    <span>Entry Fee Paid Successfully</span>
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8456BC]" />
                  </motion.div>
                </div>
              </div>
              
              {/* Close Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 sm:right-3 sm:top-3 text-[#6B3FA0] hover:text-[#8456BC] hover:bg-purple-100/50 z-10 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0 transition-all duration-300 hover:rotate-90"
                  onClick={onClose}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </motion.div>
              
              {/* Main Content */}
              <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-4 sm:space-y-5">
                
                {/* Payment Confirmation Card */}
                <motion.div 
                  className="relative group/payment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-[#8456BC]/20 to-[#B99FD9]/20 rounded-2xl blur"></div>
                  <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-50/80 to-white/80 border border-purple-200/50 rounded-2xl p-4 sm:p-5 shadow-lg">
                    
                    {/* Amount Display */}
                    <div className="text-center mb-4">
                      <motion.div 
                        className="text-xs sm:text-sm text-[#6B3FA0] font-semibold mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        Entry Fee Charged
                      </motion.div>
                      <motion.div 
                        className="flex items-center justify-center gap-1 sm:gap-2"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          delay: 0.7,
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                      >
                        <motion.div
                          animate={{ 
                            rotate: [0, 10, -10, 10, 0],
                          }}
                          transition={{
                            duration: 0.5,
                            delay: 1,
                            ease: "easeInOut"
                          }}
                        >
                          <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-[#8456BC]" />
                        </motion.div>
                        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">
                          {entryFee.toLocaleString('en-IN')}
                        </div>
                      </motion.div>
                      <motion.div 
                        className="text-xs sm:text-sm text-[#6B3FA0] mt-2 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                      >
                        Box {boxNumber} - Successfully Paid
                      </motion.div>
                    </div>
                    
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {/* Entered Status */}
                      <motion.div 
                        className="relative group/card"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-xl blur-sm"></div>
                        <div className="relative backdrop-blur-lg bg-white/70 border border-emerald-200/40 rounded-xl p-2.5 sm:p-3 text-center transition-all duration-300">
                          <motion.div
                            animate={{ 
                              y: [0, -5, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mx-auto mb-1 drop-shadow" />
                          </motion.div>
                          <div className="text-[10px] sm:text-xs text-emerald-700 font-medium">Status</div>
                          <div className="text-xs sm:text-sm font-bold text-emerald-600">ENTERED</div>
                        </div>
                      </motion.div>
                      
                      {/* Next Round */}
                      <motion.div 
                        className="relative group/card"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-purple-50/50 rounded-xl blur-sm"></div>
                        <div className="relative backdrop-blur-lg bg-white/70 border border-purple-200/40 rounded-xl p-2.5 sm:p-3 text-center transition-all duration-300">
                          <motion.div
                            animate={{ 
                              rotate: [0, 15, -15, 15, 0],
                            }}
                            transition={{
                              duration: 0.6,
                              delay: 1.2,
                              ease: "easeInOut"
                            }}
                          >
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#8456BC] mx-auto mb-1 drop-shadow" />
                          </motion.div>
                          <div className="text-[10px] sm:text-xs text-[#6B3FA0] font-medium">Next</div>
                          <div className="text-xs sm:text-sm font-bold text-[#8456BC]">ROUND 1</div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Status Message */}
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Success Message */}
                  <motion.div 
                    className="relative group/success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/40 to-teal-100/40 rounded-xl blur-sm"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/70 border border-emerald-200/50 rounded-xl p-3 sm:p-4 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <Target className="w-4 h-4 text-emerald-600" />
                        </motion.div>
                        <div className="text-sm sm:text-base font-bold text-emerald-700">You're In!</div>
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-700 font-medium leading-relaxed">
                        Your entry fee has been processed successfully. Round 1 bidding is now available!
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Countdown */}
                  <AnimatePresence mode="wait">
                    {!showContinue && (
                      <motion.div 
                        className="relative group/countdown"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-[#9F7ACB]/20 to-[#B99FD9]/20 rounded-xl blur-sm"
                          animate={{
                            opacity: [0.2, 0.4, 0.2],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-50/80 to-purple-100/70 border border-purple-200/50 rounded-xl p-3 sm:p-4 text-center shadow-md">
                          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#6B3FA0] mb-1.5 sm:mb-2">
                            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Opening Round 1...</span>
                          </div>
                          <motion.div 
                            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#8456BC] to-[#9F7ACB] bg-clip-text text-transparent"
                            key={countdown}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20
                            }}
                          >
                            {countdown}
                          </motion.div>
                          <div className="text-[10px] sm:text-xs text-[#6B3FA0] mt-1 font-medium">seconds remaining</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Continue Button */}
                <AnimatePresence>
                  {showContinue && (
                    <motion.div 
                      className="space-y-2.5 sm:space-y-3"
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={onContinue}
                          className="w-full h-12 sm:h-14 relative overflow-hidden bg-gradient-to-r from-[#6B3FA0] via-[#8456BC] to-[#9F7ACB] text-white hover:from-[#8456BC] hover:via-[#9F7ACB] hover:to-[#B99FD9] transition-all duration-500 shadow-xl hover:shadow-2xl rounded-xl group/button"
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base md:text-lg font-bold">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Start Bidding in Round 1</span>
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.div>
                          </span>
                          {/* Shimmer effect */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                            animate={{
                              x: ['-200%', '200%']
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                              repeatDelay: 1
                            }}
                          />
                        </Button>
                      </motion.div>
                      
                      <motion.div 
                        className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#8456BC] to-[#9F7ACB] bg-clip-text text-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8456BC]" />
                        <span>Round 1 is now open for bidding!</span>
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8456BC]" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Note */}
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-purple-50/50 rounded-xl blur-sm"></div>
                  <p className="relative text-[10px] sm:text-xs text-[#6B3FA0] text-center font-medium leading-relaxed px-2 py-2 sm:py-2.5">
                    Entry fee payment confirmed. You can now participate in all auction rounds. Good luck!
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
