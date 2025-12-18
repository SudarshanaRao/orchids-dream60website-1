'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, ChevronRight, Star } from 'lucide-react';

export const ChristmasHeroBanner: React.FC = () => {
  return (
    <section className="relative w-full h-[520px] sm:h-[580px] md:h-[620px] overflow-hidden bg-[#B71C1C]">
      {/* Background Layer - Photorealistic AI Scene */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1544273677-c433136021d4?auto=format&fit=crop&q=80&w=1920')`,
          }}
        />
        {/* Layered Festive Gradients for Depth & Premium Feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#B71C1C] via-[#B71C1C]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10" />
        
        {/* Subtle Swiggy-style Red Overlay */}
        <div className="absolute inset-0 bg-[#C62828]/20 mix-blend-overlay z-10" />
      </div>

      {/* Floating Snow Particles - High Density & Smooth Motion */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {[...Array(50)].map((_, i) => (
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
              opacity: [0, 0.7, 0.7, 0],
              x: [0, Math.sin(i) * 50, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-2 h-2 bg-white rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="relative z-30 h-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-20 lg:px-24 flex items-center">
        
        {/* Left Side: Content Area */}
        <div className="w-full lg:w-3/5 text-left space-y-6 sm:space-y-8">
          
          {/* Badge: Christmas Special */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-xl border border-white/30 rounded-full shadow-xl"
          >
            <Sparkles className="w-4 h-4 text-[#FFD700] animate-pulse" />
            <span className="text-white text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
              Christmas Special
            </span>
          </motion.div>

          {/* Headline: Premium Typography */}
          <div className="space-y-3">
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight drop-shadow-2xl"
            >
              Have a <br />
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFD700] to-white bg-[length:200%_auto] animate-shimmer italic font-serif">
                  Merrylitious
                </span>
                <motion.div 
                  className="absolute -top-4 -right-8 hidden md:block"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-8 h-8 text-[#FFD700] fill-[#FFD700] blur-[1px]" />
                </motion.div>
              </span> <br />
              Christmas
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-lg font-medium leading-relaxed drop-shadow-md"
            >
              Win exciting prizes & festive rewards on <span className="font-bold border-b-2 border-[#FFD700]">Dream60</span>
            </motion.p>
          </div>

          {/* CTAs: High Contrast & Interactive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-5 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-white text-[#B71C1C] px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span>Join Now</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 border-2 border-white/60 text-white px-10 py-[14px] rounded-full font-bold text-lg backdrop-blur-sm transition-all duration-300"
            >
              View Offers
            </motion.button>
          </motion.div>
        </div>

        {/* Right Side: Visual Focus - 3D Decorations & Scene */}
        <div className="hidden lg:flex w-2/5 h-full relative items-center justify-center">
          {/* Animated 3D-style Tree & Gifts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.4, type: "spring" }}
            className="relative z-10"
          >
            {/* Swiggy-style Hanging Santa Animation */}
            <motion.div 
              className="absolute -top-40 left-1/2 -translate-x-1/2 z-20"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-[120px] h-[200px] bg-contain bg-no-repeat filter drop-shadow-2xl" 
                   style={{ backgroundImage: 'url("https://ouch-cdn2.icons8.com/5lVqV8I7_1V9fS-7O-p6C_3i9iN7z4Z6V4X5P7yL6K8/rs:fit:368:460/czM6Ly9pY29uczgu/b3VjaC1wcm9kLmFz/c2V0cy9zdmcvMzg3/LzYyZDMzMjUzLTkz/ZDEtNDU4NC1hOGQw/LTliZDQ0N2JmOTBk/Ny5zdmc.png")' }} />
            </motion.div>

            {/* Glowing Christmas Tree */}
            <div className="relative w-[400px] h-[500px]">
               <img 
                 src="https://images.unsplash.com/photo-1512470876302-972fad2aa9dd?auto=format&fit=crop&q=80&w=600" 
                 alt="Christmas Tree"
                 className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,215,0,0.3)]"
               />
               {/* Sparkle Overlays */}
               {[...Array(10)].map((_, i) => (
                 <motion.div
                   key={`sparkle-${i}`}
                   animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                   transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                   className="absolute bg-white rounded-full w-1 h-1 blur-[1px]"
                   style={{ 
                     top: `${Math.random() * 80 + 10}%`, 
                     left: `${Math.random() * 60 + 20}%` 
                   }}
                 />
               ))}
            </div>

            {/* Piled Gifts at Bottom */}
            <div className="absolute -bottom-10 left-0 right-0 flex justify-around gap-4">
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl"
              >
                <Gift className="w-10 h-10 text-[#C62828] fill-[#C62828]/20" />
              </motion.div>
              <motion.div 
                whileHover={{ y: -10 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 p-5 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl translate-y-4"
              >
                <Gift className="w-12 h-12 text-[#FFD700] fill-[#FFD700]/20" />
              </motion.div>
            </div>
          </motion.div>

          {/* Background Glow behind decorations */}
          <div className="absolute inset-0 bg-radial-gradient from-[#FFD700]/10 to-transparent blur-3xl opacity-50" />
        </div>
      </div>

      {/* Subtle Branding Watermark */}
      <div className="absolute top-8 right-8 z-40 opacity-20 pointer-events-none hidden md:block">
        <span className="text-white font-black text-3xl tracking-tighter italic">Dream60</span>
      </div>

      {/* Decorative Bottom Wave/Transition */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent z-20" />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 5s linear infinite;
        }
        .bg-radial-gradient {
          background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
        }
      `}</style>
    </section>
  );
};
