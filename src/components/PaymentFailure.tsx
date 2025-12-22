import { motion } from 'framer-motion';
import { XCircle, Home, RefreshCw, AlertTriangle, Info, Clock, X, IndianRupee, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';
import jsPDF from 'jspdf';

interface PaymentFailureProps {
  amount: number;
  errorMessage?: string;
  auctionId?: string;
  auctionNumber?: string | number;
  productName?: string;
  productWorth?: number;
  timeSlot?: string;
  paidBy?: string;
  paymentMethod?: string;
  onRetry: () => void;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentFailure({ 
  amount, 
  errorMessage = 'Payment processing failed',
  auctionId,
  auctionNumber,
  productName = 'Auction Participation',
  productWorth,
  timeSlot,
  paidBy,
  paymentMethod = 'UPI / Razorpay',
  onRetry,
  onBackToHome,
  onClose
}: PaymentFailureProps) {
  const [countdown, setCountdown] = useState(5);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onBackToHome();
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown, onBackToHome]);

  const downloadReceipt = () => {
    const doc = jsPDF ? new jsPDF() : null;
    if (!doc) return;

    const primaryColor = [239, 68, 68]; // Red theme for failure
    const secondaryColor = [31, 41, 55]; // Gray-800
    
    // Header section
    doc.setFillColor(254, 242, 242);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60 INDIA', 20, 25);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PAYMENT ATTEMPT REPORT', 20, 32);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(18);
    doc.text('Failure Report', 140, 25);
    
    // Content Table
    let curY = 60;
    const tableX = 20;
    const col1X = 25;
    const col2X = 80;
    const rowHeight = 12;

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.1);

    const drawRow = (label: string, value: string) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(tableX, curY, 170, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text(label + ':', col1X, curY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(value || 'N/A', col2X, curY + 8);
      doc.line(tableX, curY + rowHeight, tableX + 170, curY + rowHeight);
      curY += rowHeight;
    };

    drawRow('Attempted by', paidBy || 'Valued User');
    drawRow('Product Name', productName);
    drawRow('Auction ID', auctionId || 'N/A');
    drawRow('Time Slot', timeSlot || 'Active');
    drawRow('Payment Method', paymentMethod);
    drawRow('Amount Attempted', `INR ${amount.toLocaleString('en-IN')}`);
    drawRow('Status', 'FAILED / DECLINED');
    drawRow('Error Message', errorMessage.substring(0, 50));
    drawRow('Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));

    // Message
    curY += 20;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.text('We encountered an issue while processing your payment. Please try again or contact support.', 20, curY);

    // Footer
    doc.setFillColor(254, 242, 242);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('DREAM60 INDIA OFFICIAL | support@dream60.com | www.dream60.com', 105, 280, { align: 'center' });
    
    doc.save(`Dream60_FailureReport_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <Snowfall 
        color="#EF4444"
        snowflakeCount={isMobile ? 10 : 35}
        radius={[0.8, 2.5]}
        speed={[0.6, 1.2]}
        style={{ zIndex: 101, position: 'fixed' }}
      />

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
            transition={{ type: "spring", delay: 0.2 }}
          >
            <X className="w-10 h-10 text-red-500" strokeWidth={4} />
          </motion.div>
          
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
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1 w-8 rounded-full transition-all duration-300 ${i <= (5 - countdown + 1) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gray-100'}`} 
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
