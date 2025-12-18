import React from 'react';
import { motion } from 'motion/react';

export function ChristmasCardBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
      {/* Base Night Sky Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] opacity-90" />
      
      {/* Subtle Snowflakes/Stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            y: [0, 10, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Stylized Santa Scene */}
      <div className="absolute -right-4 top-4 w-32 h-24 opacity-40 transform -rotate-12 pointer-events-none">
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Santa & Sleigh Silhouette (Minimalist) */}
          <path
            d="M160 80C160 80 140 85 120 82C100 79 80 70 60 75C40 80 20 100 20 100L40 105C40 105 60 90 80 85C100 80 120 88 140 90C160 92 180 85 180 85L160 80Z"
            fill="url(#santa-grad)"
          />
          
          {/* Large Sack */}
          <circle cx="150" cy="75" r="15" fill="url(#sack-grad)" />
          
          {/* Trail of Gifts Glow */}
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={140 - i * 20}
              cy={75 + i * 5}
              r={2 + Math.random() * 3}
              fill="#fbbf24"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.2, 1],
                x: [0, -5, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3
              }}
              className="blur-[2px]"
            />
          ))}

          <defs>
            <linearGradient id="santa-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="sack-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent" />
    </div>
  );
}
