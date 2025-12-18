import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';

export const ChristmasHeroBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Mouse parallax setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  const springConfig = { damping: 20, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Parallax transforms for different layers
  const layer1X = useTransform(smoothMouseX, [ -0.5, 0.5 ], [ -10, 10 ]);
  const layer1Y = useTransform(smoothMouseY, [ -0.5, 0.5 ], [ -5, 5 ]);
  
  const layer2X = useTransform(smoothMouseX, [ -0.5, 0.5 ], [ -30, 30 ]);
  const layer2Y = useTransform(smoothMouseY, [ -0.5, 0.5 ], [ -15, 15 ]);

  const layer3X = useTransform(smoothMouseX, [ -0.5, 0.5 ], [ -60, 60 ]);
  const layer3Y = useTransform(smoothMouseY, [ -0.5, 0.5 ], [ -30, 30 ]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="relative overflow-hidden bg-[#0a1e3b] rounded-[2.5rem] border border-blue-900/30 shadow-2xl mb-8 group cursor-default h-[350px] sm:h-[450px] md:h-[500px]"
    >
      {/* 1. ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0">
        {/* Deep Night Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] opacity-90" />
        
        {/* Radial Glow / Aurora Effect */}
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/2 left-0 w-full h-full bg-blue-400/20 blur-[120px] rounded-full" 
        />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* 2. PREMIUM SNOW PARTICLES (Multiple Depths) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Distant Snow (Slow, Small) */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`snow-far-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-30"
            initial={{ top: -10, left: `${Math.random() * 100}%` }}
            animate={{ 
              top: '100%',
              x: [0, Math.random() * 20 - 10, 0]
            }}
            transition={{ 
              duration: Math.random() * 15 + 15, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 20
            }}
          />
        ))}

        {/* Mid-range Snow (Faster, Blurry) */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`snow-mid-${i}`}
            className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-40 blur-[1px]"
            initial={{ top: -20, left: `${Math.random() * 100}%` }}
            animate={{ 
              top: '100%',
              x: [0, Math.random() * 40 - 20, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 8, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}

        {/* Large Foreground Snow (Fastest, Very Blurry) */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`snow-near-${i}`}
            className="absolute w-3 h-3 bg-white rounded-full opacity-20 blur-[4px]"
            initial={{ top: -30, left: `${Math.random() * 100}%` }}
            animate={{ 
              top: '100%',
              x: [0, Math.random() * 60 - 30, 0]
            }}
            transition={{ 
              duration: Math.random() * 6 + 4, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* 3. PARALLAX LAYERS (Back to Front) */}
      
      {/* Layer 1: Distant Mountains */}
      <motion.div 
        style={{ x: layer1X, y: layer1Y }}
        className="absolute bottom-0 left-0 w-[110%] h-48 -left-[5%] pointer-events-none"
      >
        <svg viewBox="0 0 1200 200" className="w-full h-full opacity-30 fill-blue-900/50">
          <path d="M0,200 L0,150 L150,80 L300,160 L500,60 L750,140 L950,40 L1200,120 L1200,200 Z" />
        </svg>
      </motion.div>

      {/* Layer 2: Midground Snowy Hills & Trees */}
      <motion.div 
        style={{ x: layer2X, y: layer2Y }}
        className="absolute bottom-0 left-0 w-[120%] h-64 -left-[10%] pointer-events-none"
      >
        <svg viewBox="0 0 1200 300" className="w-full h-full fill-blue-200/20">
          <path d="M0,300 C200,150 400,250 600,180 C800,110 1000,220 1200,150 L1200,300 L0,300 Z" />
        </svg>
        
        {/* Midground Trees */}
        <div className="absolute bottom-20 left-[15%] w-16 opacity-60">
          <Tree color="#1e3a8a" />
        </div>
        <div className="absolute bottom-16 right-[20%] w-20 opacity-60 scale-x-[-1]">
          <Tree color="#1e3a8a" />
        </div>
      </motion.div>

      {/* Layer 3: Foreground Main Snow, Snowman, and Large Trees */}
      <motion.div 
        style={{ x: layer3X, y: layer3Y }}
        className="absolute bottom-0 left-0 w-[140%] h-80 -left-[20%] pointer-events-none"
      >
        {/* Main Snow Base */}
        <svg viewBox="0 0 1400 350" className="w-full h-full fill-white">
          <path d="M0,350 C300,200 600,350 900,250 C1100,180 1300,300 1400,220 L1400,350 L0,350 Z" />
        </svg>

        {/* Foreground Tree Left */}
        <div className="absolute bottom-12 left-[18%] w-40 drop-shadow-2xl">
          <Tree color="#064e3b" withSnow withGlow />
        </div>

        {/* Premium Snowman */}
        <div className="absolute bottom-10 right-[22%] w-44 drop-shadow-2xl">
          <Snowman />
        </div>

        {/* Foreground Tree Right */}
        <div className="absolute bottom-4 right-[12%] w-32 drop-shadow-2xl scale-75 opacity-90">
          <Tree color="#065f46" withSnow />
        </div>
      </motion.div>

      {/* 4. CONTENT OVERLAY */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 z-50">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4 md:space-y-6 max-w-2xl"
        >
          {/* Tagline */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="inline-block"
          >
            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm md:text-base font-medium uppercase tracking-[0.2em]">
              Premium Holiday Offer
            </span>
          </motion.div>

          {/* Main Title with Premium Typography & Shimmer */}
          <h2 className="text-5xl sm:text-7xl md:text-8xl font-black leading-none tracking-tighter">
            <span className="block text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
              Merrylicious
            </span>
            <span className="block mt-1 relative">
               <span className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-200 to-red-500 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
                 Christmas
               </span>
               <span className="text-red-600 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]">
                 Christmas
               </span>
            </span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-blue-50/80 text-lg md:text-xl font-medium italic font-serif"
          >
            Celebrating the season of giving with exclusive rewards
          </motion.p>
          
          {/* Premium Call to Action */}
          <div className="pt-6">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(220, 38, 38, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              className="relative group overflow-hidden bg-red-600 text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl font-bold text-xl md:text-2xl shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span>Get min ₹125 OFF</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Lights / Glows */}
      <div className="absolute top-10 left-1/4 w-32 h-32 bg-yellow-400/10 blur-[60px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-red-400/10 blur-[80px] animate-pulse" />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 4s infinite linear;
        }
      `}</style>
    </div>
  );
};

