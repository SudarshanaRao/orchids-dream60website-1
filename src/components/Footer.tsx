import { motion } from 'framer-motion';
import { Clock, Shield, Zap, Users } from 'lucide-react';
import Snowfall from 'react-snowfall';

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
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const linkGroups = [
    {
      title: 'Product',
      links: [
        { label: 'Live Auctions', action: 'game' },
        { label: 'Auction Rules', action: 'rules' },
        { label: 'Play Guide', action: 'participation' },
        { label: 'Winners', action: 'winners' }
      ]
    },
    {
      title: 'Support',
      links: [
        { label: 'Support Center', action: 'support' },
        { label: 'Contact Us', action: 'contact' },
        { label: 'AI Assistant', action: 'support-chat' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', action: 'terms' },
        { label: 'Privacy Policy', action: 'privacy' }
      ]
    }
  ];

  return (
    <footer className="bg-white border-t border-purple-100 mt-20 relative overflow-hidden pb-safe">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-purple-900 leading-none">Dream60</span>
                <span className="text-xs font-bold text-purple-500 tracking-widest uppercase mt-0.5">India</span>
              </div>
            </div>
            <p className="text-purple-600/70 text-sm leading-relaxed max-w-sm">
              India's premier 60-minute live auction platform. Experience the thrill of strategic bidding and win amazing prizes every hour.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              <div className="p-2 bg-purple-50 rounded-full text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer">
                <Users className="w-5 h-5" />
              </div>
              <div className="p-2 bg-purple-50 rounded-full text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer">
                <Shield className="w-5 h-5" />
              </div>
              <div className="p-2 bg-purple-50 rounded-full text-purple-600 hover:bg-purple-100 transition-colors cursor-pointer">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {linkGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <h4 className="text-purple-900 font-bold text-xs uppercase tracking-widest">{group.title}</h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => onNavigate?.(link.action)}
                        className="text-purple-600/70 hover:text-purple-900 text-sm transition-colors duration-200 font-medium"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-purple-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-purple-400 text-xs font-medium text-center sm:text-left">
            © 2025 Dream60 India. All rights reserved. Play responsibly and within your limits.
          </p>
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3" />
              Secure Payment
            </span>
            <span className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Instant Prizes
            </span>
          </div>
        </div>
      </div>
      
      {/* Decorative snowfall with larger size */}
      <Snowfall 
        color="#F3E8FF" 
        snowflakeCount={15} 
        radius={[1.0, 3.0]} 
        speed={[0.5, 1.5]} 
      />
    </footer>
  );
}

