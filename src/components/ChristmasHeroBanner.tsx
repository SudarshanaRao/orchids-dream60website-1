'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

export const ChristmasHeroBanner: React.FC = () => {
  return (
    <section className="relative w-full h-[40vh] sm:h-[750px] md:h-[650px] overflow-hidden bg-[#0a1a2f]">
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
                src="/christmas-santa.mp4" 
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

      {/* Gentle Snowfall - Optimized */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            initial={{ 
              top: -20, 
              left: `${Math.random() * 100}%`, 
              opacity: 0,
              scale: Math.random() * 0.4 + 0.2
            }}
            animate={{
              top: '110%',
              opacity: [0, 0.4, 0.4, 0],
              x: [0, Math.sin(i) * 50, 0],
            }}
            transition={{
              duration: 12 + Math.random() * 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Main Content Area */}
            <div className="relative z-30 h-full max-w-[1440px] mx-auto px-4 sm:px-12 md:px-20 lg:px-24 flex flex-col items-center justify-center">
              <div className="max-w-3xl space-y-4 sm:space-y-6 md:space-y-10 text-center">
                {/* Christmas Special Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#B71C1C]/80 rounded-full shadow-[0_4px_20px_rgba(183,28,28,0.4)] backdrop-blur-sm"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                  <span className="text-white text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase">
                    Christmas Special
                  </span>
                </motion.div>
  
                  {/* Headline & Subheadline */}
                  <div className="space-y-4 sm:space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 0.4 }}
                    >
                      <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] select-none"
                          style={{ fontFamily: "'Playfair Display', serif" }}>
                        Have a <br />
                        <span className="text-yellow-400 italic relative inline-block">
                          Merrylitious
                          <motion.span 
                            className="absolute -bottom-2 left-0 w-full h-[3px] bg-yellow-400/40 rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ delay: 1.2, duration: 1 }}
                          />
                        </span> <br />
                        Christmas
                      </h1>
                    </motion.div>
  
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1, delay: 0.6 }}
                      className="text-base sm:text-lg md:text-xl text-gray-200/90 font-medium max-w-lg leading-relaxed select-none mx-auto"
                    >
                      Win exciting prizes & festive rewards on <span className="font-bold text-yellow-400">Dream60</span>
                    </motion.p>
                  </div>
  
                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="pt-2 sm:pt-4 flex justify-center max-w-lg mx-auto w-full"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="relative flex items-center justify-center gap-3 bg-[#B71C1C]/90 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg shadow-2xl backdrop-blur-sm hover:bg-[#B71C1C] transition-colors"
                    >
                    <span className="relative z-10">Join Now</span>
                    <ChevronRight className="w-5 h-5 relative z-10" />
                  </motion.button>
                </motion.div>
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
