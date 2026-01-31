import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Download, IndianRupee, Printer, Share2, ArrowRight, Sparkles, Trophy, Zap, Target, TrendingUp, CheckCircle, X, ShieldCheck, Landmark, CreditCard, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState, useRef } from 'react';
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
  upiId?: string;
  bankName?: string;
  cardName?: string;
  cardNumber?: string;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentSuccess({ 
  amount: initialAmount, 
  type: initialType, 
  boxNumber, 
  auctionId: initialAuctionId,
  auctionNumber: initialAuctionNumber,
  productName: initialProductName = 'Auction Participation',
  productWorth: initialProductWorth,
  timeSlot: initialTimeSlot,
  paidBy: initialPaidBy,
  paymentMethod: initialPaymentMethod = 'UPI / Card',
  transactionId: initialTransactionId,
  upiId: initialUpiId,
  bankName: initialBankName,
  cardName: initialCardName,
  cardNumber: initialCardNumber,
  onBackToHome,
  onClose
}: PaymentSuccessProps) {
  const [step, setStep] = useState<'animation' | 'summary'>('animation');
  const [countdown, setCountdown] = useState(initialType === 'entry' ? 3 : 5);
  const [txnData, setTxnSummary] = useState<any>(null);
  
  // Computed values
  const amount = txnData?.amount || initialAmount;
  const transactionId = txnData?.txnId || initialTransactionId || txnData?.orderId || 'N/A';
  const paymentMethod = txnData?.method || initialPaymentMethod;
  const timestamp = txnData?.timestamp ? new Date(txnData.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const upiId = txnData?.upiId || initialUpiId;
  const bankName = txnData?.bankName || initialBankName;
  const productName = initialProductName || txnData?.productName || 'Auction Entry';

  useEffect(() => {
    // Try to read transaction data from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieData = getCookie('airpay_txn_data');
    if (cookieData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieData));
        setTxnSummary(parsed);
      } catch (e) {
        console.error('Error parsing transaction cookie:', e);
      }
    }

    // Transition after 2.5 seconds to feel deliberate and allow reading
    const timer = setTimeout(() => {
      setStep('summary');
    }, 2500);

    // Disable body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (step === 'summary') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onBackToHome();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, onBackToHome]);

  const downloadReceipt = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(83, 49, 123); // Primary Purple (#53317B)
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Online Auction Platform', 105, 30, { align: 'center' });
    
    // Title
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL PAYMENT RECEIPT', 105, 65, { align: 'center' });
    
    // Separator
    doc.setDrawColor(83, 49, 123);
    doc.setLineWidth(1);
    doc.line(40, 72, 170, 72);
    
    // Transaction Details Table-like Layout
    doc.setFontSize(12);
    let y = 85;
    const details = [
      ['Transaction Status:', 'SUCCESSFUL'],
      ['Transaction ID:', transactionId],
      ['Payment Type:', initialType === 'entry' ? 'Entry Fee' : initialType === 'claim' ? 'Prize Claim' : 'Auction Bid'],
      ['Amount Paid:', `Rs. ${amount.toLocaleString('en-IN')}`],
      ['Payment Method:', paymentMethod],
      ['UPI ID:', upiId || 'N/A'],
      ['Bank Name:', bankName || 'N/A'],
      ['Date & Time:', timestamp],
      ['Product/Auction:', productName],
    ];
    
    details.forEach(([label, value]) => {
      // Background for label
      doc.setFillColor(245, 243, 255);
      doc.rect(40, y - 6, 130, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(83, 49, 123);
      doc.text(label, 45, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(String(value), 110, y);
      y += 12;
    });
    
    // Footer Section
    y += 10;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(40, y, 170, y);
    
    y += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Success Green
    doc.text('Thank you for choosing Dream60!', 105, y, { align: 'center' });
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(107, 114, 128);
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, y, { align: 'center' });
    doc.text('Visit www.dream60.com for more information.', 105, y + 6, { align: 'center' });
    
    // Save PDF
    doc.save(`Dream60_Invoice_${transactionId}.pdf`);
    toast.success('Invoice downloaded successfully! 🎉');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-gradient-to-br from-[#1A0B2E]/95 via-[#2D1B4D]/90 to-[#1A0B2E]/95 backdrop-blur-xl overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'animation' ? (
          <motion.div
            key="animation-step"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center p-6"
          >
            <div className="relative mb-8">
              {/* Success Rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ 
                    scale: [1, 2, 3],
                    opacity: [0.6, 0.2, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut"
                  }}
                >
                  <div className="w-32 h-32 rounded-full border-4 border-emerald-400/30" />
                </motion.div>
              ))}
              
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.4)] relative z-10"
              >
                <Check className="w-16 h-16 text-white" strokeWidth={4} />
              </motion.div>

              {/* Sparkle effects */}
              <motion.div
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-4 -right-4"
              >
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
                PAYMENT SUCCESSFUL!
              </h2>
              <div className="flex items-center justify-center gap-3 py-2 px-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-50 text-lg font-bold">Transaction Secured & Verified</span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="summary-step"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/20 relative"
          >
            {/* Header with Amount */}
            <div className="bg-gradient-to-br from-[#53317B] via-[#6B3FA0] to-[#8456BC] p-10 text-center text-white relative">
              <div className="absolute top-6 right-8">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-white/15 backdrop-blur-2xl rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-2xl"
              >
                <IndianRupee className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-5xl font-black mb-2 tracking-tighter">₹{amount.toLocaleString('en-IN')}</h3>
                <p className="text-purple-100 opacity-90 text-base font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Successfully Received
                </p>
              </motion.div>
            </div>
  
            {/* Transaction Details */}
            <div className="p-8 sm:p-10 space-y-8 bg-white">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-900/40 tracking-[0.2em] uppercase mb-4">Transaction Details</h4>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Transaction ID */}
                  <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-500 text-sm font-bold">Transaction ID</span>
                    </div>
                    <span className="text-purple-900 font-black font-mono text-sm">{transactionId}</span>
                  </div>

                  {/* Payment Details (UPI / Bank) */}
                  <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        {upiId ? <Target className="w-4 h-4 text-purple-600" /> : <Landmark className="w-4 h-4 text-purple-600" />}
                      </div>
                      <span className="text-gray-500 text-sm font-bold">{upiId ? 'UPI ID' : 'Bank'}</span>
                    </div>
                    <span className="text-purple-900 font-black text-sm">{upiId || bankName || 'Verified Payment'}</span>
                  </div>

                  {/* Type / Purpose */}
                  <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-500 text-sm font-bold">Payment For</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-purple-900 font-black text-sm">{productName}</span>
                      {initialType === 'entry' && boxNumber && <span className="text-[10px] text-purple-500 font-bold uppercase">Box #{boxNumber}</span>}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-500 text-sm font-bold">Date & Time</span>
                    </div>
                    <span className="text-purple-900 font-black text-sm">{timestamp}</span>
                  </div>
                </div>
              </div>
  
              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={downloadReceipt}
                    className="w-full h-14 rounded-2xl bg-white border-2 border-purple-100 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-200 shadow-sm flex items-center justify-center gap-3 group"
                  >
                    <Download className="w-5 h-5 group-hover:bounce" />
                    Download Invoice
                  </Button>
                  <Button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Dream60 Payment Success',
                          text: `Successfully joined Dream60 auction! Transaction ID: ${transactionId}`,
                          url: window.location.origin
                        }).catch(() => {});
                      } else {
                        toast.info('Share feature not supported on this browser');
                      }
                    }}
                    className="w-full h-14 rounded-2xl bg-white border-2 border-purple-100 text-purple-700 font-bold hover:bg-purple-50 hover:border-purple-200 shadow-sm flex items-center justify-center gap-3 group"
                  >
                    <Share2 className="w-5 h-5" />
                    Share Status
                  </Button>
                </div>
  
                <Button 
                  onClick={onBackToHome}
                  className="w-full h-16 rounded-2xl bg-[#53317B] hover:bg-[#432763] text-white font-black text-xl group shadow-2xl shadow-purple-900/20 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {initialType === 'entry' ? 'START BIDDING NOW' : 'GO TO AUCTION HISTORY'}
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </Button>
  
                <div className="flex items-center justify-center gap-2 text-purple-900/40 text-xs font-black uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Redirecting in {countdown}s</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold">SECURE SSL</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale opacity-50">
                  <Landmark className="w-4 h-4" />
                  <span className="text-[10px] font-bold">RBI VERIFIED</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
