'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, ChevronRight, Trophy } from 'lucide-react';

export const ChristmasHeroBanner: React.FC = () => {
  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] mb-8 sm:mb-12 group">
      {/* Background Layer - AI Realistic Scene Style */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1544273677-c433136021d4?auto=format&fit=crop&q=80&w=1920')`,
            filter: 'brightness(0.7) contrast(1.1)'
          }}
        />
        {/* Warm Festive Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#B71C1C]/90 via-[#B71C1C]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Floating Snow Particles - Realistic Implementation */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            initial={{ 
              top: -20, 
              left: `${Math.random() * 100}%`, 
              opacity: 0,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              top: '110%',
              opacity: [0, 0.8, 0.8, 0],
              x: [0, Math.sin(i) * 40, 0],
              rotate: 360
            }}
            transition={{
              duration: 8 + Math.random() * 12,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-2 h-2 bg-white/60 rounded-full blur-[1px]"
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-20 h-[480px] sm:h-[520px] md:h-[560px] flex items-center px-6 sm:px-12 md:px-20 lg:px-24">
        <div className="max-w-3xl space-y-6 sm:space-y-8">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white/90 text-sm font-semibold tracking-wide"
          >
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span className="uppercase">Christmas Special</span>
          </motion.div>

          {/* Headline */}
          <div className="space-y-2 sm:space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.1] tracking-tight drop-shadow-2xl"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Have a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FFD700] to-white bg-[length:200%_auto] animate-shimmer italic font-script">
                Merrylitious
              </span> <br />
              Christmas
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-xl font-medium leading-relaxed drop-shadow-lg"
            >
              Win exciting prizes & festive rewards on <span className="text-white font-bold">Dream60</span>
            </motion.p>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(198, 40, 40, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-[#C62828] hover:bg-[#B71C1C] text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_10px_25px_rgba(198,40,40,0.3)] transition-all duration-300"
            >
              <span>Join Now</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 border-2 border-white text-white px-10 py-[14px] rounded-full font-bold text-lg transition-all duration-300"
            >
              View Offers
            </motion.button>
          </motion.div>
        </div>

        {/* Visual Focus - Right Side Overlay Effects */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden hidden lg:block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/4 right-[-10%] w-[120%] h-[120%] bg-radial-gradient from-[#FFD700]/20 to-transparent blur-[120px]"
          />
        </div>
      </div>

      {/* Decorative Bottom Elements */}
      <div className="absolute bottom-0 left-0 w-full p-8 z-20 flex justify-between items-end">
        {/* Subtle Branding */}
        <div className="opacity-30 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tighter">Dream60</span>
        </div>

        {/* Gift Icon Decoration */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-2xl hidden sm:block"
        >
          <Gift className="w-8 h-8 text-[#FFD700]" />
        </motion.div>
      </div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none ring-[40px] ring-black/10 inset-ring-black/10 rounded-[inherit] mix-blend-multiply" />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 6s linear infinite;
        }
        .bg-radial-gradient {
          background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
        }
      `}</style>
    </div>
  );
};
