import { motion } from 'framer-motion';
import { Clock, Shield, Zap, Users } from 'lucide-react';

export function HowDream60Works() {
  const features = [
    {
      icon: Clock,
      title: '60-Min Auctions',
      desc: 'Fast hourly auctions with real prizes',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Fair & Secure',
      desc: 'Transparent bidding & secure payments',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      desc: 'Winners announced immediately',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'Top Community',
      desc: 'Join thousands of active players',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Pay Entry',
      desc: 'Pay fee to join the hourly auction.',
    },
    {
      number: '2',
      title: 'Bid Strategy',
      desc: 'Bid once per round every 15 mins.',
    },
    {
      number: '3',
      title: 'Win Prizes',
      desc: 'Highest bidder wins the reward!',
    },
  ];

  return (
    <section className="py-6 sm:py-8 px-4 space-y-8 sm:space-y-10">
      <div className="container mx-auto max-w-4xl">
        {/* 4 Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <div className="relative bg-white border border-purple-100 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-2 shadow-sm`}>
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-purple-900 mb-1">{feature.title}</h3>
                <p className="text-[10px] sm:text-xs text-purple-600/70 leading-tight">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8 sm:mt-12 bg-purple-50/50 rounded-2xl border border-purple-100 p-5 sm:p-8 shadow-sm relative overflow-hidden"
        >
          <div className="text-center mb-6 relative z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-900 mb-2">
              How Dream60 Works
            </h2>
            <div className="w-12 h-1 bg-purple-600 rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="space-y-3 text-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto text-base font-bold shadow-md">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-full w-full h-[1px] bg-purple-200 -ml-4 z-0"></div>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-purple-900">{step.title}</h3>
                  <p className="text-[11px] sm:text-xs text-purple-600/80 leading-snug max-w-[200px] mx-auto">
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
