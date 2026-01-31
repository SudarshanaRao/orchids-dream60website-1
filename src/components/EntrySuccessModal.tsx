import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trophy, Zap, X, ArrowRight, IndianRupee, Sparkles, Target, TrendingUp, XCircle, Landmark, Wallet, CreditCard, Download, Share2, ReceiptText, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

interface EntrySuccessModalProps {
  status: 'success' | 'failure';
  type: 'entry' | 'claim';
  amount: number;
  boxNumber?: number;
  onContinue: () => void;
  onClose: () => void;
  transactionDetails?: {
    id: string;
    vpa?: string;
    bank?: string;
    method?: string;
    timestamp?: string;
    cardName?: string;
    cardNumber?: string;
  };
  prizeDescription?: string;
}

export function EntrySuccessModal({ 
  status = 'success',
  type = 'entry',
  amount, 
  boxNumber, 
  onContinue, 
  onClose,
  transactionDetails,
  prizeDescription
}: EntrySuccessModalProps) {
  const [countdown, setCountdown] = useState(status === 'success' ? 5 : 0);
  const [showContinue, setShowContinue] = useState(status !== 'success');

  useEffect(() => {
    // Disable body scroll when modal opens
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    
    // Countdown timer for success
    let timer: any;
    if (status === 'success') {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowContinue(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Re-enable body scroll when modal closes
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleEscape);
      if (timer) clearInterval(timer);
    };
  }, [onClose, status]);

  const isSuccess = status === 'success';

  return (
    <motion.div 
      className="fixed inset-0 bg-[#05010D]/95 backdrop-blur-2xl z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div 
        className="w-full max-w-4xl h-full max-h-[70vh] relative group/modal flex flex-col sm:flex-row overflow-hidden rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ 
          duration: 0.5,
          ease: [0.6, -0.05, 0.01, 0.99]
        }}
      >
        {/* Left Visual Branding Panel */}
        <div className={`w-full sm:w-5/12 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden ${isSuccess ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800' : 'bg-gradient-to-br from-rose-600 via-red-700 to-red-900'}`}>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
          
          {/* Animated Background Orbs */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={`absolute top-0 left-0 w-64 h-64 blur-[80px] rounded-full ${isSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`}
          />

          <div className="relative z-10 space-y-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            >
              <div className="relative inline-block">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0"
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  >
                    {isSuccess ? <CheckCircle className="w-20 h-20 text-white/30" /> : <XCircle className="w-20 h-20 text-white/30" />}
                  </motion.div>
                ))}
                {isSuccess ? (
                  <CheckCircle className="w-24 h-24 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" strokeWidth={2.5} />
                ) : (
                  <XCircle className="w-24 h-24 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" strokeWidth={2.5} />
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
                {isSuccess ? 'Payment SUCCESS!' : 'Payment FAILED'}
              </h2>
              <div className="flex items-center justify-center gap-2 text-white/80 text-xs font-bold tracking-[0.2em] uppercase">
                <Sparkles className="w-3 h-3" />
                <span>{isSuccess ? (type === 'entry' ? 'Entry Confirmed' : 'Claim Initialized') : 'Transaction Aborted'}</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-inner"
            >
              <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] block mb-2">Total Amount</span>
              <div className="flex items-center justify-center gap-2 text-5xl font-black text-white tracking-tighter">
                <IndianRupee className="w-8 h-8" strokeWidth={3} />
                {amount.toLocaleString('en-IN')}
              </div>
              <p className="text-white/50 text-[10px] mt-4 font-bold uppercase tracking-widest">
                {isSuccess ? 'Transaction Verified' : 'No Amount Charged'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-full sm:w-7/12 bg-white flex flex-col h-full relative">
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-20 group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform" />
          </button>

          <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 scrollbar-hide">
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <ReceiptText className="w-5 h-5 text-slate-400" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transaction Summary</h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <DetailItem label="Transaction ID" value={transactionDetails?.id || '---'} icon={<Zap className="w-4 h-4 text-purple-600" />} />
                <DetailItem label="Payment Method" value={transactionDetails?.method || 'Secure Gateway'} icon={<Landmark className="w-4 h-4 text-purple-600" />} />
                {transactionDetails?.vpa && <DetailItem label="UPI / VPA ID" value={transactionDetails.vpa} icon={<Wallet className="w-4 h-4 text-purple-600" />} />}
                <DetailItem label="Purpose" value={type === 'entry' ? `Box #${boxNumber} Participation` : 'Prize Claim Request'} icon={<Target className="w-4 h-4 text-purple-600" />} />
                <DetailItem label="Date & Time" value={transactionDetails?.timestamp || new Date().toLocaleString()} icon={<Clock className="w-4 h-4 text-purple-600" />} />
              </div>
            </div>

            {isSuccess && prizeDescription && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-purple-50 rounded-3xl p-6 border border-purple-100 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Trophy className="w-12 h-12 text-purple-600" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-sm font-black text-purple-900 uppercase tracking-widest">Reward Details</h4>
                </div>
                <p className="text-purple-700/70 text-sm font-bold leading-relaxed">
                  {prizeDescription}
                </p>
              </motion.div>
            )}

            {!isSuccess && (
              <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 space-y-3">
                <div className="flex items-center gap-3 text-rose-700 font-black text-sm uppercase">
                  <ShieldCheck className="w-5 h-5" />
                  Reason for Failure
                </div>
                <p className="text-rose-600/70 text-sm font-bold">
                  The payment was declined by the bank or the transaction was cancelled. If amount was deducted, it will be refunded within 3-5 working days.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-8 sm:p-10 border-t border-slate-100 bg-slate-50/50">
            {isSuccess ? (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {showContinue ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Button 
                        onClick={onContinue}
                        className="w-full h-16 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-[100%_center] transition-all duration-500 text-white font-black rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-[0.98] group text-lg tracking-tighter"
                      >
                        <span className="flex items-center justify-center gap-3">
                          {type === 'entry' ? 'ENTER LIVE AUCTION' : 'VIEW MY REWARDS'}
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        </span>
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 text-purple-700 font-black text-sm uppercase tracking-widest">
                        <TrendingUp className="w-5 h-5 animate-bounce" />
                        Proceeding in {countdown}s...
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-purple-600"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 5, ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}
                </AnimatePresence>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-black text-slate-500 text-[10px] tracking-widest flex items-center gap-2 hover:bg-white hover:text-purple-600 transition-all uppercase">
                    <Download className="w-4 h-4" /> Download Receipt
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl border-slate-200 font-black text-slate-500 text-[10px] tracking-widest flex items-center gap-2 hover:bg-white hover:text-purple-600 transition-all uppercase">
                    <Share2 className="w-4 h-4" /> Share Success
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={onContinue}
                className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] text-lg uppercase tracking-tighter"
              >
                Retry Payment
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover/item:scale-110 group-hover/item:border-purple-100 transition-all">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-800 tracking-tight text-right break-all ml-4">
        {value}
      </span>
    </div>
  );
}