// --- SUBCOMPONENTS FOR CLEANER CODE ---

const Tree: React.FC<{ color: string; withSnow?: boolean; withGlow?: boolean }> = ({ color, withSnow, withGlow }) => (
  <motion.div 
    animate={{ rotate: [-0.5, 0.5, -0.5] }}
    transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
    className="relative"
  >
    {withGlow && (
      <div className="absolute inset-0 bg-green-400/20 blur-2xl rounded-full scale-150 animate-pulse" />
    )}
    <svg viewBox="0 0 100 150" className="w-full h-full filter drop-shadow-2xl">
      <path d="M50 0L85 60H15L50 0Z" fill={color} />
      <path d="M50 30L90 100H10L50 30Z" fill={color} opacity="0.9" />
      <path d="M50 60L100 140H0L50 60Z" fill={color} opacity="0.8" />
      
      {withSnow && (
        <>
          <path d="M50 0L65 25C58 20 42 20 35 25L50 0Z" fill="white" opacity="0.6" />
          <path d="M40 35L20 60H35C45 50 55 50 65 60H80L60 35H40Z" fill="white" opacity="0.4" />
          <path d="M30 75L0 140H25C35 125 65 125 75 140H100L70 75H30Z" fill="white" opacity="0.3" />
        </>
      )}

      {/* Ornaments with Glow */}
      <circle cx="35" cy="55" r="3" fill="#3B82F6" className="animate-pulse" />
      <circle cx="65" cy="85" r="3" fill="#EF4444" style={{ animationDelay: '1s' }} className="animate-pulse" />
      <circle cx="25" cy="115" r="3" fill="#EAB308" style={{ animationDelay: '0.5s' }} className="animate-pulse" />
      <circle cx="75" cy="115" r="3" fill="#3B82F6" style={{ animationDelay: '1.5s' }} className="animate-pulse" />
    </svg>
  </motion.div>
);

const Snowman: React.FC = () => (
  <motion.div
    animate={{ 
      y: [0, -5, 0],
      rotate: [-1, 1, -1]
    }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
  >
    <svg viewBox="0 0 100 130" className="w-full h-full filter drop-shadow-2xl">
      {/* Body Parts with Subtle Shading */}
      <defs>
        <radialGradient id="snowGrad" cx="40%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </radialGradient>
      </defs>
      
      <circle cx="50" cy="100" r="30" fill="url(#snowGrad)" />
      <circle cx="50" cy="65" r="22" fill="url(#snowGrad)" />
      <circle cx="50" cy="38" r="16" fill="url(#snowGrad)" />
      
      {/* Eyes */}
      <circle cx="45" cy="35" r="2" fill="#1e293b" />
      <circle cx="55" cy="35" r="2" fill="#1e293b" />
      
      {/* Carrot Nose */}
      <path d="M50 38L65 42L50 44Z" fill="#f97316" />
      
      {/* Buttons */}
      <circle cx="50" cy="60" r="2" fill="#1e293b" />
      <circle cx="50" cy="70" r="2" fill="#1e293b" />
      <circle cx="50" cy="80" r="2" fill="#1e293b" />
      
      {/* Scarf with Premium Look */}
      <path d="M36 48C40 45 60 45 64 48L68 55C60 52 40 52 32 55L36 48Z" fill="#dc2626" />
      <path d="M58 48L64 75L54 75L54 48" fill="#dc2626" />
      
      {/* Stick Arms */}
      <path d="M28 65L5 55" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 65L95 55" stroke="#451a03" strokeWidth="2" strokeLinecap="round" />
      
      {/* Top Hat */}
      <rect x="30" y="22" width="40" height="4" rx="2" fill="#0f172a" />
      <rect x="35" y="5" width="30" height="18" rx="2" fill="#0f172a" />
      <rect x="35" y="15" width="30" height="3" fill="#dc2626" />
    </svg>
  </motion.div>
);
