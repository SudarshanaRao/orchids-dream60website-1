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
      desc: 'Join any auction by paying the entry fee. This gives you access to all 6 boxes in that hour-long auction.',
    },
    {
      number: '2',
      title: 'Strategic Bidding',
      desc: 'Boxes open every 15 minutes. You can bid once per round. Plan your strategy to outbid competitors.',
    },
    {
      number: '3',
      title: 'Win Amazing Prizes',
      desc: 'Highest bidder in the final round wins the prize! From electronics to cars, we have incredible rewards.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 space-y-16 md:space-y-24">
      <div className="container mx-auto">
        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-purple-50 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-md border border-purple-100/50 p-6 sm:p-8 rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-purple-600/80 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-20 md:mt-32 bg-gradient-to-br from-white/60 via-purple-50/40 to-white/60 backdrop-blur-xl rounded-[3rem] border border-white/60 p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden"
        >
          {/* Animated Background Element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-200/20 rounded-full blur-3xl animate-pulse delay-700"></div>

          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-900 via-purple-700 to-violet-800 bg-clip-text text-transparent mb-4">
              How Dream60 Works
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="space-y-6 text-center group">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-violet-700 text-white flex items-center justify-center mx-auto text-2xl font-black shadow-xl shadow-purple-200 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 left-full w-full h-[2px] bg-gradient-to-r from-purple-200 to-transparent -translate-y-1/2 -ml-4 z-0"></div>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-purple-900 tracking-tight">{step.title}</h3>
                  <p className="text-purple-600/80 font-medium leading-relaxed max-w-xs mx-auto">
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
