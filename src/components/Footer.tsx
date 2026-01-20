import { motion } from 'framer-motion';
import { Clock, Shield, Zap, Users } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const linkGroups = [
    {
      title: 'Platform',
      links: [
        { label: 'Live Auctions', action: 'game' },
        { label: 'Winners List', action: 'winners' },
          { label: 'Auction Rules', action: 'rules' },
          { label: 'Play Guide', action: 'participation' }
        ]
      },
      {
        title: 'Help & Support',
        links: [
          { label: 'Support Center', action: 'support' },
          { label: 'Contact Us', action: 'contact' },
          { label: 'How to Play', action: 'view-guide' },
          { label: 'Winning Tips', action: 'winning-tips' },
          { label: 'Tester Feedback', action: 'tester-feedback' }
        ]
      },
      {
        title: 'Company',
        links: [
          { label: 'About Us', action: 'about' },
          { label: 'Terms of Use', action: 'terms' },
          { label: 'Privacy Policy', action: 'privacy' },
          { label: 'Refund & Cancellation', action: 'refund' }
        ]
      }
  ];

  return (
    <footer className="bg-gradient-to-b from-purple-50 to-white border-t border-purple-100 relative overflow-hidden pb-safe pt-12 md:pt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand Section */}
          <div className="md:col-span-4 space-y-6 md:pr-8">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onNavigate?.('game')}>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-purple-900 leading-none tracking-tight">Dream60</span>
                <span className="text-[10px] font-bold text-purple-500 tracking-[0.3em] uppercase mt-1">India Official</span>
              </div>
            </div>
            
            <p className="text-purple-600/70 text-sm leading-relaxed">
              Experience the adrenaline of India's fastest live auction platform. 
              Transparent, secure, and rewarding with new winners every 60 minutes.
            </p>
          </div>

          {/* Links Sections */}
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-4">
            {linkGroups.map((group) => (
              <div key={group.title} className="space-y-5">
                <h4 className="text-purple-900 font-extrabold text-[11px] uppercase tracking-[0.2em]">{group.title}</h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => onNavigate?.(link.action)}
                        className="text-purple-600/70 hover:text-purple-900 text-[13px] transition-all duration-200 font-medium hover:translate-x-1 inline-block"
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
        <div className="mt-12 py-8 border-t border-purple-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-purple-500 text-[11px] font-semibold text-center md:text-left">
              © 2025 DREAM60 INDIA. ALL RIGHTS RESERVED.
            </p>
              <div className="flex items-center gap-4 text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                <span className="hover:text-purple-600 cursor-pointer transition-colors" onClick={() => onNavigate?.('terms')}>Terms</span>
                <span className="w-1 h-1 bg-purple-200 rounded-full" />
                <span className="hover:text-purple-600 cursor-pointer transition-colors" onClick={() => onNavigate?.('privacy')}>Privacy</span>
                <span className="w-1 h-1 bg-purple-200 rounded-full" />
                <span className="hover:text-purple-600 cursor-pointer transition-colors" onClick={() => onNavigate?.('refund')}>Refund</span>
                <span className="w-1 h-1 bg-purple-200 rounded-full" />
                <span className="hover:text-purple-600 cursor-pointer transition-colors" onClick={() => onNavigate?.('contact')}>Help</span>
              </div>
          </div>

            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-3">
                  <div className="h-6 px-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[10px] font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    VERIFIED PLATFORM
                  </div>
                <div className="h-6 px-2 bg-purple-50 text-purple-600 border border-purple-100 rounded text-[10px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  SECURE PLATFORM
                </div>
              </div>
          <p className="text-[9px] text-purple-400 font-medium text-center md:text-right max-w-[280px]">
                Please play responsibly. Skill-based auctions involve financial risk. 18+ only.
              </p>
            </div>
          </div>
        </div>
        
      </footer>
  );
}
