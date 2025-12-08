import { motion } from 'motion/react';
import { XCircle, Home, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { AnimatedBackground } from './AnimatedBackground';

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
}: PaymentFailureProps) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40">
        <AnimatedBackground />
      </div>
      
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-rose-900/50 to-red-900/50 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Failure Card */}
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
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-3xl blur-xl opacity-40" />
        
        {/* Main Card */}
        <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Section */}
          <div className="relative bg-gradient-to-br from-red-50 via-white to-rose-50 px-6 pt-8 pb-6 text-center overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-red-300/20 rounded-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-rose-300/20 rounded-full blur-2xl" />
            
            <div className="relative">
              {/* Animated Failure Icon */}
              <div className="flex justify-center mb-4">
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/40"
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
                  <XCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>

              {/* Warning Icons */}
              <div className="flex justify-center gap-8 mb-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 fill-red-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500 fill-rose-500" />
                </motion.div>
              </div>

              {/* Title */}
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-2xl font-black bg-gradient-to-r from-red-800 via-rose-700 to-red-800 bg-clip-text text-transparent mb-1"
              >
                Payment Failed
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-sm text-red-600 font-medium"
              >
                Transaction could not be completed
              </motion.p>
            </div>
          </div>

          {/* Amount Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="px-6 py-5 bg-gradient-to-br from-red-50 to-rose-50"
          >
            <div className="text-center space-y-3">
              {/* Amount */}
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-2xl text-red-700 font-bold">₹</span>
                <div className="text-4xl font-black bg-gradient-to-r from-red-800 via-rose-700 to-red-800 bg-clip-text text-transparent">
                  {amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-red-500/30">
                  <XCircle className="w-3.5 h-3.5" strokeWidth={3} />
                  FAILED
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="px-6 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-t border-orange-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <Info className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs text-orange-700 leading-relaxed font-medium">
                  {errorMessage}
                </p>
                <p className="text-xs text-orange-600 mt-2 leading-relaxed">
                  Don't worry, no amount has been deducted from your account.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="px-6 py-5 space-y-3"
          >
            {/* Retry Button */}
            <Button
              onClick={onRetry}
              className="w-full h-12 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white hover:from-purple-500 hover:via-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 rounded-xl font-bold text-sm hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" strokeWidth={2.5} />
                Try Again
              </span>
            </Button>

            {/* Back to Home Button */}
            <Button
              onClick={onBackToHome}
              variant="outline"
              className="w-full h-12 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-all duration-300 rounded-xl font-bold text-sm hover:scale-[1.02]"
            >
              <span className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" strokeWidth={2.5} />
                Back to Auction
              </span>
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="bg-gradient-to-r from-red-50 via-white to-rose-50 border-t border-red-100 px-6 py-3 text-center"
          >
            <p className="text-xs text-red-600 font-medium">
              Need help? Contact support
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
