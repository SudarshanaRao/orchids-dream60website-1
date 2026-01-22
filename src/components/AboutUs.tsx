import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Rocket, 
  Shield, 
  Globe, 
  Award, 
  TrendingUp, 
  Briefcase, 
  Heart, 
  Sparkles, 
  CheckCircle2,
  Zap,
  Star,
  Smartphone,
  Trophy
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { SupportCenterHeader } from './SupportCenterHeader';

interface AboutUsProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onBack, onNavigate }: AboutUsProps) {
  const stats = [
    { label: 'Active Users', value: '500K+', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
    { label: 'Prizes Won', value: '₹10Cr+', icon: <Award className="w-5 h-5" />, color: 'bg-yellow-500' },
    { label: 'Cities Covered', value: '100+', icon: <Globe className="w-5 h-5" />, color: 'bg-green-500' },
    { label: 'Auctions Daily', value: '24+', icon: <Zap className="w-5 h-5" />, color: 'bg-purple-500' },
  ];

  const features = [
    {
      title: 'Real-Time Thrill',
      description: 'Experience the adrenaline of live 15-minute auction rounds with real-time updates and lightning-fast bidding.',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-amber-400 to-orange-600'
    },
    {
      title: 'Guaranteed Fairness',
      description: 'Our platform uses verified algorithms to ensure every participant has an equal opportunity to win.',
      icon: <Shield className="w-6 h-6" />,
      gradient: 'from-emerald-400 to-teal-600'
    },
    {
      title: 'Accessible Luxury',
      description: 'Bringing premium products within reach of everyone through a low-barrier, high-reward auction model.',
      icon: <Star className="w-6 h-6" />,
      gradient: 'from-blue-400 to-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
        <SupportCenterHeader 
          title="About Dream60" 
          icon={<Trophy className="w-6 h-6 text-yellow-500" />} 
          onBack={() => {
            onNavigate?.('game');
            window.history.pushState({}, '', '/');
          }} 
          backLabel="Back to Auction"
        />

      {/* Hero Section */}
      <div className="relative pt-12 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200/40 blur-3xl rounded-full" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-blue-200/40 blur-3xl rounded-full" />
        </div>

        <div className="container mx-auto max-w-6xl text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-purple-100 text-purple-600 text-xs font-bold uppercase tracking-wider mb-8">
                <Sparkles className="w-4 h-4" />
                Dream60 Live Auction Platform
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-[1.1]">
                India's Favorite <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600">
                  Live Auction Platform
                </span>
              </h1>
              <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
                Dream60 Live Auction Platform is India's leading live auction destination designed to make premium products accessible. Experience the thrill of real-time bidding with transparent, fair auctions every hour.
              </p>
            </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 -mt-10 mb-24">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white border-none shadow-xl shadow-slate-200/60 rounded-3xl text-center group hover:-translate-y-1 transition-all">
                <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-${stat.color.split('-')[1]}-200`}>
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-tight">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Our Journey</h2>
              <div className="w-20 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
            </div>
              <p className="text-slate-600 text-lg leading-relaxed">
                Founded with a vision to revolutionize online auctions in India, Dream60 introduced a unique live auction model that rewards timing and strategy. We've built a community of thousands who share the thrill of winning premium products.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <Target className="w-8 h-8 text-purple-600 mb-4" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Our Vision</h3>
                <p className="text-slate-600 text-sm">To be India's #1 live auction destination.</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <Smartphone className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Our Mission</h3>
                <p className="text-slate-600 text-sm">Making premium products accessible through transparent auctions.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800" 
                alt="Our Team"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-black uppercase tracking-widest text-xs">Verified & Secure</span>
                </div>
                <p className="text-sm font-medium opacity-90">Building trust through 100% transparent live auction technology.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Why India Chooses Dream60</h2>
            <p className="text-slate-500 font-medium">The values that power our platform every single day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-8 h-full bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] hover:shadow-2xl transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Join Team CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-slate-900 rounded-[3rem] p-12 md:p-20 overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 blur-[100px] rounded-full -ml-48 -mb-48" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Want to Build the Future?</h2>
              <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
                We're looking for dreamers, makers, and innovators to join our rapidly growing team. Come help us build the future of live auctions in India.
              </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => {
                  onNavigate?.('careers');
                  window.history.pushState({}, '', '/careers');
                  window.scrollTo(0, 0);
                }}
                className="w-full sm:w-auto px-10 py-7 bg-white text-slate-900 hover:bg-slate-100 font-black text-lg rounded-2xl transition-all shadow-xl shadow-white/5"
              >
                Explore Open Roles
                <Rocket className="w-5 h-5 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Hiring Now
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
