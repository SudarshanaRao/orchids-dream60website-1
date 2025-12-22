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
      // Stay for 5 seconds as requested
      const timer = setTimeout(() => {
        onBackToHome();
      }, 5000);
      
      return () => clearTimeout(timer);
    }, [onBackToHome]);
  
    useEffect(() => {
      if (countdown === 0) return;
  
      const interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000); // 1 second ticks
  
      return () => clearInterval(interval);
    }, [countdown]);

    const downloadReceipt = () => {
      const doc = new jsPDF();
      const primaryColor = [139, 92, 246]; // Purple theme
      
      // Header Background
      doc.setFillColor(252, 251, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Top Header Bar
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 3, 'F');
      
      // Logo and Title
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Dream60 India', 20, 25);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Premium Online Auctions', 20, 32);

      // Receipt Badge
      doc.setFillColor(243, 232, 255);
      doc.roundedRect(140, 15, 50, 20, 3, 3, 'F');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT', 165, 28, { align: 'center' });

      // Main Info Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Receipt', 20, 50);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 56);
      doc.text(`Transaction ID: TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 61);

      // Info Grid
      const col1 = 20;
      const col2 = 110;
      let curY = 80;

      const drawInfoBox = (label: string, value: string, x: number, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), x, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(value || 'N/A', x, y + 6);
      };

      drawInfoBox('Paid By', paidBy || 'Valued User', col1, curY);
      drawInfoBox('Paid To', 'Dream60 India Corp', col2, curY);
      
      curY += 20;
      drawInfoBox('Auction Time Slot', timeSlot || String(auctionNumber) || 'N/A', col1, curY);
      drawInfoBox('Payment Method', paymentMethod, col2, curY);

      curY += 25;

      // Table Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(20, curY, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 25, curY + 6.5);
      doc.text('PRICE', 130, curY + 6.5);
      doc.text('QTY', 155, curY + 6.5);
      doc.text('TOTAL', 175, curY + 6.5);

      // Table Row
      curY += 10;
      doc.setFillColor(255, 255, 255);
      doc.rect(20, curY, 170, 15, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(type === 'entry' ? `Entry Fee: ${productName}` : `Bid for ${productName}`, 25, curY + 9);
      doc.text(`INR ${amount.toLocaleString('en-IN')}`, 130, curY + 9);
      doc.text('1', 157, curY + 9);
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${amount.toLocaleString('en-IN')}`, 175, curY + 9);

      // Product Worth (Optional Note)
      if (productWorth) {
        curY += 15;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`* Prize Value Worth: INR ${productWorth.toLocaleString('en-IN')}`, 25, curY);
      }

      // Total Section
      curY = 200;
      doc.setDrawColor(230, 230, 230);
      doc.line(120, curY, 190, curY);
      
      curY += 10;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text('Total Amount', 120, curY);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`INR ${amount.toLocaleString('en-IN')}`, 190, curY, { align: 'right' });

      // Status Stamp
      doc.setDrawColor(34, 197, 94); // Green
      doc.setLineWidth(0.8);
      doc.roundedRect(20, 230, 40, 15, 2, 2);
      doc.setTextColor(34, 197, 94);
      doc.setFontSize(12);
      doc.text('PAID', 40, 240, { align: 'center' });

      // Footer
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Dream60 India.', 105, 275, { align: 'center' });
      doc.text('For support, visit help.dream60.com or contact our AI assistant.', 105, 280, { align: 'center' });
      
      doc.save(`Dream60_Receipt_${auctionId || 'Payment'}.pdf`);
    };


    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
        <Snowfall 
          color="#A78BFA"
          snowflakeCount={isMobile ? 3 : 15}
          radius={[1.0, 3.0]}
          speed={[0.5, 1.2]}
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
          {/* Header Section with Gradient */}
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
                          initial={false}
                          animate={{ 
                            width: i <= (6-countdown) ? 24 : 8,
                            backgroundColor: i <= (6-countdown) ? '#10B981' : '#F3F4F6'
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
