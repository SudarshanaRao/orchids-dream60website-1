
import { motion } from 'motion/react';
import { Clock, Shield, Zap, Users } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99] as any,
      }
    }
  };

  const features = [
    {
      icon: Clock,
      title: '60-Minute Auctions',
      description: 'Fast-paced hourly auctions with real prizes and real winners',
      color: 'from-purple-600 via-purple-700 to-purple-800'
    },
    {
      icon: Shield,
      title: 'Fair & Secure',
      description: 'Transparent bidding process with secure payment handling',
      color: 'from-purple-500 via-purple-600 to-purple-700'
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Winners announced immediately, prizes shipped within 24 hours',
      color: 'from-purple-600 via-purple-700 to-purple-800'
    },
    {
      icon: Users,
      title: 'Global Community',
      description: 'Join thousands of players competing for amazing prizes daily',
      color: 'from-purple-500 via-purple-600 to-purple-700'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Pay Entry Fee',
      description: 'Join any auction by paying the entry fee. This gives you access to all 6 boxes in that hour-long auction.'
    },
    {
      number: '2',
      title: 'Strategic Bidding',
      description: 'Boxes open every 15 minutes. You can bid once per round. Plan your strategy to outbid competitors.'
    },
    {
      number: '3',
      title: 'Win Amazing Prizes',
      description: 'Highest bidder in the final round wins the prize! From electronics to cars, we have incredible rewards.'
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-purple-50/50 to-white border-t border-purple-200/50 mt-8 sm:mt-12 md:mt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 relative z-10">
        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <div className="text-center space-y-2 sm:space-y-3 bg-white/70 backdrop-blur-sm rounded-xl p-3 sm:p-4 md:p-5 border border-purple-200/50 shadow-md shadow-purple-500/5 h-full transition-all hover:shadow-lg hover:shadow-purple-500/10">
                <motion.div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                </motion.div>
                <h3 className="text-xs sm:text-sm md:text-base text-purple-800 font-semibold px-1 sm:px-2">
                  {feature.title}
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm text-purple-600 px-1 sm:px-2 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* How it Works */}
        <motion.div 
          className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-purple-200/50 shadow-xl shadow-purple-500/10 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Card shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none"
            initial={{ x: '-100%', y: '-100%' }}
            animate={{ x: '100%', y: '100%' }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut"
            }}
          />

          <motion.h2 
            className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8 text-center"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            How Dream60 Works
          </motion.h2>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="space-y-2 sm:space-y-3 group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                whileHover={{ x: 4 }}
              >
                <motion.div 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg shadow-lg shadow-purple-500/30"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {step.number}
                </motion.div>
                <h3 className="text-sm sm:text-base md:text-lg text-purple-800 font-semibold">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-purple-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div 
          className="border-t border-purple-200/50 pt-6 sm:pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
            <motion.div 
              className="flex items-center space-x-2 sm:space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.9,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.05,
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.div>
              <div>
                <span className="text-purple-800 font-bold text-base sm:text-lg bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">Dream60</span>
                <p className="text-purple-600 text-xs sm:text-sm">The Ultimate Auction Game</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { label: 'Terms of Service', page: 'terms' },
                { label: 'Privacy Policy', page: 'privacy' },
                { label: 'Support', page: 'support' },
                { label: 'Contact', page: 'contact' }
              ].map((link, index) => (
                <motion.button
                  key={index}
                  onClick={() => onNavigate?.(link.page)}
                  className="text-purple-600 hover:text-purple-800 transition-all cursor-pointer px-2 py-1 rounded-xl hover:bg-purple-50/80 font-medium"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
          
          <motion.div 
            className="text-center text-purple-500/80 text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            © 2025 Dream60. All rights reserved. Play responsibly.
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
