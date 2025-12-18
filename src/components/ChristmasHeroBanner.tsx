import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Lottie from 'lottie-react';

// Premium Lottie Animations (Verified lottie.host URLs)
const LOTTIE_SANTA_URL = "https://lottie.host/80242270-4a87-438c-843e-7a7a28e9389e/Xh7X7A0X5Z.json"; 
const LOTTIE_TREE_URL = "https://lottie.host/5a2d67a9-e2b2-4d43-9828-57d423e1f0e4/nQ2W2q4X6Q.json";
const LOTTIE_GIFT_URL = "https://lottie.host/f42a59a7-802c-4780-9759-d8e235948083/mD1M4B7G8O.json";

export const ChristmasHeroBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [santaData, setSantaData] = useState<any>(null);
  const [treeData, setTreeData] = useState<any>(null);
  const [giftData, setGiftData] = useState<any>(null);
  
  // Parallax Setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

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

        const [s, t, g] = await Promise.all([
          fetchLottie(LOTTIE_SANTA_URL),
          fetchLottie(LOTTIE_TREE_URL),
          fetchLottie(LOTTIE_GIFT_URL)
        ]);
        
        setSantaData(s);
        setTreeData(t);
        setGiftData(g);
      } catch (e) {
        console.warn("Lottie loading failed, using premium fallback visuals", e);
      }
    };
    loadLotties();
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    }
  };

  const springConfig = { damping: 30, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Parallax layers (Higher values = more depth)
  const bgX = useTransform(smoothMouseX, [-0.5, 0.5], [-25, 25]);
  const bgY = useTransform(smoothMouseY, [-0.5, 0.5], [-15, 15]);
  
  const midX = useTransform(smoothMouseX, [-0.5, 0.5], [-50, 50]);
  const midY = useTransform(smoothMouseY, [-0.5, 0.5], [-30, 30]);

  const fgX = useTransform(smoothMouseX, [-0.5, 0.5], [-90, 90]);
  const fgY = useTransform(smoothMouseY, [-0.5, 0.5], [-45, 45]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      className="relative overflow-hidden bg-[#881337] rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] mb-16 group cursor-default h-[450px] sm:h-[600px] md:h-[700px] lg:h-[750px] transition-all duration-700"
    >
      {/* 1. LAYERED BACKGROUND (Atmospheric) */}
      <motion.div 
        style={{ x: bgX, y: bgY, scale: 1.15 }}
        className="absolute inset-0"
      >
        {/* Deep Ruby Gradient & Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_#e11d48_0%,_#9f1239_50%,_#4c0519_100%)]" />
        
        {/* Animated Aurora / Glows */}
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], x: [-20, 20, -20] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-full bg-rose-500/20 blur-[150px] rounded-full"
        />

        {/* Premium Hanging Lights / Stars */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-16">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`light-${i}`}
              animate={{ 
                y: [0, 20, 0],
                opacity: [0.3, 0.8, 0.3],
                rotate: [-2, 2, -2]
              }}
              transition={{ 
                duration: 3 + Math.random() * 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex flex-col items-center origin-top"
              style={{ height: `${10 + Math.random() * 50}%` }}
            >
              <div className="w-[1.5px] h-48 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1], 
                  filter: ["brightness(1) blur(1px)", "brightness(2.5) blur(4px)", "brightness(1) blur(1px)"] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-6 rounded-full bg-yellow-100 shadow-[0_0_40px_rgba(254,249,195,1)]" 
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 2. CINEMATIC SNOWFALL (3D Depth) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={`snow-${i}`}
            initial={{ top: -20, left: `${Math.random() * 100}%` }}
            animate={{ 
              top: '100%',
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
              rotate: 360
            }}
            transition={{ 
              duration: 4 + Math.random() * 12, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 20
            }}
            className="absolute rounded-full bg-white/90 blur-[0.3px]"
            style={{
              width: Math.random() * 7 + 2,
              height: Math.random() * 7 + 2,
              filter: i % 10 === 0 ? 'blur(4px)' : 'none', // Foreground blur
            }}
          />
        ))}
      </div>

      {/* 3. MIDDLE LAYER (Santa & Tree) */}
      <motion.div 
        style={{ x: midX, y: midY }}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        {/* Santa (Top Left - Professional Position) */}
        <div className="absolute top-[-60px] left-[8%] w-[250px] sm:w-[400px] md:w-[550px] lg:w-[650px]">
          {santaData ? (
            <Lottie animationData={santaData} loop={true} className="drop-shadow-[0_50px_80px_rgba(0,0,0,0.6)]" />
          ) : (
             <PremiumSantaFallback />
          )}
        </div>

        {/* Massive Tree (Right Side) */}
        <div className="absolute bottom-[-50px] right-[2%] w-[400px] sm:w-[600px] md:w-[800px] lg:w-[950px]">
          {treeData ? (
            <Lottie animationData={treeData} loop={true} className="drop-shadow-[0_30px_100px_rgba(0,0,0,0.5)]" />
          ) : (
            <PremiumTreeFallback />
          )}
        </div>
      </motion.div>

      {/* 4. FOREGROUND LAYER (Gifts & Interactive Depth) */}
      <motion.div 
        style={{ x: fgX, y: fgY }}
        className="absolute inset-0 z-30 pointer-events-none"
      >
        <div className="absolute bottom-[40px] left-[12%] flex items-end gap-12 scale-110 sm:scale-150 lg:scale-[1.75] origin-bottom-left">
          <div className="w-44 md:w-64">
            {giftData && <Lottie animationData={giftData} loop={true} className="drop-shadow-2xl" />}
          </div>
          <div className="w-32 md:w-48 mb-8 scale-x-[-1] opacity-95">
             {giftData && <Lottie animationData={giftData} loop={true} className="drop-shadow-2xl" />}
          </div>
        </div>
        
        {/* Bottom Snow Glow */}
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-white/15 via-white/5 to-transparent blur-[120px]" />
      </motion.div>

      {/* 5. CONTENT OVERLAY (Top Center) */}
      <div className="relative h-full flex flex-col items-center justify-start text-center px-8 pt-28 sm:pt-48 z-50 pointer-events-none">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12 max-w-6xl"
        >
          {/* Elite Badge */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="inline-block"
          >
            <span className="px-12 py-4 rounded-full bg-white/5 backdrop-blur-[40px] border border-white/20 text-white text-xl md:text-3xl font-black uppercase tracking-[0.6em] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
               Holiday Grandeur
            </span>
          </motion.div>

          {/* Epic Headline (The Swiggy Reference Look) */}
          <h2 className="relative text-8xl sm:text-[11rem] md:text-[14rem] lg:text-[16rem] font-black leading-[0.7] tracking-tighter text-white drop-shadow-[0_50px_50px_rgba(0,0,0,0.9)]">
            <span className="block italic font-serif text-5xl sm:text-7xl md:text-8xl opacity-90 mb-6 drop-shadow-2xl">A Very</span>
            <span className="block bg-gradient-to-b from-white via-white to-rose-200 bg-clip-text text-transparent">
              Merry
            </span>
            <span className="block mt-[-10px] relative">
               <span className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-100 to-yellow-600 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent opacity-100">
                 Christmas
               </span>
               <span className="text-white">
                 Christmas
               </span>
            </span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.2 }}
            className="text-white/95 text-4xl md:text-6xl font-black tracking-tight drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] italic font-serif"
          >
            "Celebrate the magic of the season"
          </motion.p>
          
          {/* The Ultimate Button */}
          <div className="pt-20 pointer-events-auto">
            <motion.button
              whileHover={{ 
                scale: 1.15, 
                boxShadow: "0 50px 100px -20px rgba(255, 255, 255, 0.7)",
                y: -12
              }}
              whileTap={{ scale: 0.9 }}
              className="relative group overflow-hidden bg-white text-[#9f1239] px-20 md:px-32 py-10 md:py-12 rounded-[4rem] font-black text-5xl md:text-7xl shadow-[0_50px_100px_rgba(0,0,0,0.6)] transition-all duration-700 flex items-center gap-10 mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-600/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              <span>SHOP NOW</span>
              <motion.div
                animate={{ x: [0, 20, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </motion.div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 5s infinite linear;
        }
      `}</style>
    </div>
  );
};

// --- HAND-CRAFTED ELITE SVGS ---

const PremiumSantaFallback = () => (
  <motion.div animate={{ y: [0, 15, 0], rotate: [-2, 2, -2] }} transition={{ duration: 4, repeat: Infinity }} className="w-full h-full p-20 opacity-90">
     <svg viewBox="0 0 200 200">
        <path d="M100 20L120 60H80L100 20Z" fill="#be123c" />
        <circle cx="100" cy="80" r="40" fill="#fecaca" />
        <path d="M60 80C60 110 140 110 140 80" stroke="white" strokeWidth="15" strokeLinecap="round" />
     </svg>
  </motion.div>
);

const PremiumTreeFallback = () => (
  <motion.div animate={{ rotate: [-0.5, 0.5, -0.5] }} transition={{ duration: 5, repeat: Infinity }} className="w-full h-full p-10">
     <svg viewBox="0 0 400 600">
        <path d="M200 50L350 250H50L200 50Z" fill="#1e3a8a" opacity="0.1" />
        <path d="M200 50L320 220H80L200 50Z" fill="#064e3b" />
        <path d="M200 150L360 400H40L200 150Z" fill="#064e3b" opacity="0.9" />
        <path d="M200 300L400 550H0L200 300Z" fill="#064e3b" opacity="0.8" />
        <motion.circle animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} cx="200" cy="50" r="15" fill="#fbbf24" filter="blur(5px)" />
     </svg>
  </motion.div>
);
