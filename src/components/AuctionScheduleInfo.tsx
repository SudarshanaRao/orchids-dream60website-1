import { Clock, Lock, Unlock, Zap, Star, IndianRupee } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

export function AuctionScheduleInfo() {
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await fetch('https://prod-api.dream60.com/utility/server-time');
        const result = await response.json();
        if (result.success && result.data) {
          setCurrentHour(result.data.hour);
        }
      } catch (error) {
        console.error('Error fetching server time:', error);
      }
    };

    fetchServerTime();
    // Refresh every minute to stay accurate
    const interval = setInterval(fetchServerTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatHour = (h: number) => h.toString().padStart(2, '0');
  const nextHour = (currentHour + 1) % 24;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border-2 border-purple-300/60 backdrop-blur-xl bg-gradient-to-br from-purple-50/90 via-violet-50/80 to-fuchsia-50/70 shadow-lg"
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm pointer-events-none rounded-2xl" />
      
      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-2xl flex items-center justify-center shadow-md">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-purple-900 text-base sm:text-lg">6 Box System (per auction)</h4>
        </div>
        
        <div className="grid gap-6">
            {/* Entry Fee Boxes */}
            <div className="relative">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Lock className="w-4 h-4 text-purple-700" />
                <span className="text-sm font-bold text-purple-800">Entry Fee Boxes (Open at auction start)</span>
              </div>
                <div className="bg-purple-100/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-300/60 mb-4 relative z-10">
                  <p className="text-sm text-purple-700 flex items-start gap-2">
                    <IndianRupee className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <span><span className="font-bold">One Payment:</span> Entry fee will company decided based on product worth. Pay single entry fee split across Box 1 & 2. Opens exactly at <span className="font-bold">{formatHour(currentHour)}:00</span> when the auction hour begins.</span>

                  </p>
                </div>
                
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    {[
                      { box: 'Box 1', time: `${formatHour(currentHour)}:00-${formatHour(currentHour)}:15`, desc: 'Half of entry fee' },
                      { box: 'Box 2', time: `${formatHour(currentHour)}:00-${formatHour(currentHour)}:15`, desc: 'Half of entry fee' }
                    ].map((round, idx) => (
                      <div
                        key={idx}
                        className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border-2 border-purple-300/60 shadow-md group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                            <Lock className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-bold text-purple-900 text-sm">{round.box}</div>
                        </div>
                        <div className="text-sm text-purple-700 font-bold mb-1">{round.time}</div>
                        <div className="text-xs text-purple-600">{round.desc}</div>
                      </div>
                    ))}
                  </div>
              </div>

              {/* Bidding Boxes */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-3 relative z-10">
                  <Unlock className="w-4 h-4 text-violet-700" />
                  <span className="text-sm font-bold text-violet-800">Bidding Boxes (After Entry Payment)</span>
                </div>
                
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    {[
                      { box: 'Box 3', time: `${formatHour(currentHour)}:00-${formatHour(currentHour)}:15`, unlock: `Opens at ${formatHour(currentHour)}:00` },
                      { box: 'Box 4', time: `${formatHour(currentHour)}:15-${formatHour(currentHour)}:30`, unlock: `Opens at ${formatHour(currentHour)}:15` },
                      { box: 'Box 5', time: `${formatHour(currentHour)}:30-${formatHour(currentHour)}:45`, unlock: `Opens at ${formatHour(currentHour)}:30` },
                      { box: 'Box 6', time: `${formatHour(currentHour)}:45-${formatHour(nextHour)}:00`, unlock: `Opens at ${formatHour(currentHour)}:45` }
                    ].map((round, idx) => (
                      <div
                        key={idx}
                        className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border-2 border-violet-300/60 shadow-md group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-xl flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-bold text-violet-900 text-sm">{round.box}</div>
                        </div>
                        <div className="text-sm text-violet-700 font-bold mb-1">{round.time}</div>
                        <div className="text-xs text-violet-600">{round.unlock}</div>
                      </div>
                    ))}
                  </div>
              </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-violet-100/50 backdrop-blur-sm rounded-2xl p-4 border border-violet-200/60">
              <Star className="w-5 h-5 text-violet-600 shrink-0" />
              <p className="text-sm text-violet-800">
                <span className="font-bold">How it works:</span> Pay ONE entry fee right at <span className="font-bold">{formatHour(currentHour)}:00</span> when the auction hour begins. This unlocks Box 1 & 2 (your entry is split between them). Then Box 3, 4, 5, 6 open every 15 minutes for bidding.
              </p>
            </div>
            <div className="flex items-start gap-3 bg-purple-100/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-200/60">
              <Clock className="w-5 h-5 text-purple-600 shrink-0" />
              <p className="text-sm text-purple-800 leading-relaxed">
                <span className="font-bold">Example Timeline:</span> If auction starts at {formatHour(currentHour)}:00 → Entry opens at {formatHour(currentHour)}:00 → Box 3 at {formatHour(currentHour)}:00 → Box 4 at {formatHour(currentHour)}:15 → Box 5 at {formatHour(currentHour)}:30 → Box 6 at {formatHour(currentHour)}:45 → Results at {formatHour(nextHour)}:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
