import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, IndianRupee, X, Landmark, Clock, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface PaymentFailureProps {
  amount: number;
  type?: 'entry' | 'bid' | 'claim';
  errorMessage?: string;
  transactionId?: string;
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

  export function PaymentFailure({ 
    amount, 
    type = 'entry',
    errorMessage = 'Payment processing failed',
    transactionId: initialTransactionId,
    onRetry,
    onBackToHome,
    onClose
  }: PaymentFailureProps) {
    const [countdown, setCountdown] = useState(10);
    const [txnData, setTxnSummary] = useState<any>(null);

    useEffect(() => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const cookieData = getCookie('airpay_txn_data');
      if (cookieData) {
        try {
          setTxnSummary(JSON.parse(decodeURIComponent(cookieData)));
        } catch (e) { console.error(e); }
      }

      const timer = setInterval(() => {

      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onBackToHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearInterval(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [onBackToHome]);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#05010D]/95 backdrop-blur-2xl overflow-y-auto font-sans">
        <motion.div 
          className="w-full max-w-4xl h-auto sm:h-[600px] max-h-[90vh] relative group/modal flex flex-col sm:flex-row overflow-hidden rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Visual Status */}
          <div className="w-full sm:w-[350px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-rose-400 via-red-600 to-orange-900">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="relative z-10 mb-6"
            >
              <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                <XCircle className="w-12 h-12 text-white drop-shadow-2xl" strokeWidth={3} />
              </div>
            </motion.div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase">Failed</h2>
              <p className="text-white/80 text-sm font-medium px-4">Your payment could not be processed at this time</p>
            </div>
            <div className="mt-8 relative z-10 w-full px-2">
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
                <span className="text-white/60 text-[10px] font-black uppercase tracking-widest block mb-1 text-center">Attempted Amount</span>
                <div className="flex items-center justify-center gap-1 text-4xl font-black text-white">
                  <IndianRupee className="w-6 h-6 opacity-70" strokeWidth={3} />
                  {amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
  
          {/* Details & Actions */}
          <div className="flex-1 bg-white p-6 sm:p-10 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Transaction Summary</h3>
                {onClose && <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>}
              </div>
  
              <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block mb-1">Error Message</span>
                  <p className="text-sm font-bold text-rose-800 leading-tight">{errorMessage}</p>
                </div>
              </div>
  
              <div className="grid grid-cols-1 gap-3">
                  <DetailRow label="Transaction ID" value={transactionId || 'N/A'} icon={<Zap className="w-4 h-4 text-rose-600" />} />
                  <DetailRow label="Purpose" value={type === 'entry' ? 'Auction Entry Fee' : 'Winner Prize Claim'} icon={<Target className="w-4 h-4 text-rose-600" />} />
                  <DetailRow label="Time" value={txnData?.airpayResponse?.transaction_time || txnData?.transactionTime || 'N/A'} icon={<Clock className="w-4 h-4 text-rose-600" />} />
                </div>
            </div>
  
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
            <Button 
              onClick={onRetry}
              className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="tracking-tighter text-lg uppercase">TRY AGAIN</span>
            </Button>
            
            <Button 
              onClick={onBackToHome}
              variant="outline" 
              className="w-full h-14 rounded-2xl border-gray-100 font-bold text-gray-600 text-base flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              BACK TO HOME
            </Button>
            
            <div className="text-center">
              <div className="text-purple-900/40 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                Redirecting in {countdown}s
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-rose-500"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 10, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">{icon}</div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xs font-black text-gray-800 tracking-tight text-right break-all ml-4">{value}</span>
    </div>
  );
}
