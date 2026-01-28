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
  amount, 
  type, 
  boxNumber, 
  auctionId,
  auctionNumber,
  productName = 'Auction Participation',
  productWorth,
  timeSlot,
  paidBy,
  paymentMethod = 'UPI / Card',
  transactionId,
  upiId,
  bankName,
  cardName,
  cardNumber,
  onBackToHome,
  onClose
}: PaymentSuccessProps) {
    const [countdown, setCountdown] = useState(2);

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

    // Theme Colors based on type
    const themes = {
      entry: { primary: [16, 185, 129], bg: [240, 253, 244], label: 'ENTRY SUCCESS' },
      bid: { primary: [59, 130, 246], bg: [239, 246, 255], label: 'BID SUCCESS' },
      claim: { primary: [217, 119, 6], bg: [255, 251, 235], label: 'PRIZE CLAIM SUCCESS' }
    };
    
    const theme = themes[type as keyof typeof themes] || themes.entry;
    const darkViolet = [83, 49, 123];
    const gray = [107, 114, 128];
    
    // Header section with brand color
    doc.setFillColor(darkViolet[0], darkViolet[1], darkViolet[2]);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('DREAM60 INDIA', 20, 30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM AUCTION PLATFORM', 20, 38);

    doc.setFontSize(18);
    doc.text('OFFICIAL RECEIPT', 140, 30);
    
    // Receipt info line
    doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
    doc.rect(0, 45, 210, 15, 'F');
    doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Scenario: ${theme.label}`, 20, 55);
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
    doc.text('Transaction Details', 20, 72);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 75, 190, 75);

    const drawDetailRow = (label: string, value: string, isTotal = false) => {
      if (isTotal) {
        doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
        doc.rect(20, curY - 8, 170, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(label, 25, curY);
      
      doc.setTextColor(31, 41, 55);
      if (isTotal) doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.text(value || 'N/A', 100, curY);
      
      doc.setDrawColor(243, 244, 246);
      doc.line(20, curY + 4, 190, curY + 4);
      curY += 12;
    };

    const auctionType = type === 'entry' ? 'Auction Entry Fee' : type === 'claim' ? 'Prize Claim Fee' : 'Auction Bid';
    const detailLabel = type === 'entry' ? 'Registration for' : 'Product Name';

    drawDetailRow('Service Type', auctionType);
    drawDetailRow('Customer Name', paidBy || 'Valued Player');
    drawDetailRow(detailLabel, productName);
    drawDetailRow('Prize Worth', `INR ${productWorth?.toLocaleString('en-IN') || 'TBD'}`);
    drawDetailRow('Auction ID', auctionId || 'N/A');
    if (type !== 'claim') drawDetailRow('Auction Time Slot', timeSlot || 'Active');
    drawDetailRow('Payment Method', paymentMethod);
    curY += 5;
    drawDetailRow('TOTAL AMOUNT PAID', `INR ${amount.toLocaleString('en-IN')}`, true);

    // Authenticity Stamp
    curY += 30;
    doc.setDrawColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.setLineWidth(0.5);
    doc.rect(140, curY - 15, 45, 20);
    doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFIED', 152, curY - 5);
    doc.setFontSize(7);
    doc.text('OFFICIALLY SIGNED', 147, curY);

    // Important Info
    curY += 10;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Important Information:', 20, curY);
    curY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(gray[0], gray[1], gray[2]);
    const notes = type === 'claim' ? [
      '• This receipt confirms your official claim for the auction prize.',
      '• Your Amazon Voucher will be sent to your registered email.',
      '• Delivery usually takes 24-48 business hours.',
      '• Please keep this receipt for future reference.'
    ] : [
      '• This receipt confirms your participation in the specified auction.',
      '• Entry fees are non-refundable once the auction begins.',
      '• If you win, you will be notified via email and in-app notifications.',
      '• For any queries, please provide the Transaction ID mentioned above.'
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
    doc.text('DREAM60 | Live Auction Platform | support@dream60.com | www.dream60.com', 105, 285, { align: 'center' });
    doc.text('Computer Generated document. No signature required.', 105, 290, { align: 'center' });
    
    doc.save(`Dream60_${type}_Receipt_${Date.now()}.pdf`);
  };

  const getGradient = () => {
    if (type === 'claim') return 'from-amber-400 to-orange-600';
    if (type === 'bid') return 'from-blue-400 to-blue-600';
    return 'from-green-400 to-emerald-600';
  };

  const getIconColor = () => {
    if (type === 'claim') return 'text-orange-500';
    if (type === 'bid') return 'text-blue-500';
    return 'text-green-500';
  };

  const getSubTitle = () => {
    if (type === 'claim') return 'Congratulations! Your prize has been claimed.';
    if (type === 'entry') return 'You have successfully joined the auction!';
    return 'Your bid has been placed successfully!';
  };

  const getAmountColor = () => {
    if (type === 'claim') return 'text-orange-600';
    if (type === 'bid') return 'text-blue-600';
    return 'text-emerald-600';
  };

  const getButtonColor = () => {
    if (type === 'claim') return 'bg-orange-500 hover:bg-orange-600';
    if (type === 'bid') return 'bg-blue-500 hover:bg-blue-600';
    return 'bg-emerald-500 hover:bg-emerald-600';
  };

  const borderTheme = {
    entry: 'border-emerald-100 text-emerald-600 hover:bg-emerald-50',
    bid: 'border-blue-100 text-blue-600 hover:bg-blue-50',
    claim: 'border-orange-100 text-orange-600 hover:bg-orange-50'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ isolation: 'isolate' }}>
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
      <div className={`bg-gradient-to-br ${getGradient()} p-8 flex flex-col items-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
        
          <motion.div 
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg relative z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, bounce: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              {type === 'claim' ? (
                <Trophy className={`w-10 h-10 ${getIconColor()}`} strokeWidth={3} />
              ) : (
                <Check className={`w-10 h-10 ${getIconColor()}`} strokeWidth={4} />
              )}
            </motion.div>
          </motion.div>
          
          {/* Success Sparkles/Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/40"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: i * 0.3,
                ease: "easeOut"
              }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
          ))}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-center"
        >
          <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest mb-1 inline-block">
            {type === 'claim' ? 'Claim Processed' : 'Success'}
          </div>
          <h2 className="text-white text-2xl font-bold tracking-tight">
            {type === 'claim' ? 'Congratulations!' : 'Payment Complete'}
          </h2>
          <p className="text-white/80 text-xs font-medium mt-0.5 max-w-[250px] mx-auto">
            {getSubTitle()}
          </p>
        </motion.div>
      </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                Transaction Summary
              </p>
              <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-900 font-bold">
                    {type === 'entry' ? 'Auction Entry Fee' : type === 'claim' ? 'Prize Claim Payment' : 'Auction Bid'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Subject</span>
                  <span className="text-gray-900 font-semibold truncate max-w-[150px]">{productName}</span>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">Player</span>
                  <span className="text-gray-900 font-medium">{paidBy || 'Member'}</span>
                </div>
                
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-100 italic">
                    <span className="text-gray-400">{type === 'claim' ? 'Prize Worth' : 'Time Slot'}</span>
                    <span className="text-gray-600 font-medium">
                      {type === 'claim' ? `₹${productWorth?.toLocaleString('en-IN')}` : (timeSlot || String(auctionNumber) || 'Active')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100">
                    <span className="text-gray-400">Payment Method</span>
                    <span className="text-gray-600 font-medium uppercase">{paymentMethod}</span>
                  </div>

                  {upiId && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100">
                      <span className="text-gray-400">UPI ID</span>
                      <span className="text-gray-600 font-medium">{upiId}</span>
                    </div>
                  )}

                  {bankName && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100">
                      <span className="text-gray-400">Bank</span>
                      <span className="text-gray-600 font-medium">{bankName}</span>
                    </div>
                  )}

                  {(cardName || cardNumber) && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100">
                      <span className="text-gray-400">Card</span>
                      <span className="text-gray-600 font-medium">{cardName} {cardNumber}</span>
                    </div>
                  )}

                  {transactionId && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100">
                      <span className="text-gray-400">Transaction ID</span>
                      <span className="text-gray-600 font-mono font-medium">{transactionId}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">

                  <span className="text-gray-500 font-medium">Amount Paid</span>
                  <span className={`${getAmountColor()} font-black flex items-center gap-0.5 text-lg`}>
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
                  className={`h-11 ${getButtonColor()} text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2`}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>

                <Button
                  onClick={downloadReceipt}
                  variant="outline"
                  className={`h-11 ${borderTheme[type as keyof typeof borderTheme] || borderTheme.entry} rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2`}
                >
                  <Download className="w-4 h-4" />
                  Receipt
                </Button>
              </div>
              
              <div className="flex flex-col items-center gap-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Clock className={`w-3 h-3 ${getAmountColor()}`} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Auto-close in <span className={`${getAmountColor()} text-sm font-black`}>{countdown}s</span>
                  </span>
                </div>
                    <div className="flex gap-1">
                      {[1, 2].map((i) => (
                        <motion.div 
                          key={i} 
                          animate={{ 
                            width: i <= (2 - countdown + 1) ? 24 : 8,
                            backgroundColor: i <= (2 - countdown + 1) ? (type === 'claim' ? '#F59E0B' : type === 'bid' ? '#3B82F6' : '#10B981') : '#F3F4F6'
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
