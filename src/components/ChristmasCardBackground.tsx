import { motion } from 'motion/react';

interface ChristmasCardBackgroundProps {
  variant?: 'fast' | 'calm' | 'dropping' | 'wide';
  className?: string;
}

export function ChristmasCardBackground({ variant = 'calm', className = "" }: ChristmasCardBackgroundProps) {
  const getSantaPath = () => {
    switch (variant) {
      case 'fast':
        return "M -50,50 L 150,-20"; // Steep diagonal
      case 'dropping':
        return "M -20,20 Q 50,0 120,20"; // Slight curve
      case 'wide':
        return "M -100,80 L 200,20"; // Long horizontal-ish
      default: // calm
        return "M -30,40 L 130,10"; // Gentle diagonal
    }
  };

  const getSleighRotation = () => {
    switch (variant) {
      case 'fast': return -15;
      case 'dropping': return 5;
      case 'wide': return -5;
      default: return -10;
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none rounded-inherit ${className}`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-purple-900/10 to-transparent" />
      
      {/* Snow Particles */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        {[...Array(20)].map((_, i) => (
          <motion.circle
            key={i}
            r={Math.random() * 2 + 1}
            fill="white"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{
              y: ['0%', '100%'],
              x: [`${Math.random() * 100}%`, `${Math.random() * 100 + 5}%`],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * -20
            }}
          />
        ))}
      </svg>

      {/* Santa Illustration */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full opacity-10 filter blur-[1px]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <motion.g
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: variant === 'fast' ? 12 : 25,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            offsetPath: `path('${getSantaPath()}')`,
            offsetRotate: "auto"
          }}
        >
          {/* Sleigh & Santa Silhouette */}
          <g transform={`rotate(${getSleighRotation()}) scale(0.6)`}>
            {/* Sleigh Runners */}
            <path d="M-10,5 Q0,10 10,5" fill="none" stroke="white" strokeWidth="1" />
            {/* Sleigh Body */}
            <path d="M-12,-2 L8,-2 L10,5 L-10,5 Z" fill="white" />
            {/* Santa */}
            <circle cx="-2" cy="-6" r="3" fill="white" />
            <path d="M-5,-3 L1,-3 L3,0 L-7,0 Z" fill="white" />
            {/* Sack */}
            <path d="M-15,-5 Q-20,-10 -15,-15 Q-10,-20 -5,-15 Q0,-10 -5,-5 Z" fill="white" />
            
            {/* Gift Trails */}
            {['fast', 'wide'].includes(variant) && (
              <g opacity="0.6">
                <motion.path
                  d="M-18,-10 Q-30,-12 -45,-10"
                  fill="none"
                  stroke="gold"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  animate={{ strokeDashoffset: [0, -10] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                  d="M-18,-14 Q-35,-18 -55,-15"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  strokeDasharray="1 3"
                  animate={{ strokeDashoffset: [0, -10] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </g>
            )}

            {/* Dropping Gift */}
            {variant === 'dropping' && (
              <motion.rect
                width="3"
                height="3"
                fill="gold"
                initial={{ x: -10, y: -5, opacity: 0 }}
                animate={{ 
                  y: [ -5, 40], 
                  x: [-10, -20],
                  opacity: [0, 1, 0],
                  rotate: [0, 45, 90]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeIn",
                  times: [0, 0.2, 0.8, 1]
                }}
                filter="url(#glow)"
              />
            )}
            
            {/* Calm Glow */}
            {variant === 'calm' && (
              <circle cx="-15" cy="-12" r="4" fill="gold" opacity="0.3" filter="url(#glow)">
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        </motion.g>
      </svg>

      {/* Corner Glows */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
    </div>
  );
}
