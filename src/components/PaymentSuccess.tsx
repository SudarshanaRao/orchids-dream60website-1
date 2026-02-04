import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, IndianRupee, Share2, ArrowRight, Sparkles, Trophy, Zap, Target, TrendingUp, X, Landmark, Wallet, Clock, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

  interface PaymentSuccessProps {
    amount: number;
    type: 'entry' | 'bid' | 'claim';
    boxNumber?: number;
    auctionId?: string;
    auctionNumber?: string | number;
    productName?: string;
    productWorth?: number;
    timeSlot?: string;
    paidBy?: string;
    paymentMethod?: string;
    transactionId?: string;
    transactionTime?: string;
    upiId?: string;
    bankName?: string;
    cardName?: string;
    cardNumber?: string;
    onBackToHome: () => void;
    onClose?: () => void;
  }

export function PaymentSuccess({ 
  amount: initialAmount, 
  type, 
  boxNumber, 
    productName: initialProductName,
    paymentMethod: initialPaymentMethod,
    transactionId: initialTransactionId,
    transactionTime: initialTransactionTime,
    upiId: initialUpiId,
    bankName: initialBankName,
    onBackToHome,
    onClose
}: PaymentSuccessProps) {
  const [countdown, setCountdown] = useState(5);
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

  const amount = txnData?.amount || initialAmount;
    const transactionId = txnData?.txnId || initialTransactionId || 'N/A';
    const paymentMethod = txnData?.method || initialPaymentMethod || 'UPI / Card';
    const upiId = txnData?.upiId || initialUpiId;
    const bankName = txnData?.bankName || initialBankName;
    const productName = initialProductName || txnData?.productName || (type === 'entry' ? 'Auction Entry' : 'Winner Claim');
    const displayTime = txnData?.airpayResponse?.transaction_time || txnData?.transactionTime || initialTransactionTime || 'N/A';

    const downloadReceipt = () => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('DREAM60 PAYMENT RECEIPT', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Transaction ID: ${transactionId}`, 20, 40);
      doc.text(`Amount: Rs. ${amount}`, 20, 50);
      doc.text(`Method: ${paymentMethod}`, 20, 60);
      doc.text(`Purpose: ${productName}`, 20, 70);
      doc.text(`Date: ${displayTime}`, 20, 80);
      doc.save(`Dream60_Receipt_${transactionId}.pdf`);
      toast.success('Receipt downloaded!');
    };


    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#05010D]/95 backdrop-blur-2xl overflow-y-auto font-sans">
        <motion.div 
          className="w-full max-w-4xl h-auto sm:h-[600px] max-h-[95vh] sm:max-h-[90vh] relative group/modal flex flex-col sm:flex-row overflow-hidden rounded-2xl sm:rounded-[3rem] border border-white/10 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Visual Status */}
          <div className="w-full sm:w-[350px] p-4 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-emerald-400 via-emerald-600 to-teal-900 shrink-0">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="relative z-10 mb-2 sm:mb-6"
            >
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-inner">
                <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white drop-shadow-2xl" strokeWidth={3} />
              </div>
            </motion.div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter mb-1 sm:mb-2 uppercase">Success!</h2>
              <p className="text-white/80 text-[10px] sm:text-sm font-medium px-4">Payment processed successfully</p>
            </div>
            <div className="mt-4 sm:mt-8 relative z-10 w-full px-2 max-w-[200px] sm:max-w-none">
              <div className="bg-black/20 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/10 shadow-lg">
                <span className="text-white/60 text-[8px] sm:text-[10px] font-black uppercase tracking-widest block mb-0.5 sm:mb-1 text-center">Amount Paid</span>
                <div className="flex items-center justify-center gap-1 text-xl sm:text-4xl font-black text-white">
                  <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6 opacity-70" strokeWidth={3} />
                  {amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
  
          {/* Details & Actions */}
          <div className="flex-1 bg-white p-4 sm:p-10 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-1 custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Transaction Receipt</h3>
                {onClose && <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" /></button>}
              </div>
  
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                <DetailRow label="Transaction ID" value={transactionId} icon={<Zap className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />} />
                <DetailRow label="Payment Method" value={paymentMethod} icon={<Landmark className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />} />
                {upiId && <DetailRow label="UPI Address" value={upiId} icon={<Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />} />}
                <DetailRow label="Description" value={productName} icon={<Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />} />
                <DetailRow label="Date & Time" value={displayTime} icon={<Clock className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />} />
              </div>
            </div>
  
            <div className="mt-4 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 space-y-3 sm:space-y-4">
              <Button 
                onClick={onBackToHome}
                className="w-full h-11 sm:h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl sm:rounded-2xl shadow-xl transition-all active:scale-[0.98] group"
              >
                <span className="flex items-center justify-center gap-2 tracking-tighter text-sm sm:text-lg uppercase">
                  {type === 'entry' ? 'START BIDDING NOW' : 'GO TO PROFILE'}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Button onClick={downloadReceipt} variant="outline" className="h-9 sm:h-12 rounded-lg sm:rounded-xl border-gray-100 font-bold text-gray-600 text-[10px] sm:text-xs flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Invoice
                </Button>
                <Button variant="outline" className="h-9 sm:h-12 rounded-lg sm:rounded-xl border-gray-100 font-bold text-gray-600 text-[10px] sm:text-xs flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Share
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest opacity-40">
                <TrendingUp className="w-3 h-3" />
                Redirecting in {countdown}s
              </div>
            </div>
          </div>
        </motion.div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="p-1 sm:p-1.5 bg-white rounded-lg shadow-sm">{icon}</div>
        <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] sm:text-xs font-black text-gray-800 tracking-tight text-right break-all ml-4">{value}</span>
    </div>
  );
}
