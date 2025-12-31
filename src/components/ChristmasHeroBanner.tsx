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
    <section className="relative w-full h-[220px] sm:h-[750px] md:h-[650px] overflow-hidden bg-[#0a1a2f]">
      {/* Background Cinematic Container */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.05],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            repeatType: "reverse", 
            ease: "linear" 
          }}
          className="absolute inset-0 w-full h-full"
        >
            {/* Main Cinematic Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-center"
            >
              <source 
                src="/newyear_banner.mp4" 
                type="video/mp4" 
              />
            </video>
        </motion.div>
        
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
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-4 sm:px-12 md:px-20 lg:px-24 flex flex-col items-center justify-center">
        <div className="max-w-3xl space-y-2 sm:space-y-6 md:space-y-10 text-center">
          {/* Content removed as requested, keeping the space */}
        </div>
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
