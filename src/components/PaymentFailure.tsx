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
  transactionId?: string; // ✅ NEW: Added transactionId
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentFailure({ 
  amount, 
  type = 'entry',
  errorMessage = 'Payment processing failed',
  auctionId,
  auctionNumber,
  productName = 'Auction Participation',
  productWorth,
  timeSlot,
  paidBy,
  paymentMethod = 'UPI / Card',
  transactionId, // ✅ NEW: Destructured transactionId
  onRetry,
  onBackToHome,
  onClose
}: PaymentFailureProps) {
  const [countdown, setCountdown] = useState(3);
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

  const downloadReceipt = () => {
    const doc = jsPDF ? new jsPDF() : null;
    if (!doc) return;

    const rose = [225, 29, 72]; 
    const darkSlate = [30, 41, 59];
    const gray = [107, 114, 128];
    
    // Header section with brand color
    doc.setFillColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60 INDIA', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM AUCTION PLATFORM', 20, 38);

    doc.setFontSize(18);
    doc.text('FAILURE REPORT', 140, 30);
    
    // Info line
    doc.setFillColor(254, 242, 242);
    doc.rect(0, 45, 210, 15, 'F');
    doc.setTextColor(rose[0], rose[1], rose[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const scenarios = {
      entry: 'ENTRY FAILURE',
      bid: 'BID FAILURE',
      claim: 'PRIZE CLAIM FAILURE'
    };
    
    doc.text(`Scenario: ${scenarios[type as keyof typeof scenarios] || 'PAYMENT FAILURE'}`, 20, 55);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFont('helvetica', 'normal');
    const displayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Date: ${displayDate}`, 90, 55);
    doc.text(`ID: ${auctionId || 'TXN-' + Math.floor(Date.now() / 1000)}`, 150, 55);

    // Main content
    let curY = 80;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Attempt Details', 20, 72);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 75, 190, 75);

    const drawDetailRow = (label: string, value: string, isError = false) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(label, 25, curY);
      
      doc.setTextColor(31, 41, 55);
      if (isError) doc.setTextColor(rose[0], rose[1], rose[2]);
      doc.text(value || 'N/A', 100, curY);
      
      doc.setDrawColor(243, 244, 246);
      doc.line(20, curY + 4, 190, curY + 4);
      curY += 12;
    };

    const auctionType = type === 'entry' ? 'Auction Entry Fee' : type === 'claim' ? 'Prize Claim Payment' : 'Auction Bid';

    drawDetailRow('Service Type', auctionType);
    drawDetailRow('Customer Name', paidBy || 'Valued Player');
    drawDetailRow('Product Name', productName);
    drawDetailRow('Auction ID', auctionId || 'N/A');
    if (type !== 'claim') drawDetailRow('Auction Time Slot', timeSlot || 'Active');
    drawDetailRow('Amount Attempted', `INR ${amount.toLocaleString('en-IN')}`);
    drawDetailRow('Payment Method', paymentMethod);
    curY += 5;
    drawDetailRow('ERROR MESSAGE', errorMessage.substring(0, 60), true);

    // Warning Stamp
    curY += 30;
    doc.setDrawColor(rose[0], rose[1], rose[2]);
    doc.setLineWidth(0.5);
    doc.rect(140, curY - 15, 45, 20);
    doc.setTextColor(rose[0], rose[1], rose[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FAILED', 155, curY - 5);
    doc.setFontSize(7);
    doc.text('UNSUCCESSFUL ATTEMPT', 142, curY);

    // Action Steps
    curY += 10;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps:', 20, curY);
    curY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    const notes = [
      '• Check your internet connection and try again.',
      '• Ensure you have sufficient balance in your account.',
      '• If money was deducted, it will be refunded within 5-7 business days.',
      '• Contact support@dream60.com with above attempt details for help.'
    ];
    notes.forEach(note => {
      doc.text(note, 20, curY);
      curY += 5;
    });

    // Footer
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.setFontSize(8);
    doc.text('DREAM60 INDIA OFFICIAL | support@dream60.com | www.dream60.com', 105, 285, { align: 'center' });
    
    doc.save(`Dream60_FailureReport_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose || onBackToHome}
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
            <motion.div
              animate={{ 
                x: [0, -5, 5, -5, 5, 0],
              }}
              transition={{ 
                delay: 1,
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <X className="w-10 h-10 text-red-500" strokeWidth={4} />
            </motion.div>
          </motion.div>
          
          {/* Failure Warning Particles */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/30"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0.5, 1.2, 0.5],
                y: [0, -100],
                x: (i % 2 === 0 ? 1 : -1) * (40 + i * 20)
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.4,
                ease: "linear"
              }}
            >
              <AlertTriangle className="w-5 h-5" />
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-center"
          >
            <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">
              Transaction Failed
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Oh No!</h2>
            <p className="text-white/80 text-xs font-medium mt-0.5">
              Your payment couldn't be processed
            </p>
          </motion.div>
        </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                  Error Details
                </p>
                <div className="bg-red-50 rounded-2xl p-4 border border-dashed border-red-200 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Service</span>
                    <span className="text-gray-900 font-bold">Auction Entry Fee</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Product</span>
                    <span className="text-gray-900 font-semibold truncate max-w-[150px]">{productName}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 text-xs">Amount Attempted</span>
                    <span className="text-red-600 font-bold flex items-center gap-1 text-base">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-red-100 italic">
                    <span className="text-gray-400">Time Slot</span>
                    <span className="text-red-500 font-medium">{timeSlot || String(auctionNumber) || 'Active'}</span>
                  </div>

                  {transactionId && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-red-100">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="text-red-500 font-mono font-medium">{transactionId}</span>
                    </div>
                  )}

                  <div className="text-left pt-2 border-t border-red-100">
                    <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest block mb-1">Error Message</span>
                    <p className="text-red-500 text-[10px] font-medium leading-relaxed italic">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <Button
                  onClick={onRetry}
                  className="w-full h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  Try Again
                </Button>

                <Button
                  onClick={downloadReceipt}
                  variant="outline"
                  className="w-full h-11 border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
                
                  <div className="flex flex-col items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Redirecting in <span className="text-red-500 text-sm font-black">{countdown}s</span>
                    </span>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i} 
                            className={`h-1 w-8 rounded-full transition-all duration-300 ${i <= (3 - countdown + 1) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gray-100'}`} 
                          />
                        ))}
                      </div>
                  </div>
              </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
