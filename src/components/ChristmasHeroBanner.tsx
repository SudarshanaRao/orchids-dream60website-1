'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

export const ChristmasHeroBanner: React.FC = () => {
  return (
    <section className="relative w-full h-[520px] sm:h-[580px] md:h-[600px] overflow-hidden bg-[#F8F9FA]">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-right sm:bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/render/image/public/document-uploads/Gemini_Generated_Image_zhjzuizhjzuizhjz-1766084966433.png?width=2000&height=2000&resize=contain')`,
          }}
        />
        {/* Subtle Vignette & Lighting Enhancement */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/10 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-black/5 z-10 pointer-events-none" />
        
        {/* Warm Festive Glow Overlay */}
        <div className="absolute inset-0 bg-[#FFD700]/5 mix-blend-overlay z-10 pointer-events-none" />
      </div>

      {/* Falling Snow Particles - Swiggy Style */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
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
              opacity: [0, 0.8, 0.8, 0],
              x: [0, Math.sin(i) * 40, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          />
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-20 lg:px-24 flex items-center">
        <div className="max-w-2xl space-y-6 md:space-y-8">
          {/* Christmas Special Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C62828] rounded-full shadow-[0_4px_15px_rgba(198,40,40,0.3)]"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            <span className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase">
              Christmas Special
            </span>
          </motion.div>

          {/* Headline & Subheadline */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-[#B71C1C] leading-[1.1] drop-shadow-sm select-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                Have a <br />
                <span className="italic relative inline-block">
                  Merrylitious
                  <motion.span 
                    className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#B71C1C]/20 rounded-full"
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
              className="text-lg sm:text-xl md:text-2xl text-gray-800/90 font-medium max-w-lg leading-relaxed select-none"
            >
              Win exciting prizes & festive rewards on <span className="font-bold text-[#B71C1C]">Dream60</span>
            </motion.p>
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-4"
          >
            <motion.button
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 10px 30px rgba(198, 40, 40, 0.4)',
                backgroundColor: '#D32F2F'
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center justify-center gap-3 bg-[#C62828] text-white px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-all duration-300"
            >
              <span className="relative z-10">Join Now</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Cloud / Snow Cut Bottom Edge - Swiggy Festive Style */}
      <div className="absolute -bottom-[2px] left-0 w-full z-40 pointer-events-none select-none">
        <svg 
          viewBox="0 0 1440 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-auto"
          preserveAspectRatio="none"
          style={{ height: '80px' }}
        >
          <path 
            d="M0 120H1440V54.4347C1440 54.4347 1341.5 24.5 1241.5 54.4347C1141.5 84.3694 1055.5 31.5 955.5 54.4347C855.5 77.3694 779.5 24.5 679.5 54.4347C579.5 84.3694 492.5 31.5 392.5 54.4347C292.5 77.3694 220.5 24.5 120.5 54.4347C20.5 84.3694 0 54.4347 0 54.4347V120Z" 
            fill="white"
          />
        </svg>
        {/* Extra Smoothness Layer */}
        <div className="w-full h-[2px] bg-white -mt-[1px]" />
      </div>

      {/* Subtle Logo Branding */}
      <div className="absolute top-10 right-10 z-40 opacity-40 pointer-events-none hidden md:block">
        <span className="text-[#B71C1C] font-black text-3xl tracking-tighter italic drop-shadow-sm">
          Dream60
        </span>
      </div>

    </section>
  );
};
