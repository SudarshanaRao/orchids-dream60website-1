import { motion } from 'framer-motion';
import { Target, Users, Shield, Trophy, Rocket, Heart, Star, Clock } from 'lucide-react';

interface AboutUsProps {
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onNavigate }: AboutUsProps) {
  const stats = [
    { label: 'Active Players', value: '50K+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Wins', value: '100K+', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Auctions Daily', value: '24', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Success Rate', value: '99.9%', icon: Rocket, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  const values = [
    {
      title: 'Transparency',
      description: 'Our platform is built on trust. Every auction is live, and results are public for total accountability.',
      icon: Target,
    },
    {
      title: 'Security',
      description: 'Your safety is our priority. We use military-grade encryption to protect your data and transactions.',
      icon: Shield,
    },
    {
      title: 'Community',
      description: 'Dream60 is more than a game; it\'s a community of thrill-seekers and winners across India.',
      icon: Heart,
    },
    {
      title: 'Innovation',
      description: 'We constantly evolve our technology to provide the smoothest and fastest auction experience.',
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 -left-1/4 w-1/2 h-full bg-purple-500 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-indigo-500 rounded-full blur-[120px]"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-200">Our Story</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            >
              The Adrenaline of <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">India's Fastest</span> Auctions
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-purple-100/80 leading-relaxed mb-8"
            >
              Welcome to Dream60, where every 60 minutes brings a new opportunity to win premium prizes. 
              We've combined strategy, speed, and transparency to create India's most exciting skill-based platform.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-white p-6 rounded-3xl shadow-xl shadow-purple-500/5 border border-purple-100 flex flex-col items-center text-center"
              >
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-purple-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-medium text-purple-600/70 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-[40px] rotate-6 opacity-10" />
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                  alt="Our Mission"
                  className="rounded-[40px] shadow-2xl relative z-10 w-full h-[400px] object-cover"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl z-20 border border-purple-50 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-purple-900 uppercase">Trusted by thousands</p>
                      <p className="text-xs text-purple-500 font-medium">Safe & Secure platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-purple-900 leading-tight">
                Empowering Winners Through Skill and Strategy
              </h2>
              <p className="text-lg text-purple-600/80 leading-relaxed">
                Dream60 was founded with a single mission: to provide a fair, transparent, and exhilarating platform where skill meets opportunity. 
                We believe in the thrill of the auction and the joy of winning.
              </p>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  </div>
                  <p className="text-purple-700 font-medium">Innovative bidding mechanics designed for excitement.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  </div>
                  <p className="text-purple-700 font-medium">Real-time leaderboards for ultimate transparency.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  </div>
                  <p className="text-purple-700 font-medium">24/7 support dedicated to your success.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-purple-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-purple-900 mb-4">Our Core Values</h2>
            <p className="text-purple-600/70 font-medium">The principles that guide every decision we make at Dream60.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-[32px] shadow-lg shadow-purple-500/5 border border-purple-100 flex flex-col items-start"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                  <value.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-3">{value.title}</h3>
                <p className="text-sm text-purple-600/70 leading-relaxed font-medium">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900 to-indigo-900 rounded-[40px] p-12 relative overflow-hidden shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to Join the Action?</h2>
              <p className="text-purple-100/80 mb-10 max-w-2xl mx-auto font-medium">
                Experience the thrill of the auction today. Your next big win is just one bid away.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => onNavigate?.('game')}
                  className="px-10 py-4 bg-white text-purple-900 font-bold rounded-2xl shadow-xl hover:bg-purple-50 transition-all hover:scale-105"
                >
                  Get Started Now
                </button>
                <button
                  onClick={() => onNavigate?.('support')}
                  className="px-10 py-4 bg-purple-800/50 text-white font-bold rounded-2xl border border-white/20 hover:bg-purple-800 transition-all"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const Sparkles = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
