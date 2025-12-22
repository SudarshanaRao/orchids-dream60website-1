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
  onBackToHome: () => void;
  onClose?: () => void;
}

  export function PaymentSuccess({ 
    amount, 
    type, 
    boxNumber, 
    auctionId,
    auctionNumber,
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
        
        // Theme colors
        const primaryColor = [16, 185, 129]; // Emerald
        
        // Header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('DREAM60', 105, 25, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PAYMENT SUCCESS RECEIPT', 105, 33, { align: 'center' });
        
        // Content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('Transaction Details:', 20, 55);
        
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 58, 190, 58);
        
        let y = 70;
        const details = [
          ['Transaction Type', type === 'entry' ? 'Entry Fee' : 'Auction Bid'],
          ['Status', 'SUCCESSFUL'],
          ['Amount Paid', `INR ${amount.toLocaleString('en-IN')}`],
          ['Auction ID', auctionId || 'N/A'],
          ['Auction Number', auctionNumber ? `#${auctionNumber}` : 'N/A'],
          ['Box Number', boxNumber !== undefined ? String(boxNumber) : 'N/A'],
          ['Date', new Date().toLocaleString('en-IN')]
        ];
        
        details.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, 20, y);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value), 80, y);
          y += 10;
        });
        
        // Footer
        doc.setFillColor(245, 245, 245);
        doc.rect(0, 270, 210, 27, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text('This is a computer-generated proof of payment.', 105, 280, { align: 'center' });
        doc.text('Dream60 Official Website - Thank you for participating!', 105, 285, { align: 'center' });
        
        doc.save(`Dream60_Success_Receipt_${Date.now()}.pdf`);
      };


    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
        <Snowfall 
          color="#A78BFA"
          snowflakeCount={isMobile ? 3 : 20}
          radius={[0.3, 1.5]}
          speed={[0.2, 0.8]}
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
            {/* Decorative background circles */}
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
                Awesome!
              </div>
              <h2 className="text-white text-2xl font-bold tracking-tight">Congratulations.</h2>
              <p className="text-white/80 text-xs font-medium mt-0.5">
                {type === 'entry' ? 'Your order is accepted!' : 'Your bid is accepted!'}
              </p>
            </motion.div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">
                  Payment Successful
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Transaction Type</span>
                    <span className="text-gray-900 font-bold">{type === 'entry' ? 'Entry Fee' : 'Auction Bid'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {auctionId && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Auction ID</span>
                      <span className="text-gray-900 font-mono text-[10px] bg-white px-2 py-0.5 border border-gray-100 rounded">
                        {auctionId}
                      </span>
                    </div>
                  )}

                  {(auctionNumber || boxNumber !== undefined) && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Auction Number</span>
                      <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded text-xs">
                        #{auctionNumber || (boxNumber === 0 ? 'AUTO' : boxNumber)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

                <div className="space-y-2">
                  <Button
                    onClick={onBackToHome}
                    className="w-full h-11 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                  >
                    Done
                  </Button>

                  <Button
                    onClick={downloadReceipt}
                    variant="outline"
                    className="w-full h-11 border-2 border-green-100 text-green-600 hover:bg-green-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </Button>
                  
                  <div className="flex flex-col items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Closing in <span className="text-green-500 text-sm font-black">{countdown}s</span>
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div 
                          key={i} 
                          className={`h-1 w-8 rounded-full transition-all duration-300 ${i <= (6-countdown) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-100'}`} 
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
