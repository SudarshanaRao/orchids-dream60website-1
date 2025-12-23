import { motion } from 'motion/react';
import { ArrowLeft, Users, Target, Rocket, Shield, Globe, Award, TrendingUp, Briefcase, Heart, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import Snowfall from 'react-snowfall';

interface AboutUsProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function AboutUs({ onBack, onNavigate }: AboutUsProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const stats = [
    { label: 'Active Users', value: '500K+', icon: <Users className="w-5 h-5" /> },
    { label: 'Auctions Daily', value: '24+', icon: <Rocket className="w-5 h-5" /> },
    { label: 'Prizes Won', value: '₹10Cr+', icon: <Award className="w-5 h-5" /> },
    { label: 'Cities Covered', value: '100+', icon: <Globe className="w-5 h-5" /> },
  ];

  const values = [
    {
      title: 'Transparency',
      description: 'Every auction is live, fair, and verified. We believe in building trust through total openness.',
      icon: <Shield className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Innovation',
      description: 'Revolutionizing the way India shops and plays with our unique 15-minute bidding rounds.',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'User-First',
      description: 'Our platform is designed for everyone, from college students to professionals.',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-red-500 to-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] relative overflow-hidden pb-20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-200/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* Header - Matching Support Style */}
      <motion.header 
        className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-purple-100/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="rounded-xl hover:bg-purple-50 text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">About Us</h1>
              </div>
            </div>
            
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600 font-medium">Live Auction Play</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-16 sm:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Redefining Online Auctions
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-purple-900 mb-6 leading-tight">
                India's Most Exciting <br />
                <span className="bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">
                  Live Auction Platform
                </span>
              </h1>
              <p className="text-lg text-purple-600/80 max-w-2xl mx-auto leading-relaxed">
                Dream60 is not just an auction site; it's a revolutionary entertainment platform where skill meets opportunity, making luxury products accessible to everyone through transparent bidding.
              </p>
            </motion.div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-24">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-white/60 backdrop-blur-md border-purple-100 hover:border-purple-300 transition-all text-center shadow-xl shadow-purple-500/5 group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-purple-600 font-medium">{stat.label}</div>
                  </div>
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    {stat.icon}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Our Mission */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16 sm:mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-purple-900 mb-6">Our Vision & Mission</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2">The Vision</h3>
                    <p className="text-purple-600/80 leading-relaxed">
                      To become India's primary destination for interactive commerce, where the thrill of winning meets the joy of shopping. We envision a platform where every Indian has a fair chance at owning their dream products.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 mb-2">The Mission</h3>
                    <p className="text-purple-600/80 leading-relaxed">
                      Our mission is to democratize high-value products through a transparent, engaging, and skill-based auction system that is accessible, secure, and incredibly fun.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                  alt="Team Collaboration"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="font-bold">ISO Certified Platform</span>
                  </div>
                  <p className="text-sm text-white/90">Ensuring the highest standards of security and fairness for our users since 2024.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Core Values */}
          <section className="mb-16 sm:mb-24">
            <h2 className="text-3xl font-bold text-purple-900 mb-12 text-center">What Drives Us</h2>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-8 h-full bg-white border-purple-50 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold text-purple-800 mb-3">{value.title}</h3>
                    <p className="text-purple-600/80 leading-relaxed">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Careers CTA */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#53317B] to-[#8456BC]">
              <Snowfall 
                snowflakeCount={isMobile ? 20 : 50}
                radius={[0.5, 2.0]}
                speed={[0.1, 0.8]}
                style={{ opacity: 0.2 }}
              />
            </div>
            <div className="relative z-10 px-8 py-12 sm:py-20 text-center text-white">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Build the Future of Auctions</h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                We're always looking for passionate people to join our mission. If you're excited about technology, e-commerce, and gaming, we want to hear from you!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto px-10 py-7 rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-bold text-lg shadow-2xl shadow-black/20 group"
                  onClick={() => {
                    onNavigate?.('careers');
                    window.history.pushState({}, '', '/careers');
                  }}
                >
                  Join Our Team
                  <Rocket className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
                <div className="flex items-center gap-3 text-white/70">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-medium">15+ Open Positions</span>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
