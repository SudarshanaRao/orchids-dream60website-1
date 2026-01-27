import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface SupportCenterHeaderProps {
  title: string;
  icon: ReactNode;
  onBack: () => void;
  backLabel?: string;
}

export function SupportCenterHeader({ title, icon, onBack, backLabel = 'Back' }: SupportCenterHeaderProps) {
  return (
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
              {backLabel}
            </Button>
            <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-purple-600">{icon}</span>
              <h1 className="text-xl sm:text-2xl font-bold text-purple-800">{title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
              <p className="text-[10px] text-purple-600">Live Auction Platform</p>
            </div>
          </div>
        </div>

        <div className="flex sm:hidden items-center space-x-2 mt-3">
          <span className="text-purple-600">{icon}</span>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-800 to-purple-600 bg-clip-text text-transparent">{title}</h1>
        </div>
      </div>
    </motion.header>
  );
}
