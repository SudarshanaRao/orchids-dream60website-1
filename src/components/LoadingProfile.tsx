import React from 'react';
import { motion } from 'framer-motion';

interface LoadingProfileProps {
  message?: string;
  subMessage?: string;
}

export const LoadingProfile: React.FC<LoadingProfileProps> = ({ 
  message = "Loading...", 
  subMessage = "Please wait" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-4 bg-white/50 backdrop-blur-sm rounded-3xl">
      <div className="relative">
        {/* Sleek Professional Spinner */}
        <div className="relative w-16 h-16">
          <motion.div
            className="absolute inset-0 border-4 border-purple-100 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-t-purple-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-b-purple-400 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      <div className="text-center space-y-2">
        <motion.h2 
          className="text-lg font-bold text-purple-900 tracking-tight"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {message}
        </motion.h2>
        <motion.p 
          className="text-purple-500 text-xs font-medium uppercase tracking-[0.2em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {subMessage}
        </motion.p>
      </div>
    </div>
  );
};
