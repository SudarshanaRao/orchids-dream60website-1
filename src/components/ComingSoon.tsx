import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Trophy, CheckCircle2, ArrowRight, Bell, Music } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ComingSoonProps {
  onComplete: () => void;
}

// Configurable target date
const TARGET_DATE = new Date('2026-01-31T22:27:00');

export function ComingSoon({ onComplete }: ComingSoonProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [isLaunching, setIsLaunching] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [experienceEnabled, setExperienceEnabled] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<any>(null);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const diff = TARGET_DATE.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      totalSeconds: Math.floor(diff / 1000),
      expired: false,
    };
  }, []);

  const requestPermissions = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Dream60', {
            body: 'Experience enabled! Get ready for the launch.',
            icon: '/logo.svg'
          });
        }
      }

      if (audioRef.current) {
        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.muted = false;
        audioRef.current.currentTime = 0;
      }
      
      setExperienceEnabled(true);
      setHasStarted(true);
    } catch (error) {
      console.error('Permission error:', error);
      setHasStarted(true);
    }
  };

  const triggerBlast = useCallback(() => {
    if (isLaunching) return;
    setIsLaunching(true);

    if (audioRef.current && experienceEnabled) {
      audioRef.current.volume = 0.8;
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 100 * (timeLeft / duration);
      
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF9933', '#007FFF', '#FFFFFF']
      });
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FF9933', '#007FFF', '#FFFFFF']
      });
    }, 200);

    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF9933', '#007FFF', '#FFFFFF']
    });
  }, [isLaunching, experienceEnabled]);

  useEffect(() => {
    const tick = () => {
      const remaining = calculateTimeLeft();
      if (remaining.expired) {
        triggerBlast();
        return;
      }
      setTimeLeft(remaining);
      const now = Date.now();
      timeoutRef.current = setTimeout(tick, 1000 - (now % 1000));
    };
    tick();
    return () => clearTimeout(timeoutRef.current);
  }, [calculateTimeLeft, triggerBlast]);

  const RollingDigit = ({ value, isLastTen }: { value: number; isLastTen?: boolean }) => {
    const displayValue = value.toString().padStart(2, '0');
    
    return (
      <div className="relative h-6 sm:h-10 md:h-14 w-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ 
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1] 
            }}
            className={`absolute font-black tabular-nums tracking-tighter ${
              isLastTen ? 'text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'text-white'
            } text-xl sm:text-2xl md:text-4xl`}
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  };

  const TimeUnit = ({ value, label, isLastTen }: { value: number; label: string; isLastTen?: boolean }) => (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <motion.div 
          animate={isLastTen ? { 
            opacity: [0.3, 0.9, 0.3], 
            scale: [1, 1.05, 1],
            boxShadow: ["0 0 0px rgba(255,215,0,0)", "0 0 40px rgba(255,215,0,0.3)", "0 0 0px rgba(255,215,0,0)"]
          } : {}}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -inset-0.5 bg-gradient-to-b from-[#FFD700]/40 to-transparent rounded-xl md:rounded-2xl blur-[1px] ${
            isLastTen ? 'opacity-100' : 'opacity-20 group-hover:opacity-100 transition duration-500'
          }`}
        />
        
        <div className={`relative bg-[#0A0F1C]/80 backdrop-blur-3xl border border-white/10 rounded-xl md:rounded-2xl w-12 h-14 sm:w-16 sm:h-20 md:w-24 md:h-32 flex items-center justify-center shadow-2xl overflow-hidden ${
          isLastTen ? 'border-[#FFD700]/50' : ''
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <RollingDigit value={value} isLastTen={isLastTen} />
          <div className="absolute w-full h-[1px] bg-white/5 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      <span className="text-[#FFD700]/50 text-[8px] sm:text-[10px] md:text-[11px] mt-2 sm:mt-3 md:mt-4 uppercase tracking-[0.2em] font-black">
        {label}
      </span>
    </div>
  );

  const isLastTen = timeLeft.totalSeconds > 0 && timeLeft.totalSeconds <= 10;

  return (
    <div className="h-[100dvh] w-full bg-[#020408] flex flex-col items-center justify-center px-4 relative overflow-hidden selection:bg-[#FFD700] selection:text-black overscroll-none">
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"
        preload="auto"
      />

      {/* Cinematic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0A0F1C_0%,#020408_100%)]" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-[#007FFF]/10 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity }}
          className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-[#FF9933]/10 blur-[150px] rounded-full" 
        />
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%",
                opacity: Math.random() * 0.4
              }}
              animate={{ 
                y: [null, -150],
                opacity: [null, 0]
              }}
              transition={{ 
                duration: 20 + Math.random() * 20, 
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
              className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
            />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="max-w-4xl w-full text-center z-10 space-y-6 sm:space-y-8 md:space-y-12 py-4 relative"
      >
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-center"
        >
          <img src="/logo.svg" alt="Dream60" className="h-8 sm:h-12 md:h-16 w-auto filter drop-shadow-[0_0_8px_rgba(255,215,0,0.2)]" />
        </motion.div>

        {/* Hero Section */}
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-[#FF9933] font-black uppercase tracking-[0.2em] text-[8px] sm:text-[9px] md:text-[10px]"
          >
            <Sparkles className="w-3 h-3 text-[#FFD700]" />
            <span>Premium Live Auctions</span>
            <Sparkles className="w-3 h-3 text-[#FFD700]" />
          </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-lg sm:text-2xl md:text-4xl font-black text-white tracking-tighter leading-tight"
            >
              Dream60 is <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] bg-[length:200%_auto] animate-shimmer italic">
                Launching Soon
              </span>
            </motion.h1>

            <motion.p 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xs sm:text-base md:text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-snug px-4"
            >
              India’s Most Exciting Live Auction Experience Begins In…
            </motion.p>
        </div>

        {/* Countdown Area */}
        <AnimatePresence mode="wait">
          {!isLaunching ? (
            <motion.div 
              key="countdown"
              className="space-y-6 sm:space-y-8 md:space-y-10"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-2">
                <TimeUnit value={timeLeft.days} label="Days" />
                <div className="text-white/10 text-lg sm:text-2xl md:text-4xl font-thin pb-4 sm:pb-6 md:pb-8">:</div>
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <div className="text-white/10 text-lg sm:text-2xl md:text-4xl font-thin pb-4 sm:pb-6 md:pb-8">:</div>
                <TimeUnit value={timeLeft.minutes} label="Minutes" />
                <div className="text-white/10 text-lg sm:text-2xl md:text-4xl font-thin pb-4 sm:pb-6 md:pb-8">:</div>
                <TimeUnit value={timeLeft.seconds} label="Seconds" isLastTen={isLastTen} />
              </div>

              {!hasStarted && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="max-w-xs mx-auto px-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={requestPermissions}
                    className="w-full relative group"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#FFD700] to-[#FF9933] rounded-xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
                    <div className="relative flex items-center gap-3 p-3 sm:p-4 bg-[#0A0F1C]/90 backdrop-blur-3xl border border-white/10 rounded-xl">
                      <div className="w-10 h-10 bg-[#FFD700]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-[#FFD700]" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-bold text-sm">Enable Experience</h3>
                        <p className="text-slate-500 text-[10px]">Allow launch sounds & alerts</p>
                      </div>
                      <ArrowRight className="ml-auto w-4 h-4 text-[#FFD700]" />
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 sm:space-y-10"
            >
              <div className="space-y-2">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block px-4 py-1 bg-[#FFD700] text-black font-black text-[10px] uppercase tracking-widest rounded-full"
                >
                  Live Now
                </motion.div>
                <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter">
                  Dream60 is <span className="text-[#FFD700] italic">LIVE!</span>
                </h2>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="px-8 py-4 bg-gradient-to-r from-[#FFD700] to-[#FFB800] text-black font-black text-lg sm:text-xl md:text-2xl rounded-xl shadow-xl flex items-center justify-center gap-2 mx-auto group"
              >
                <span>ENTER DREAM60</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trust Badges */}
        {!isLaunching && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-6 sm:gap-10 text-slate-500 font-bold text-[8px] sm:text-[9px] uppercase tracking-[0.2em]"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#007FFF]/50" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500/50" />
              <span>Transparent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-[#FFD700]/50" />
              <span>Trusted</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Dream60" className="w-6 h-6 opacity-30" />
          <span>Official Launch 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Music className="w-3 h-3" />
            <span className={experienceEnabled ? 'text-green-500/40' : 'text-slate-700'}>
              {experienceEnabled ? 'Audio Active' : 'Audio Muted'}
            </span>
          </div>
          <span>© Dream60 India</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 8s infinite linear;
        }
      `}</style>
    </div>
  );
}
