import { motion } from 'framer-motion';
import { Clock, Shield, Zap, Users } from 'lucide-react';

export function HowDream60Works() {
  const features = [
    {
      icon: Clock,
      title: '60-Minute Auctions',
      desc: 'Fast-paced hourly auctions with real prizes and real winners',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Fair & Secure',
      desc: 'Transparent bidding process with secure payment handling',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      desc: 'Winners announced immediately, prizes shipped within 24 hours',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'Global Community',
      desc: 'Join thousands of players competing for amazing prizes daily',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Pay Entry Fee',
      desc: 'Join any auction by paying the entry fee. This gives you access to all 6 boxes.',
    },
    {
      number: '2',
      title: 'Strategic Bidding',
      desc: 'Boxes open every 15 minutes. Plan your strategy to outbid competitors.',
    },
    {
      number: '3',
      title: 'Win Amazing Prizes',
      desc: 'Highest bidder wins! From electronics to cars, we have incredible rewards.',
    },
  ];

  return (
    <section id="how-it-works" className="py-6 sm:py-10 px-4 space-y-8 sm:space-y-12">
      <div className="container max-w-5xl mx-auto">
        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-purple-50 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/90 backdrop-blur-sm border border-purple-100/50 p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-purple-900 mb-1.5 tracking-tight">{feature.title}</h3>
                <p className="text-[11px] sm:text-xs text-purple-600/80 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-10 sm:mt-12 bg-gradient-to-br from-white/80 via-purple-50/40 to-white/80 backdrop-blur-md rounded-[1.5rem] border border-white/60 p-5 sm:p-8 shadow-lg relative overflow-hidden"
        >
          {/* Animated Background Element */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="text-center mb-6 sm:mb-10 relative z-10">
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-900 via-purple-700 to-violet-800 bg-clip-text text-transparent mb-2">
              How Dream60 Works
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="space-y-3 text-center group">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 text-white flex items-center justify-center mx-auto text-lg font-black shadow-md group-hover:scale-110 transition-transform duration-300 relative z-10">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-[1px] bg-gradient-to-r from-purple-200 to-transparent -translate-y-1/2 -ml-3 z-0"></div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-purple-900 tracking-tight">{step.title}</h3>
                  <p className="text-xs text-purple-600/80 font-medium leading-relaxed max-w-[200px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
