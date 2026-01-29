import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Bell, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ComingSoonProps {
  onComplete: () => void;
}

export function ComingSoon({ onComplete }: ComingSoonProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const target = new Date();
    target.setHours(11, 11, 0, 0);

    // If target time has already passed today, set it for tomorrow
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }

    const difference = target.getTime() - now.getTime();

    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining.expired) {
        clearInterval(timer);
        setIsExpired(true);
        triggerSuccess();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const triggerSuccess = () => {
    // Pop confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Redirect after a short delay to let confetti show
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const TimeUnit = ({ value, label }: { value: number, label: string }) => (
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
      <span className="text-purple-200 text-xs sm:text-sm mt-2 font-medium uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F071D] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10 max-w-2xl"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl shadow-lg shadow-purple-500/30 mb-8"
        >
          <Clock className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
          Registrations <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Opens Soon</span>
        </h1>
        
        <p className="text-purple-200 text-lg sm:text-xl mb-12 max-w-lg mx-auto leading-relaxed">
          Auctions will be notified when they are ready. Get ready for the next big win!
        </p>

        <div className="flex items-center justify-center mb-12">
          <TimeUnit value={timeLeft.hours} label="Hours" />
          <TimeUnit value={timeLeft.minutes} label="Minutes" />
          <TimeUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full text-purple-200"
        >
          <Bell className="w-5 h-5" />
          <span className="font-medium">Notification will be sent at launch</span>
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-20 right-[10%] text-purple-400/30"
      >
        <Sparkles size={48} />
      </motion.div>
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute bottom-20 left-[10%] text-indigo-400/20"
      >
        <Sparkles size={64} />
      </motion.div>
    </div>
  );
}
