import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, PlusSquare, ArrowUp, Smartphone, Chrome } from 'lucide-react';
import { Button } from './ui/button';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IOSInstallGuide({ isOpen, onClose }: IOSInstallGuideProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[10000] lg:hidden bg-white rounded-t-[2.5rem] shadow-2xl p-6 pb-10 border-t border-purple-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-900">Install Dream60</h3>
                  <p className="text-sm text-purple-600 font-medium">Add to your Home Screen</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-purple-50 hover:bg-purple-100 rounded-full text-purple-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <p className="text-purple-900 font-semibold mb-1">Open in Safari</p>
                  <p className="text-sm text-purple-600 leading-relaxed">Make sure you are viewing this site in Safari browser on your iOS device.</p>
                </div>
              </div>

              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-purple-900 font-semibold mb-1">Tap the Share Button</p>
                  <p className="text-sm text-purple-600 leading-relaxed flex items-center flex-wrap gap-2">
                    Look for the <Share className="w-4 h-4 text-blue-500" /> icon in Safari's bottom navigation bar.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 flex items-start gap-4">
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <p className="text-purple-900 font-semibold mb-1">Add to Home Screen</p>
                  <p className="text-sm text-purple-600 leading-relaxed flex items-center flex-wrap gap-2">
                    Scroll down and select <PlusSquare className="w-4 h-4" /> <span className="font-bold">"Add to Home Screen"</span> from the list.
                  </p>
                </div>
              </div>

              <div className="relative pt-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce text-purple-400">
                  <ArrowUp className="w-8 h-8" />
                </div>
                <Button 
                  onClick={onClose}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/30"
                >
                  Got it!
                </Button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-purple-400 font-medium uppercase tracking-wider">
              <span>Secure Installation</span>
              <div className="w-1 h-1 bg-purple-300 rounded-full" />
              <span>Official Dream60 PWA</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
