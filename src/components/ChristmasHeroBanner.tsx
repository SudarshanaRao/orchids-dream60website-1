'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ChristmasHeroBannerProps {
  user?: any;
  onJoinNow?: () => void;
  onCheckRules?: () => void;
}

export const ChristmasHeroBanner: React.FC<ChristmasHeroBannerProps> = ({ user, onJoinNow, onCheckRules }) => {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const check = () => setIsLargeScreen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

    return (
      <section className="relative w-full h-[35vh] lg:h-[75vh] overflow-hidden bg-[#1a2236]">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/New_Auction_Rules.png"
            alt="Dream60 New Auction Rules"
            className="w-full h-full object-cover object-center"
          />
          
            {/* Subtle Overlays - keep image bright */}
            <div className="absolute inset-0 bg-black/10 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2236]/70 via-transparent to-transparent z-10" />
        </div>

        {/* DREAM60 Watermark */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-30">
          <span className="text-white/60 text-sm sm:text-lg lg:text-xl font-bold tracking-[0.15em] uppercase select-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
            DREAM60
          </span>
        </div>

        {/* Main Content Area */}
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-4 sm:px-12 md:px-20 lg:px-24 flex flex-col items-center justify-end pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                onClick={onJoinNow}
                className="group relative px-5 py-2 sm:px-10 sm:py-4 bg-yellow-500 hover:bg-yellow-400 rounded-full font-bold text-black text-xs sm:text-base uppercase tracking-wider sm:tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all duration-300 active:scale-95 flex items-center gap-1.5 sm:gap-2"
              >
                Join Now
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                onClick={onCheckRules}
                className="group relative px-5 py-2 sm:px-10 sm:py-4 bg-transparent border-2 border-yellow-500 hover:bg-yellow-500/10 rounded-full font-bold text-yellow-400 hover:text-yellow-300 text-xs sm:text-base uppercase tracking-wider sm:tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all duration-300 active:scale-95 flex items-center gap-1.5 sm:gap-2"
              >
                  New Rules
                <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
      </div>

      {/* Fire Rising Particles - Small */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`particle-sm-${i}`}
            initial={{ 
              bottom: `${-2 - Math.random() * 5}%`,
              left: `${Math.random() * 100}%`, 
              opacity: 0 
            }}
            animate={{
              y: [0, -(window?.innerHeight || 800) * 1.1],
              x: [0, 30 + Math.random() * 80],
              opacity: [0, 0.7, 0.6, 0.3, 0],
              scale: [1, 1.1, 0.9, 0.5],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full blur-[1px]"
          />
        ))}
        {/* Fire Rising Particles - Medium */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-md-${i}`}
            initial={{ 
              bottom: `${-2 - Math.random() * 5}%`,
              left: `${Math.random() * 100}%`, 
              opacity: 0 
            }}
            animate={{
              y: [0, -(window?.innerHeight || 800) * 1.15],
              x: [0, 20 + Math.random() * 100],
              opacity: [0, 0.6, 0.5, 0.2, 0],
              scale: [0.8, 1.3, 1, 0.4],
            }}
            transition={{
              duration: 10 + Math.random() * 6,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 12,
            }}
            className="absolute w-1.5 h-1.5 bg-orange-400 rounded-full blur-[2px]"
          />
        ))}
        {/* Fire Rising Particles - Large Embers */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`particle-lg-${i}`}
            initial={{ 
              bottom: `${-2 - Math.random() * 5}%`,
              left: `${Math.random() * 100}%`, 
              opacity: 0 
            }}
            animate={{
              y: [0, -(window?.innerHeight || 800) * 1.2],
              x: [0, 40 + Math.random() * 120],
              opacity: [0, 0.5, 0.4, 0.15, 0],
              scale: [1, 1.5, 1.1, 0.3],
            }}
            transition={{
              duration: 12 + Math.random() * 6,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 14,
            }}
            className="absolute w-2 h-2 bg-amber-500 rounded-full blur-[3px]"
          />
        ))}
      </div>
    </section>
  );
};
