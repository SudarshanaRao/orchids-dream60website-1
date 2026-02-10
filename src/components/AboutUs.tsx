import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Shield, 
  Award, 
  Sparkles, 
  CheckCircle2,
  Zap,
  Trophy,
  IndianRupee,
  Gavel,
  TrendingUp,
  Clock,
  Eye,
  Smartphone,
  Globe,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_ENDPOINTS } from '../lib/api-config';

interface AboutUsProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface PlatformStats {
  totalUsers: number;
  totalAuctions: number;
  totalWinners: number;
  totalPrizePool: number;
  dailyAuctions: number;
}

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  const formatNumber = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString('en-IN');
  };

  return <span>{prefix}{formatNumber(count)}{suffix}</span>;
}

export function AboutUs({ onBack, onNavigate }: AboutUsProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.platformStats);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch platform stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const platformStats = [
    {
      label: 'Registered Users',
      value: stats?.totalUsers || 0,
      prefix: '',
      suffix: '+',
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Auctions Completed',
      value: stats?.totalAuctions || 0,
      prefix: '',
      suffix: '+',
      icon: <Gavel className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-600',
    },
    {
      label: 'Total Winners',
      value: stats?.totalWinners || 0,
      prefix: '',
      suffix: '+',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Prize Pool Distributed',
      value: stats?.totalPrizePool || 0,
      prefix: '₹',
      suffix: '+',
      icon: <IndianRupee className="w-6 h-6" />,
      color: 'from-emerald-500 to-green-600',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Browse Live Auctions',
      description: 'Explore hourly auctions featuring premium products. Each auction runs for 60 minutes with 4 bidding rounds.',
      icon: <Eye className="w-7 h-7" />,
    },
    {
      step: '02',
      title: 'Pay Entry Fee & Join',
      description: 'Pay a small entry fee to participate. Entry fees are fixed per auction and shown upfront.',
      icon: <IndianRupee className="w-7 h-7" />,
    },
    {
      step: '03',
      title: 'Place Strategic Bids',
      description: 'Bid smartly across 4 rounds (every 15 minutes). Each bid must be higher than your previous round\'s bid.',
      icon: <Target className="w-7 h-7" />,
    },
    {
      step: '04',
      title: 'Win & Claim Prizes',
      description: 'The highest bidder in the final round wins! Prizes are delivered as Amazon Vouchers within 24-48 hours.',
      icon: <Trophy className="w-7 h-7" />,
    },
  ];

  const values = [
    {
      title: '100% Transparent',
      description: 'Real-time bidding, live leaderboards, and verified winner announcements. Every auction is fully transparent.',
      icon: <Shield className="w-6 h-6" />,
      gradient: 'from-emerald-400 to-teal-600',
    },
    {
      title: 'Purely Auction-Based',
      description: 'Dream60 is a real-time auction platform. Place strategic bids across 4 rounds and the highest bidder wins. No luck involved.',
      icon: <Target className="w-6 h-6" />,
      gradient: 'from-amber-400 to-orange-600',
    },
    {
      title: 'Instant Rewards',
      description: 'Winners receive Amazon Vouchers credited within 24-48 hours. No hidden fees, no delays.',
      icon: <Zap className="w-6 h-6" />,
      gradient: 'from-blue-400 to-indigo-600',
    },
    {
      title: 'Secure Payments',
      description: 'All transactions processed through India\'s trusted payment gateways. UPI, Cards & Net Banking supported.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      gradient: 'from-purple-400 to-violet-600',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Platform</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#53317B] via-[#6B3FA0] to-[#8456BC] text-white">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-8">
              <Sparkles className="w-4 h-4" />
              India's First Live Auction Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1]">
              Win Premium Products<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300">
                At Unbelievable Prices
              </span>
            </h1>
              <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
                Dream60 is a real-time live auction platform where users bid strategically 
                to win premium products. Pay a small entry fee, place smart bids, and win big.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge className="bg-white/15 text-white border-white/20 px-4 py-2 text-sm">Live Auctions</Badge>
                <Badge className="bg-white/15 text-white border-white/20 px-4 py-2 text-sm">Auction-Based</Badge>
                <Badge className="bg-white/15 text-white border-white/20 px-4 py-2 text-sm">Verified Winners</Badge>
                <Badge className="bg-white/15 text-white border-white/20 px-4 py-2 text-sm">Instant Rewards</Badge>
              </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4">
        {/* Stats Section */}
        <section className="-mt-12 relative z-20 mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
            {platformStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4 sm:p-6 bg-white border-none shadow-xl shadow-slate-200/80 rounded-2xl sm:rounded-3xl text-center hover:-translate-y-1 transition-all">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white shadow-lg`}>
                    {stat.icon}
                  </div>
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-1" />
                  ) : (
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-1">
                      <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-tight">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>
          {stats && stats.dailyAuctions > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-4"
            >
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 text-sm font-bold">
                <Zap className="w-4 h-4 mr-1 inline" />
                {stats.dailyAuctions} Auctions Running Today
              </Badge>
            </motion.div>
          )}
        </section>

        {/* What is Dream60 */}
        <section className="mb-20 sm:mb-28">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900">What is Dream60?</h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full" />
              </div>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Dream60 is India's pioneering <strong className="text-slate-800">live auction platform</strong> that runs premium hourly auctions daily. 
                Dream60 is purely <strong className="text-slate-800">auction-based</strong> - bid smart, bid high, and win.
              </p>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Each auction features real products with real market value. Users pay a small entry fee, 
                compete in 4 bidding rounds over 60 minutes, and the smartest bidder wins the prize as 
                an <strong className="text-slate-800">Amazon Voucher</strong> worth the full product value.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 bg-purple-50 rounded-2xl border border-purple-100">
                  <Target className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">Our Vision</h3>
                  <p className="text-slate-600 text-xs sm:text-sm">To be India's #1 live auction and interactive commerce platform.</p>
                </div>
                <div className="p-4 sm:p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2">Our Mission</h3>
                  <p className="text-slate-600 text-xs sm:text-sm">Making premium products accessible through transparent, fair auctions.</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-purple-100 via-white to-blue-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-purple-100">
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Gavel className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">Hourly Live Auctions</div>
                      <div className="text-xs sm:text-sm text-slate-500">Multiple auctions running every day</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">4 Rounds x 15 Minutes</div>
                      <div className="text-xs sm:text-sm text-slate-500">Strategic bidding every quarter hour</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">Amazon Voucher Prizes</div>
                      <div className="text-xs sm:text-sm text-slate-500">Full product value delivered in 24-48h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base">100% Fair & Transparent</div>
                      <div className="text-xs sm:text-sm text-slate-500">Live leaderboards, verified results</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20 sm:mb-28">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-4">How Dream60 Works</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">Four simple steps to start winning premium products</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {howItWorks.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative"
              >
                <Card className="p-6 sm:p-8 h-full bg-white border-none shadow-lg shadow-slate-200/50 rounded-2xl sm:rounded-[2rem] hover:shadow-xl transition-all text-center group">
                  <div className="text-5xl sm:text-6xl font-black text-purple-100 absolute top-4 right-6 group-hover:text-purple-200 transition-colors">{item.step}</div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#53317B] to-[#8456BC] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-lg shadow-purple-300/40 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Why Choose Dream60 */}
        <section className="mb-20 sm:mb-28">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 sm:mb-4">Why India Chooses Dream60</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base">The values that power our platform every single day</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {values.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 sm:p-8 h-full bg-white border-none shadow-lg shadow-slate-200/50 rounded-2xl sm:rounded-[2rem] hover:shadow-xl transition-all group">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2">{feature.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-medium">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Company Info */}
        <section className="mb-20 sm:mb-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 md:p-16 border border-purple-100"
          >
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 sm:mb-6">About the Company</h2>
                <div className="space-y-3 sm:space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                  <p>
                    Dream60 is operated by <strong className="text-slate-800">Finpages Tech Private Limited</strong>, 
                    a technology company based in Hyderabad, India. We are committed to building India's most 
                    trusted and transparent live auction ecosystem.
                  </p>
                  <p>
                    Our platform is built with cutting-edge technology to ensure fair play, real-time bidding, 
                    and secure transactions. Every auction is monitored and verified to maintain the highest 
                    standards of integrity.
                  </p>
                </div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">Headquarters</span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm pl-8">
                    Finpages Tech Private Limited,<br />
                    #709, Gowra Fountainhead,<br />
                    Hitech City, Madhapur,<br />
                    Hyderabad - 500081, India
                  </p>
                </div>
                <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">Platform Type</span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm pl-8">
                      Live Auction Platform<br />
                      Licensed & Regulated in India
                    </p>
                </div>
                <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-sm sm:text-base">Contact</span>
                  </div>
                  <p className="text-slate-600 text-xs sm:text-sm pl-8">
                    Email: support@dream60.com<br />
                    Available 24/7 via Live Chat
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-2xl sm:rounded-[3rem] p-10 sm:p-16 md:p-20 overflow-hidden text-center mb-12"
        >
          <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-white/5 blur-[100px] rounded-full -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-purple-300/10 blur-[100px] rounded-full -ml-48 -mb-48" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Gavel className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 sm:mb-6">Ready to Start Winning?</h2>
            <p className="text-white/80 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 leading-relaxed">
              Join thousands of smart bidders on Dream60. Browse live auctions, place your bids, 
              and win premium products at unbelievable prices.
            </p>
            <Button 
              onClick={onBack}
              className="w-full sm:w-auto px-8 sm:px-10 py-5 sm:py-7 bg-white text-purple-800 hover:bg-slate-100 font-black text-base sm:text-lg rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-black/10"
            >
              Browse Live Auctions
              <Gavel className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
