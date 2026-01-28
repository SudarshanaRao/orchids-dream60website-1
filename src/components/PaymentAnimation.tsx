import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface PaymentAnimationProps {
  status: 'success' | 'failure';
  onComplete: () => void;
}

export function PaymentAnimation({ status, onComplete }: PaymentAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000); // 3 seconds for animation

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-6"
      >
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
          >
            {status === 'success' ? (
              <div className="bg-emerald-100 p-8 rounded-full">
                <CheckCircle2 className="w-24 h-24 text-emerald-500" />
              </div>
            ) : (
              <div className="bg-red-100 p-8 rounded-full">
                <XCircle className="w-24 h-24 text-red-500" />
              </div>
            )}
          </motion.div>
          
          {status === 'success' && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: Math.cos(i * (Math.PI / 4)) * 100,
                    y: Math.sin(i * (Math.PI / 4)) * 100
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                >
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </motion.div>
              ))}
            </>
          )}

          {status === 'failure' && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.8, 1.2, 0.8],
                    y: [0, -80],
                    x: (i % 2 === 0 ? 1 : -1) * (30 + i * 20)
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </motion.div>
              ))}
            </>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className={`text-3xl font-bold ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {status === 'success' ? 'Payment Successful!' : 'Payment Failed'}
          </h2>
          <p className="text-gray-500 mt-2 text-lg">
            {status === 'success' ? 'Your transaction was completed successfully.' : "We couldn't process your payment at this time."}
          </p>
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3, ease: "linear" }}
          className={`h-1.5 ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'} rounded-full mt-8 max-w-[200px] mx-auto`}
        />
      </motion.div>
    </div>
  );
}
