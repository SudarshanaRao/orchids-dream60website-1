import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock, Download, IndianRupee, Printer, Share2, ArrowRight } from 'lucide-react';
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
  const [countdown, setCountdown] = useState(5);
  const [txnData, setTxnSummary] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // Play success sound (optional, if available)
    // audioRef.current = new Audio('/success-sound.mp3');
    // audioRef.current.play().catch(() => {});

    // Transition to summary after 3 seconds
    const timer = setTimeout(() => {
      if (initialType === 'entry') {
        // For entry success, skip summary and go straight to the detail modal on the game page
        onBackToHome();
      } else {
        setStep('summary');
      }
    }, 1500);

    return () => clearTimeout(timer);
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

  const amount = txnData?.amount || initialAmount;
  const transactionId = txnData?.txnId || initialTransactionId || txnData?.orderId || 'N/A';
  const paymentMethod = txnData?.method || initialPaymentMethod;
  const timestamp = txnData?.timestamp ? new Date(txnData.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

  const downloadReceipt = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('DREAM60', 105, 25, { align: 'center' });
    
    // Title
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(18);
    doc.text('Payment Receipt', 105, 55, { align: 'center' });
    
    // Details
    doc.setFontSize(12);
    let y = 75;
    const details = [
      ['Transaction ID:', transactionId],
      ['Amount Paid:', `Rs. ${amount}`],
      ['Payment For:', initialProductName],
      ['Payment Method:', paymentMethod],
      ['Date & Time:', timestamp],
      ['Status:', 'SUCCESS']
    ];
    
    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 40, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 100, y);
      y += 10;
    });
    
    doc.setDrawColor(229, 231, 235);
    doc.line(40, y + 5, 170, y + 5);
    
    doc.setFontSize(10);
    doc.text('Thank you for participating in Dream60!', 105, y + 20, { align: 'center' });
    
    doc.save(`Dream60_Receipt_${transactionId}.pdf`);
    toast.success('Receipt downloaded successfully');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {step === 'animation' ? (
          <motion.div
            key="animation-step"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]"
              >
                <Check className="w-16 h-16 text-white" strokeWidth={3} />
              </motion.div>
              
              {/* Confetti-like particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0.5],
                    x: Math.cos(i * 30 * (Math.PI / 180)) * 100,
                    y: Math.sin(i * 30 * (Math.PI / 180)) * 100
                  }}
                  transition={{ duration: 1, delay: 0.3, repeat: Infinity, repeatDelay: 0.5 }}
                  className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-yellow-400"
                />
              ))}
            </div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-black text-white mt-8 mb-2 tracking-tight"
            >
              PAYMENT SUCCESSFUL!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-emerald-300 text-lg font-medium"
            >
              Your entry has been confirmed
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="summary-step"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-emerald-500 p-8 text-center text-white relative">
              <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm">
                SUCCESS
              </div>
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-lg">
                <IndianRupee className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black mb-1">₹{amount}</h3>
              <p className="text-emerald-100 opacity-80 text-sm font-medium">Transaction Complete</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Transaction ID</span>
                  <span className="text-gray-900 font-bold font-mono text-sm">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Purpose</span>
                  <span className="text-gray-900 font-bold text-sm">{initialProductName}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Method</span>
                  <span className="text-gray-900 font-bold text-sm">{paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Date & Time</span>
                  <span className="text-gray-900 font-bold text-sm">{timestamp}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={downloadReceipt}
                  variant="outline" 
                  className="w-full py-6 rounded-2xl border-2 border-emerald-100 text-emerald-600 font-bold hover:bg-emerald-50 hover:border-emerald-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Receipt
                </Button>
                <Button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Dream60 Payment Success',
                        text: `I just joined a Dream60 auction! Txn ID: ${transactionId}`,
                        url: window.location.origin
                      });
                    } else {
                      toast.info('Share feature not supported on this browser');
                    }
                  }}
                  variant="outline" 
                  className="w-full py-6 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              <Button 
                onClick={onBackToHome}
                className="w-full py-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg group shadow-xl"
              >
                CONTINUE TO AUCTION
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
                <Clock className="w-4 h-4" />
                <span>Redirecting in {countdown}s...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
