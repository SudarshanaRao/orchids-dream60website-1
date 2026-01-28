import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, AlertTriangle, Info, Clock, X, IndianRupee, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';

interface PaymentFailureProps {
  amount: number;
  type?: 'entry' | 'bid' | 'claim';
  errorMessage?: string;
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
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

  export function PaymentFailure({ 
    amount: initialAmount, 
    type: initialType = 'entry',
    errorMessage: initialErrorMessage = 'Payment processing failed',
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
    onRetry,
    onBackToHome,
    onClose
  }: PaymentFailureProps) {
    const [countdown, setCountdown] = useState(2);
    const [txnData, setTxnSummary] = useState<any>(null);

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
          console.log('❌ Found Airpay transaction data in cookie (Failure):', parsed);
        } catch (e) {
          console.error('Error parsing transaction cookie:', e);
        }
      }
    }, []);

    // Use cookie data if available, otherwise fallback to props
    const amount = txnData?.amount || initialAmount;
    const type = initialType;
    const transactionId = txnData?.txnId || initialTransactionId || txnData?.orderId;
    const paymentMethod = txnData?.method || initialPaymentMethod;
    const errorMessage = txnData?.message || initialErrorMessage;
    const upiId = txnData?.upiId || initialUpiId;
    const bankName = txnData?.bankName || initialBankName;
    const cardName = txnData?.cardName || initialCardName;
    const cardNumber = txnData?.cardNumber || initialCardNumber;
    const timestamp = txnData?.timestamp ? new Date(txnData.timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
    const productName = initialProductName;
    const auctionNumber = initialAuctionNumber;
    const timeSlot = initialTimeSlot;
    const paidBy = initialPaidBy;

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
  
        <motion.div 
          className="relative z-10 w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="bg-gradient-to-br from-red-500 to-rose-700 p-8 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            
            <motion.div 
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
            >
              <X className="w-10 h-10 text-red-500" strokeWidth={4} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <h2 className="text-white text-2xl font-bold tracking-tight">Payment Failed</h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">
                {errorMessage || 'Your payment couldn\'t be processed'}
              </p>
              <p className="text-white/60 text-[10px] mt-4">Redirecting back...</p>
              <div className="mt-2 flex justify-center gap-1">
                {[1, 2].map((i) => (
                  <div 
                    key={i} 
                    className={`h-1 w-8 rounded-full transition-all duration-300 ${i <= (2 - countdown + 1) ? 'bg-white' : 'bg-white/20'}`} 
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
}

