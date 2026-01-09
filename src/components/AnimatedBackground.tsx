
import { motion } from 'motion/react';

export function AnimatedBackground() {
  // Elegant gradient orbs
  const orbs = [
    { size: 400, top: '-10%', left: '-10%', delay: 0, duration: 25, colors: ['#9F7ACB', '#8456BC'] },
    { size: 350, top: '-5%', right: '-5%', delay: 3, duration: 28, colors: ['#6B3FA0', '#53317B'] },
    { size: 300, bottom: '-10%', left: '10%', delay: 6, duration: 30, colors: ['#B99FD9', '#9F7ACB'] },
    { size: 320, bottom: '-5%', right: '5%', delay: 2, duration: 27, colors: ['#8456BC', '#6B3FA0'] },
  ];

  // Floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 15 + Math.random() * 10,
  }));

  // Geometric shapes
  const shapes = [
    { type: 'square', size: 60, top: '15%', left: '10%', rotation: 45, delay: 0, duration: 20 },
    { type: 'circle', size: 50, top: '25%', right: '15%', rotation: 0, delay: 2, duration: 22 },
    { type: 'square', size: 40, bottom: '30%', left: '8%', rotation: 30, delay: 4, duration: 24 },
    { type: 'circle', size: 45, bottom: '20%', right: '12%', rotation: 0, delay: 1, duration: 21 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-purple-100/50" />
      
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(159,122,203,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(132,86,188,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(185,159,217,0.1),transparent_50%)]" />
      </div>

      {/* Large gradient orbs */}
      {orbs.map((orb, index) => (
        <motion.div
          key={`orb-${index}`}
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            background: `radial-gradient(circle, ${orb.colors[0]}, ${orb.colors[1]})`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating geometric shapes */}
      {shapes.map((shape, index) => (
        <motion.div
          key={`shape-${index}`}
          className="absolute border-2 border-purple-400/20"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            right: shape.right,
            bottom: shape.bottom,
            borderRadius: shape.type === 'circle' ? '50%' : '8px',
            background: 'linear-gradient(135deg, rgba(159,122,203,0.05), rgba(132,86,188,0.1))',
            backdropFilter: 'blur(10px)',
            transform: `rotate(${shape.rotation}deg)`,
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [shape.rotation, shape.rotation + 180, shape.rotation + 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={`particle-${particle.id}`}
          className="absolute rounded-full bg-purple-400/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Animated lines */}
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={`line-${index}`}
          className="absolute bg-gradient-to-r from-transparent via-purple-300/10 to-transparent"
          style={{
            width: '100%',
            height: 1,
            top: `${10 + index * 12}%`,
            transformOrigin: 'center',
          }}
          animate={{
            scaleX: [0, 1, 0],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 8,
            delay: index * 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(132,86,188,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(132,86,188,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-white/20" />
    </div>
  );
}
