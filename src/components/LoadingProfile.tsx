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
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-4">
      <div className="relative">
        {/* Simple Professional Spinner */}
        <motion.div
          className="w-10 h-10 border-3 border-purple-100 border-t-purple-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold text-purple-900">
          {message}
        </h2>
        <p className="text-purple-500 text-xs uppercase tracking-wider">
          {subMessage}
        </p>
      </div>
    </div>
  );
};
