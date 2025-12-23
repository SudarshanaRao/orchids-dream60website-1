import { motion } from 'framer-motion';

export function LoadingProfile() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="relative flex flex-col items-center">
        {/* Main Logo/Icon Container */}
        <div className="relative w-24 h-24 mb-8">
          {/* Animated Rings */}
          <motion.div
            className="absolute inset-0 border-4 border-purple-100 rounded-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          <motion.div
            className="absolute inset-0 border-t-4 border-purple-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          <motion.div
            className="absolute inset-2 border-r-4 border-indigo-500 rounded-full opacity-60"
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Center Pulsing Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-4 h-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg shadow-purple-500/40"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <motion.h2
            className="text-xl font-black bg-gradient-to-r from-purple-900 to-indigo-900 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Dream60
          </motion.h2>
          
          <div className="flex items-center justify-center space-x-1">
            <motion.p
              className="text-xs font-bold text-purple-600/60 uppercase tracking-[0.2em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Loading Experience
            </motion.p>
            <motion.span
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                times: [0, 0.5, 1],
              }}
              className="flex space-x-1"
            >
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
              <span className="w-1 h-1 bg-purple-400 rounded-full" />
            </motion.span>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className="absolute -z-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
