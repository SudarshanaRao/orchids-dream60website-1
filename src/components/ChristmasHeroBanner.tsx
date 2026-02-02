'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ChristmasHeroBannerProps {
  user?: any;
  onJoinNow?: () => void;
}

export const ChristmasHeroBanner: React.FC<ChristmasHeroBannerProps> = ({ user, onJoinNow }) => {
  return (
    <section className="relative w-full h-[60vh] lg:h-[85vh] overflow-hidden bg-[#050a14]">
      {/* Background Cinematic Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Main Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
        >
          <source 
            src="/launch_video.mp4" 
            type="video/mp4" 
          />
        </video>
        
        {/* Elegant Overlays */}
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-transparent to-[#050a14]/50 z-10" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-4 sm:px-12 md:px-20 lg:px-24 flex flex-col items-center justify-end pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center"
        >
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            onClick={onJoinNow}
            className="group relative px-10 py-4 bg-yellow-500 hover:bg-yellow-400 rounded-full font-bold text-black uppercase tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all duration-300 active:scale-95 flex items-center gap-2"
          >
            Join Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>

      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`, 
              opacity: 0 
            }}
            animate={{
              y: [0, -50],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full blur-[1px]"
          />
        ))}
      </div>
    </section>
  );
};
