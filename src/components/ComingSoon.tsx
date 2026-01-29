import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Bell, Sparkles, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ComingSoonProps {
  onComplete: () => void;
}

export function ComingSoon({ onComplete }: ComingSoonProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<any>(null);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();

    const target = new Date();
    target.setHours(11, 0, 0, 0);

    // If midnight already passed, move to next day
    if (target.getTime() <= now.getTime() + 6) {
      target.setDate(target.getDate());
    }

    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  }, []);

  const triggerSuccess = useCallback(() => {
    if (isExpired) return;
    setIsExpired(true);

    // 🔊 Play sound
    audioRef.current?.play().catch(() => {});

    // 🎉 Confetti blast
    const duration = 5000;
    const end = Date.now() + duration;
    const defaults = {
      startVelocity: 45,
      spread: 360,
      ticks: 100,
      zIndex: 9999,
      scalar: 1.2,
    };

    const interval = setInterval(() => {
      const remaining = end - Date.now();
      if (remaining <= 0) return clearInterval(interval);

      const count = 80 * (remaining / duration);

      confetti({ ...defaults, particleCount: count, origin: { x: 0.2, y: 0.3 } });
      confetti({ ...defaults, particleCount: count, origin: { x: 0.8, y: 0.3 } });
      confetti({ ...defaults, particleCount: count / 2, origin: { x: 0.5, y: 0.5 } });
    }, 250);

    // 🚀 Redirect
    setTimeout(onComplete, 4000);
  }, [isExpired, onComplete]);

  // 🧠 Drift-free countdown (aligned to real seconds)
  useEffect(() => {
    const tick = () => {
      const remaining = calculateTimeLeft();

      if (remaining.expired) {
        triggerSuccess();
        return;
      }

      setTimeLeft(remaining);

      const now = Date.now();
      timeoutRef.current = setTimeout(tick, 1000 - (now % 1000));
    };

    tick();

    return () => clearTimeout(timeoutRef.current);
  }, [calculateTimeLeft, triggerSuccess]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center mx-2 sm:mx-4">
      <motion.div
        key={value}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center shadow-2xl"
      >
        <span className="text-2xl sm:text-4xl font-bold text-white">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-purple-200 text-xs sm:text-sm mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F071D] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"
        preload="auto"
      />

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-8">
          <Clock className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-white mb-6">
          DREAM<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">60</span>
        </h1>

        <p className="text-purple-200 mb-10">
          Launching at <span className="text-white font-bold">05-02-2026 at 11:00 AM </span>
        </p>

        <div className="flex justify-center mb-12">
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        <div className="text-purple-300/50 text-xs flex items-center justify-center gap-2">
          <Volume2 size={12} />
          Enable sound for the celebration!
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-[10%] text-purple-400/30"
      >
        <Sparkles size={48} />
      </motion.div>
    </div>
  );
}
