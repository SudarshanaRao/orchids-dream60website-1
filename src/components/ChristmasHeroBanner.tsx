'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

const LOTTIE_SANTA_URL = "https://lottie.host/d6a4e4d9-4744-4d6e-b674-0c89a7e8c2d3/pQqL2Q8M8r.json";
const LOTTIE_TREE_URL = "https://lottie.host/4f8d4f8d-4f8d-4f8d-4f8d-4f8d4f8d4f8d/christmas-tree.json";
const LOTTIE_GIFT_URL = "https://lottie.host/embed/1c7f8d27-6c71-481b-b10d-1c4f5d5a5f1c/zGqzWjPuJB.json";
const LOTTIE_SNOWFALL_URL = "https://lottie.host/b5c5e5c5-b5c5-4b5c-b5c5-b5c5e5c5b5c5/snowfall.json";

export const ChristmasHeroBanner: React.FC = () => {
  const [santaData, setSantaData] = useState<any>(null);
  const [giftData, setGiftData] = useState<any>(null);

  useEffect(() => {
    const loadLotties = async () => {
      try {
        const fetchLottie = async (url: string) => {
          const res = await fetch(url);
          const contentType = res.headers.get("content-type");
          if (res.ok && contentType && contentType.includes("application/json")) {
            return await res.json();
          }
          return null;
        };

        const [s, g] = await Promise.all([
          fetchLottie(LOTTIE_SANTA_URL),
          fetchLottie(LOTTIE_GIFT_URL)
        ]);

        setSantaData(s);
        setGiftData(g);
      } catch (e) {
        console.warn("Lottie loading failed, using fallback visuals", e);
      }
    };
    loadLotties();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] shadow-2xl mb-4 sm:mb-6">
      {/* Main Red Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C41E3A] via-[#8B0000] to-[#5C0000]" />
      
      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Animated Snow Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            initial={{ top: -10, left: `${Math.random() * 100}%`, opacity: 0 }}
            animate={{
              top: '110%',
              opacity: [0, 0.8, 0.8, 0],
              x: [0, Math.sin(i) * 30, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 8,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
            className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"
            style={{ filter: 'blur(0.5px)' }}
          />
        ))}
      </div>

      {/* Hanging Lights at Top */}
      <div className="absolute top-0 left-0 w-full flex justify-around px-4 sm:px-8">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`light-${i}`}
            animate={{ 
              y: [0, 5, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity,
              delay: i * 0.3
            }}
            className="flex flex-col items-center"
          >
            <div className="w-[1px] h-6 sm:h-10 bg-gradient-to-b from-white/40 to-transparent" />
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                boxShadow: [
                  '0 0 8px rgba(255,215,0,0.6)',
                  '0 0 20px rgba(255,215,0,1)',
                  '0 0 8px rgba(255,215,0,0.6)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
              style={{ 
                backgroundColor: ['#FFD700', '#FF6B6B', '#4ADE80', '#60A5FA', '#F472B6'][i % 5],
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-12 sm:pt-16 pb-6 sm:pb-8">
        
        {/* Top Section - Santa and Title */}
        <div className="flex items-start justify-between mb-6 sm:mb-8">
          
          {/* Left Side - Santa Animation */}
          <div className="relative w-24 sm:w-36 md:w-48 lg:w-56 -mt-4 sm:-mt-8">
            {santaData ? (
              <Lottie 
                animationData={santaData} 
                loop={true} 
                className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]" 
              />
            ) : (
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="relative"
              >
                {/* Animated Santa SVG Fallback */}
                <svg viewBox="0 0 120 140" className="w-full drop-shadow-2xl">
                  {/* Hat */}
                  <motion.path
                    d="M30 50 L60 10 L90 50 Z"
                    fill="#C41E3A"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <circle cx="60" cy="10" r="8" fill="#FFFFFF" />
                  <rect x="25" y="45" width="70" height="12" rx="6" fill="#FFFFFF" />
                  
                  {/* Face */}
                  <ellipse cx="60" cy="75" rx="30" ry="25" fill="#FDBCB4" />
                  
                  {/* Eyes */}
                  <motion.g animate={{ scaleY: [1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity }}>
                    <circle cx="48" cy="70" r="4" fill="#1a1a1a" />
                    <circle cx="72" cy="70" r="4" fill="#1a1a1a" />
                  </motion.g>
                  
                  {/* Rosy Cheeks */}
                  <circle cx="40" cy="78" r="6" fill="#FF9999" opacity="0.6" />
                  <circle cx="80" cy="78" r="6" fill="#FF9999" opacity="0.6" />
                  
                  {/* Nose */}
                  <circle cx="60" cy="78" r="6" fill="#E8A090" />
                  
                  {/* Beard */}
                  <path d="M30 85 Q35 130 60 135 Q85 130 90 85" fill="#FFFFFF" />
                  <ellipse cx="60" cy="90" rx="25" ry="8" fill="#F5F5F5" />
                  
                  {/* Mustache */}
                  <path d="M45 85 Q52 78 60 85 Q68 78 75 85" fill="#FFFFFF" stroke="#F0F0F0" strokeWidth="1" />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Center - Title */}
          <div className="flex-1 text-center px-2 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-1 sm:space-y-2"
            >
              {/* Merry Text */}
              <motion.p
                animate={{ 
                  textShadow: [
                    '0 0 10px rgba(255,215,0,0.5)',
                    '0 0 20px rgba(255,215,0,0.8)',
                    '0 0 10px rgba(255,215,0,0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-script text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFD700] italic"
                style={{ fontFamily: "'Pacifico', 'Dancing Script', cursive" }}
              >
                Merry
              </motion.p>
              
              {/* Christmas Text */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}
              >
                Christmas
              </h1>
            </motion.div>

            {/* Shop Now Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-4 sm:mt-6 inline-flex items-center gap-2 sm:gap-3 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-bold px-6 sm:px-10 py-2.5 sm:py-4 rounded-full text-sm sm:text-lg shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300"
            >
              <span>SHOP NOW</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </motion.span>
            </motion.button>
          </div>

          {/* Right Side - Christmas Tree */}
          <div className="relative w-24 sm:w-36 md:w-48 lg:w-56 -mt-2 sm:-mt-4">
            <motion.div
              animate={{ rotate: [-1, 1, -1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {/* Animated Christmas Tree SVG */}
              <svg viewBox="0 0 100 140" className="w-full drop-shadow-2xl">
                {/* Star */}
                <motion.path
                  d="M50 5 L53 15 L63 15 L55 22 L58 32 L50 26 L42 32 L45 22 L37 15 L47 15 Z"
                  fill="#FFD700"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)']
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                
                {/* Tree Layers */}
                <path d="M50 25 L75 55 L65 55 L85 85 L15 85 L35 55 L25 55 Z" fill="#0D5C1E" />
                <path d="M50 45 L70 70 L62 70 L78 95 L22 95 L38 70 L30 70 Z" fill="#1B7A2E" />
                <path d="M50 65 L68 90 L60 90 L75 115 L25 115 L40 90 L32 90 Z" fill="#228B3D" />
                
                {/* Trunk */}
                <rect x="42" y="115" width="16" height="20" fill="#5D4037" rx="2" />
                
                {/* Ornaments */}
                {[[35, 75], [65, 78], [45, 95], [58, 92], [50, 108], [38, 105], [62, 105]].map(([cx, cy], i) => (
                  <motion.circle
                    key={`ornament-${i}`}
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill={['#FF0000', '#FFD700', '#FF0000', '#4FC3F7', '#FFD700', '#FF0000', '#4FC3F7'][i]}
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
                
                {/* Garland */}
                <path 
                  d="M30 80 Q50 75 70 80" 
                  stroke="#FFD700" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="4 2"
                />
                <path 
                  d="M28 100 Q50 95 72 100" 
                  stroke="#FFD700" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="4 2"
                />
              </svg>
            </motion.div>
          </div>
        </div>

        {/* Category Icons Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6"
        >
          {[
            { icon: '🎄', label: 'Trees & Decor', bg: 'from-emerald-600 to-emerald-800' },
            { icon: '🍪', label: 'Cakes & Cookies', bg: 'from-amber-600 to-amber-800' },
            { icon: '🎁', label: 'Gifting Store', bg: 'from-red-600 to-red-800' },
            { icon: '🧁', label: 'Baking', bg: 'from-pink-600 to-pink-800' },
            { icon: '👗', label: 'Fashion', bg: 'from-purple-600 to-purple-800', hideOnMobile: true },
            { icon: '🎉', label: 'Party', bg: 'from-blue-600 to-blue-800', hideOnMobile: true },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className={`flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-b ${item.bg} cursor-pointer shadow-lg hover:shadow-xl transition-all ${item.hideOnMobile ? 'hidden sm:flex' : ''}`}
            >
              <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2 drop-shadow-md">
                {item.icon}
              </div>
              <span className="text-[10px] sm:text-xs md:text-sm text-white/90 font-medium text-center leading-tight">
                {item.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Decorative Gift Boxes */}
        <div className="absolute bottom-0 left-4 sm:left-8 w-16 sm:w-24 md:w-32 opacity-80">
          {giftData ? (
            <Lottie animationData={giftData} loop={true} />
          ) : (
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg viewBox="0 0 60 60" className="w-full">
                <rect x="5" y="20" width="50" height="35" rx="4" fill="#E53935" />
                <rect x="25" y="20" width="10" height="35" fill="#FFEB3B" />
                <rect x="5" y="15" width="50" height="10" rx="2" fill="#C62828" />
                <rect x="25" y="15" width="10" height="10" fill="#FDD835" />
                <ellipse cx="30" cy="12" rx="12" ry="6" fill="#FFEB3B" />
                <ellipse cx="22" cy="8" rx="6" ry="4" fill="#FFEB3B" />
                <ellipse cx="38" cy="8" rx="6" ry="4" fill="#FFEB3B" />
              </svg>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-0 right-4 sm:right-8 w-12 sm:w-20 md:w-28 opacity-80">
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            <svg viewBox="0 0 50 50" className="w-full">
              <rect x="5" y="18" width="40" height="28" rx="3" fill="#4CAF50" />
              <rect x="20" y="18" width="10" height="28" fill="#FF5722" />
              <rect x="5" y="14" width="40" height="8" rx="2" fill="#388E3C" />
              <rect x="20" y="14" width="10" height="8" fill="#E64A19" />
              <ellipse cx="25" cy="11" rx="10" ry="5" fill="#FF5722" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Bottom Snow Ground */}
      <div className="absolute bottom-0 left-0 w-full h-4 sm:h-6 bg-gradient-to-t from-white/30 to-transparent" />

      {/* Add Google Font for script text */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@700;900&display=swap');
      `}</style>
    </div>
  );
};
