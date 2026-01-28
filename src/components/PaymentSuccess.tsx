import { motion } from 'framer-motion';
import { Check, Trophy, Home, IndianRupee, Sparkles, CheckCircle2, Star, Clock, X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

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
      const [countdown, setCountdown] = useState(3);
      const [txnData, setTxnSummary] = useState<any>(null);
      const [showDetails, setShowDetails] = useState(false);
  
      useEffect(() => {
        // Try to read transaction data from cookie (set by backend airpayController)
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
            console.log('✅ Found Airpay transaction data in cookie:', parsed);
          } catch (e) {
            console.error('Error parsing transaction cookie:', e);
          }
        }

        // Read pending details from pre-payment cookie
        const pendingData = getCookie('pending_payment_details');
        if (pendingData) {
          try {
            const parsed = JSON.parse(decodeURIComponent(pendingData));
            console.log('✅ Found pending payment details:', parsed);
            // We can use this to supplement data if needed
          } catch (e) {
            console.error('Error parsing pending details cookie:', e);
          }
        }

        // Show details after animation
        const timer = setTimeout(() => {
          setShowDetails(true);
        }, 1500);

        return () => clearTimeout(timer);
      }, []);

    // Use cookie data if available, otherwise fallback to props
    const amount = txnData?.amount || initialAmount;
    const type = initialType;
    const transactionId = txnData?.txnId || initialTransactionId || txnData?.orderId;
    const paymentMethod = txnData?.method || initialPaymentMethod;
    const upiId = txnData?.upiId || initialUpiId;
    const bankName = txnData?.bankName || initialBankName;
    const cardName = txnData?.cardName || initialCardName;
    const cardNumber = txnData?.cardNumber || initialCardNumber;
    const timestamp = txnData?.timestamp ? new Date(txnData.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const productName = initialProductName;
    const productWorth = initialProductWorth;
    const timeSlot = initialTimeSlot;
    const paidBy = initialPaidBy;
    const auctionNumber = txnData?.auctionNumber || initialAuctionNumber;

    const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

    useEffect(() => {
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
    }, [onBackToHome]);

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      <motion.div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
  
      <AnimatePresence mode="wait">
          <motion.div
            key="animation"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl p-12 flex flex-col items-center justify-center text-center"
          >
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center shadow-lg mb-6`}>
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Check className="w-14 h-14 text-white" strokeWidth={4} />
              </motion.div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h2>
            <p className="text-gray-500">Redirecting to your auction...</p>
            
            <div className="mt-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-gray-400">
                {countdown}s
              </span>
            </div>
          </motion.div>
      </AnimatePresence>
    </div>
    );
}

