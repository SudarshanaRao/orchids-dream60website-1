'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

interface ChristmasHeroBannerProps {
  user?: any;
  onJoinNow?: () => void;
}

export const ChristmasHeroBanner: React.FC<ChristmasHeroBannerProps> = ({ user, onJoinNow }) => {
  return (
    <section className="relative w-full h-[50vh] lg:h-[75vh] overflow-hidden bg-[#0a1a2f]">
      {/* Background Cinematic Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Mobile Video - 100% width/height, object-cover */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="block lg:hidden w-full h-full object-cover object-center"
        >
          <source 
            src="/newyear_banner.mp4" 
            type="video/mp4" 
          />
        </video>

        {/* Desktop Video - 75vh, object-cover for full width background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hidden lg:block w-full h-full object-cover object-center"
        >
          <source 
            src="/newyear_banner_large.mp4" 
            type="video/mp4" 
          />
        </video>
        
        {/* Elegant Overlays */}
        {/* Darkening Gradient for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a2f]/80 via-[#0a1a2f]/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a2f]/60 via-transparent to-[#0a1a2f]/40 z-10" />
        
        {/* Soft Golden Bokeh/Glow */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full z-10 pointer-events-none animate-pulse" />
      </div>

      {/* Golden Particle System */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`gold-particle-${i}`}
            initial={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`, 
              opacity: 0,
              scale: Math.random() * 0.5 + 0.2
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.6, 0],
              x: [0, Math.sin(i) * 30],
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full blur-[1px] shadow-[0_0_8px_rgba(253,224,71,0.8)]"
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-4 sm:px-12 md:px-20 lg:px-24 flex flex-col items-center lg:items-start justify-end lg:justify-center pb-8 sm:pb-12 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left"
        >
          {/* New Year Wishes - Desktop Only as requested */}
          <div className="hidden lg:block mb-6">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl"
            >
              Happy New Year <span className="text-yellow-400">2026!</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-lg md:text-xl text-yellow-100 font-medium max-w-2xl drop-shadow-md"
            >
              Wishing you a year filled with prosperity, happiness, and extraordinary wins. 
              Celebrate the new beginning with Dream60!
            </motion.p>
          </div>

          <button
            onClick={onJoinNow}
            className="group relative px-6 py-2.5 sm:px-8 sm:py-3 lg:px-10 lg:py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full font-bold text-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] transform hover:-translate-y-1 transition-all duration-300 active:scale-95 mb-4 lg:mb-0"
          >
            <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base lg:text-lg">
              Join Now
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300" />
          </button>
        </motion.div>
      </div>

      {/* Subtle Logo Branding */}
      <div className="absolute top-10 right-10 z-40 opacity-30 pointer-events-none hidden md:block">
        <span className="text-white font-black text-3xl tracking-tighter italic drop-shadow-lg">
          Dream60
        </span>
      </div>

    </section>
  );
};
