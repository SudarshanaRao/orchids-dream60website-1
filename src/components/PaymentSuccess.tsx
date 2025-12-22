import { motion } from 'framer-motion';
import { Check, Trophy, Home, IndianRupee, Sparkles, CheckCircle2, Star, Clock, X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';
import jsPDF from 'jspdf';

interface PaymentSuccessProps {
  amount: number;
  type: 'entry' | 'bid';
  boxNumber?: number;
  auctionId?: string;
  auctionNumber?: string | number;
  productName?: string;
  productWorth?: number;
  timeSlot?: string;
  paidBy?: string;
  paymentMethod?: string;
  onBackToHome: () => void;
  onClose?: () => void;
}

export function PaymentSuccess({ 
  amount, 
  type, 
  boxNumber, 
  auctionId,
  auctionNumber,
  productName = 'Auction Participation',
  productWorth,
  timeSlot,
  paidBy,
  paymentMethod = 'UPI / Razorpay',
  onBackToHome,
  onClose
}: PaymentSuccessProps) {
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

    const primaryColor = [16, 185, 129]; // Emerald theme for success
    const secondaryColor = [31, 41, 55]; // Gray-800
    
    // Header section
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60 INDIA', 20, 25);
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICIAL PAYMENT CONFIRMATION', 20, 32);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(18);
    doc.text('Payment Receipt', 140, 25);
    
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

    drawRow('Received from', paidBy || 'Valued User');
    drawRow('Product Name', productName);
    drawRow('Product Value', `INR ${productWorth?.toLocaleString('en-IN') || 'TBD'}`);
    drawRow('Auction ID', auctionId || 'N/A');
    drawRow('Auction Number', String(auctionNumber || 'N/A'));
    drawRow('Time Slot', timeSlot || 'Active');
    drawRow('Payment Method', paymentMethod);
    drawRow('Amount Paid', `INR ${amount.toLocaleString('en-IN')}`);
    drawRow('Date of Payment', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
    drawRow('Transaction ID', `TXN-${Math.floor(Date.now() / 1000)}`);

    // Status Message
    curY += 20;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.text('Thank you for your payment. This transaction has been successfully processed.', 20, curY);

    // Footer
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 270, 210, 27, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.text('DREAM60 INDIA OFFICIAL | support@dream60.com | www.dream60.com', 105, 280, { align: 'center' });
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 105, 285, { align: 'center' });
    
    doc.save(`Dream60_Receipt_${auctionId || Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
      <Snowfall 
        color="#10B981"
        snowflakeCount={isMobile ? 10 : 40}
        radius={[0.8, 2.5]}
        speed={[0.6, 1.5]}
        style={{ zIndex: 101, position: 'fixed' }}
      />

    <motion.div 
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
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
      <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
        <motion.div 
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Check className="w-10 h-10 text-green-500" strokeWidth={4} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">
            Success
          </div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Payment Complete</h2>
          <p className="text-white/80 text-xs font-medium mt-0.5">
            {type === 'entry' ? 'You are now registered for this auction!' : 'Your bid has been placed successfully!'}
          </p>
        </motion.div>
      </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                Transaction Details
              </p>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-900 font-bold">{type === 'entry' ? 'Auction Entry Fee' : 'Auction Bid'}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Product</span>
                  <span className="text-gray-900 font-semibold truncate max-w-[150px]">{productName}</span>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Paid By</span>
                  <span className="text-gray-900 font-medium">{paidBy || 'Member'}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100 italic">
                  <span className="text-gray-400">Time Slot</span>
                  <span className="text-gray-600 font-medium">{timeSlot || String(auctionNumber) || 'Active'}</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">Amount Paid</span>
                  <span className="text-emerald-600 font-black flex items-center gap-0.5 text-lg">
                    <IndianRupee className="w-4 h-4" />
                    {amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>


            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={onBackToHome}
                  className="h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>

                <Button
                  onClick={downloadReceipt}
                  variant="outline"
                  className="h-11 border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Receipt
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Closing in <span className="text-emerald-500 text-sm font-black">{countdown}s</span>
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                      key={i} 
                      animate={{ 
                        width: i <= (5 - countdown + 1) ? 24 : 8,
                        backgroundColor: i <= (5 - countdown + 1) ? '#10B981' : '#F3F4F6'
                      }}
                      className="h-1 rounded-full"
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
