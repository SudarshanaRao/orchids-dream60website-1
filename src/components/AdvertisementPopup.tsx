import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Trophy, Star } from 'lucide-react';
import { Button } from './ui/button';

interface AdvertisementPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdvertisementPopup({ isOpen, onClose }: AdvertisementPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl"
                  animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative p-6 pt-8 text-center">
                <motion.div
                  className="flex justify-center mb-4"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Gift className="w-10 h-10 text-white" />
                    </motion.div>
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Star className="w-4 h-4 text-white fill-white" />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.h2
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Win Amazing Prizes!
                </motion.h2>

                <motion.div
                  className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-purple-900 font-bold text-lg sm:text-xl py-3 px-4 rounded-xl mb-4 shadow-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6" />
                    <span>Amazon Vouchers</span>
                    <Trophy className="w-6 h-6" />
                  </div>
                </motion.div>

                <motion.p
                  className="text-white/90 text-base sm:text-lg mb-6 leading-relaxed"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  We provide <span className="font-bold text-yellow-400">Amazon vouchers</span> of product worth for winners!
                  <br />
                  <span className="text-white/70 text-sm">Participate in auctions and win exciting rewards.</span>
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-purple-900 font-bold py-6 text-lg rounded-xl shadow-lg shadow-amber-500/30 transition-all"
                  >
                    Start Winning Now!
                  </Button>
                </motion.div>

                <motion.p
                  className="text-white/50 text-xs mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Terms and conditions apply
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
