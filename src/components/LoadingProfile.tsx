import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Gavel, Trophy } from 'lucide-react';

interface LoadingProfileProps {
  message?: string;
  subMessage?: string;
}

export const LoadingProfile: React.FC<LoadingProfileProps> = ({ 
  message = "Preparing Your Profile", 
  subMessage = "Loading Account" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 p-4">
      <div className="relative w-32 h-32">
        {/* Outer rotating dashed ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed border-purple-300"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Pulsing background glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main animated container with gradient */}
        <motion.div
          className="absolute inset-2 bg-gradient-to-br from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(107,63,160,0.4)]"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Clock className="w-12 h-12 text-white" />
          
          {/* Internal rotating light sweep */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-t from-white/20 to-transparent"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        {/* Orbiting auction elements */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 2 * Math.PI) / 3) * 70, 0],
              y: [0, Math.sin((i * 2 * Math.PI) / 3) * 70, 0],
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: i * 0.4,
            }}
          >
            <div className="bg-white p-1.5 rounded-lg shadow-md border border-purple-100">
              {i === 0 ? <Gavel className="w-3 h-3 text-purple-600" /> : 
               i === 1 ? <Trophy className="w-3 h-3 text-purple-600" /> :
               <Clock className="w-3 h-3 text-purple-600" />}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3 text-center">
        <motion.h2 
          className="text-2xl font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.h2>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-purple-600 text-sm font-semibold tracking-wider uppercase">{subMessage}</span>
          <motion.div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-purple-600 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
