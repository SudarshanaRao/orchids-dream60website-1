import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';

interface AmazonVoucherModalProps {
  onClose: () => void;
  isVisible: boolean;
}

export function AmazonVoucherModal({ onClose, isVisible }: AmazonVoucherModalProps) {
  const [show, setShow] = useState(false);

    useEffect(() => {
      if (isVisible) {
        setShow(true);
      } else {
        setShow(false);
      }
    }, [isVisible]);


  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {show && (
          <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={handleClose}
                />
            
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden"
              >
              <div className="relative bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl shadow-2xl border-2 border-amber-200">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-yellow-400/20 to-amber-400/20 rounded-full blur-3xl" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="relative p-8">
                {/* Icon */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg"
                >
                  <Gift className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3"
                >
                  Exclusive Offer!
                </motion.h2>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 mb-6"
                >
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <p className="text-gray-700 font-medium">Welcome to Dream60!</p>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-amber-200"
                >
                  <p className="text-gray-800 text-center text-lg leading-relaxed">
                    Get a chance to win{' '}
                    <span className="font-bold text-amber-600">Amazon Gift Vouchers</span>{' '}
                    worth up to{' '}
                    <span className="font-bold text-orange-600 text-xl">₹1000</span>!
                  </p>
                  <p className="text-gray-600 text-center mt-3 text-sm">
                    Participate in our auctions and stand a chance to win exciting prizes!
                  </p>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Start Bidding Now!
                </motion.button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
