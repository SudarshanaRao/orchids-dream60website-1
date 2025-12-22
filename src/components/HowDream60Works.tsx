import { motion } from 'framer-motion';
import { Clock, Shield, Zap, Users } from 'lucide-react';

export function HowDream60Works() {
  const features = [
    {
      icon: Clock,
      title: '60 Minute Auction',
      desc: 'Experience fast-paced auctions every hour.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Shield,
      title: 'Fair and Secure',
      desc: 'Transparent bidding process for everyone.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      desc: 'Know the winners immediately after the auction.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Users,
      title: 'Global Community',
      desc: 'Join thousands of active bidders daily.',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent">
            How Dream60 Works
          </h2>
          <p className="text-purple-600/70 mt-2 font-medium">Simple. Transparent. Rewarding.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-100 to-purple-50 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-purple-100/50 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-purple-600/70 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
