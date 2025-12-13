import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onCancel: () => void;
}

export function UpdateNotification({ onUpdate, onCancel }: UpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleUpdate = () => {
    setIsVisible(false);
    setTimeout(onUpdate, 300);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(onCancel, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 50, x: 50 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm"
        >
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl shadow-2xl border-2 border-purple-400/30 backdrop-blur-sm overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            
            <div className="relative p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Update Available</h3>
                    <p className="text-purple-200 text-xs">New version ready</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-white/90 text-sm mb-4 leading-relaxed">
                A new version of Dream60 is available with improvements and bug fixes.
              </p>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-white hover:bg-purple-50 text-purple-700 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Update Now
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
