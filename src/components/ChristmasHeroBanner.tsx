import React from 'react';
import { motion } from 'framer-motion';

export const ChristmasHeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#E0F2FE] via-[#F8FAFC] to-white rounded-3xl border border-blue-100 shadow-sm mb-6 sm:mb-8">
      {/* Falling Snow Effect */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60 z-10"
          initial={{ 
            top: -10, 
            left: `${Math.random() * 100}%` 
          }}
          animate={{ 
            top: '110%',
            left: `${(Math.random() * 100) + (Math.random() * 10 - 5)}%`
          }}
          transition={{ 
            duration: Math.random() * 5 + 5, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10
          }}
        />
      ))}

      <div className="relative px-4 py-8 sm:py-12 md:py-16 flex flex-col items-center text-center">
        {/* Snowy Background Elements (Hills) */}
        <div className="absolute bottom-0 left-0 w-full h-24 sm:h-32 pointer-events-none overflow-hidden rounded-b-3xl">
          <svg className="absolute bottom-0 w-[120%] h-full -left-[10%] opacity-20" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M0,100 C150,20 350,80 500,50 C650,20 850,80 1000,50 L1000,100 L0,100 Z" fill="#93C5FD" />
          </svg>
          <svg className="absolute bottom-0 w-[120%] h-4/5 -left-[5%] opacity-40" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M0,100 C200,30 400,90 600,60 C800,30 900,90 1000,60 L1000,100 L0,100 Z" fill="#BFDBFE" />
          </svg>
          <svg className="absolute bottom-0 w-full h-3/5" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path d="M0,100 C250,40 500,100 750,60 C850,40 950,90 1000,70 L1000,100 L0,100 Z" fill="white" />
          </svg>
        </div>

        {/* Trees Left */}
        <div className="absolute left-2 sm:left-8 bottom-4 sm:bottom-8 w-16 sm:w-24 md:w-32 z-20 pointer-events-none">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
          >
             <svg viewBox="0 0 100 150" className="drop-shadow-lg">
                <path d="M50 0L85 60H15L50 0Z" fill="#166534" />
                <path d="M50 30L90 100H10L50 30Z" fill="#14532D" />
                <path d="M50 60L100 140H0L50 60Z" fill="#064E3B" />
                {/* Ornaments */}
                <circle cx="35" cy="55" r="3" fill="#3B82F6" />
                <circle cx="65" cy="85" r="3" fill="#EF4444" />
                <circle cx="25" cy="115" r="3" fill="#EAB308" />
                <circle cx="75" cy="115" r="3" fill="#3B82F6" />
                {/* Snow on tree */}
                <path d="M50 0L65 25C58 20 42 20 35 25L50 0Z" fill="white" opacity="0.6" />
                <path d="M40 35L20 60H35C45 50 55 50 65 60H80L60 35H40Z" fill="white" opacity="0.4" />
             </svg>
          </motion.div>
        </div>

        {/* Trees Right */}
        <div className="absolute right-2 sm:right-8 bottom-4 sm:bottom-8 w-16 sm:w-24 md:w-32 z-20 pointer-events-none hidden sm:block">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.4 }}
          >
             <svg viewBox="0 0 100 150" className="drop-shadow-lg">
                <path d="M50 0L85 60H15L50 0Z" fill="#166534" />
                <path d="M50 30L90 100H10L50 30Z" fill="#14532D" />
                <path d="M50 60L100 140H0L50 60Z" fill="#064E3B" />
                <circle cx="45" cy="55" r="3" fill="#EF4444" />
                <circle cx="35" cy="95" r="3" fill="#3B82F6" />
                <circle cx="75" cy="125" r="3" fill="#EAB308" />
             </svg>
          </motion.div>
        </div>

        {/* Snowman Right (Visible on mobile/tablet+) */}
        <div className="absolute right-4 sm:right-20 md:right-32 bottom-2 sm:bottom-4 w-16 sm:w-24 md:w-32 z-30 pointer-events-none">
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.6 }}
          >
             <svg viewBox="0 0 100 120" className="drop-shadow-xl">
                {/* Body */}
                <circle cx="50" cy="95" r="25" fill="white" />
                <circle cx="50" cy="65" r="18" fill="white" />
                <circle cx="50" cy="40" r="13" fill="white" />
                {/* Eyes */}
                <circle cx="46" cy="38" r="1.5" fill="#1F2937" />
                <circle cx="54" cy="38" r="1.5" fill="#1F2937" />
                {/* Nose */}
                <path d="M50 40L55 42L50 44Z" fill="#F97316" />
                {/* Hat */}
                <path d="M37 32L63 32L55 15L45 15Z" fill="#DC2626" />
                <rect x="35" y="28" width="30" height="4" rx="2" fill="#DC2626" />
                {/* Scarf */}
                <path d="M35 52C40 48 60 48 65 52L60 62C55 58 45 58 40 62L35 52Z" fill="#166534" />
                <rect x="58" y="52" width="4" height="15" rx="1" fill="#166534" />
                {/* Mittens */}
                <circle cx="30" cy="70" r="5" fill="#DC2626" />
                <circle cx="70" cy="70" r="5" fill="#DC2626" />
             </svg>
          </motion.div>
        </div>

        <motion.div 
          className="z-40 space-y-2 sm:space-y-4 max-w-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xl sm:text-2xl font-medium text-[#C2410C] italic font-serif">
            have a
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight drop-shadow-sm">
            <span className="text-[#DC2626] font-serif">Merrylicious</span>
            <br />
            <span className="text-[#DC2626] font-serif">Christmas</span>
          </h2>
          
          <div className="pt-4 sm:pt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-[#DC2626] text-white px-6 sm:px-10 py-3 sm:py-4 rounded-full font-bold text-lg sm:text-xl shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto group"
            >
              Get min ₹125 OFF
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              >
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Snow on Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-4 sm:h-6 bg-white blur-md z-30 opacity-50"></div>
    </div>
  );
};
