import { ArrowLeft, RefreshCcw, AlertTriangle, Shield, FileText, Ban, CreditCard, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';

interface RefundCancellationProps {
  onBack: () => void;
}

export function RefundCancellation({ onBack }: RefundCancellationProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header with Logo */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="w-px h-6 bg-purple-300 hidden sm:block"></div>
              <div className="hidden sm:flex items-center space-x-2">
                <RefreshCcw className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Refund & Cancellation</h1>
              </div>
            </div>
            
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={onBack}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">Dream60</h2>
                <p className="text-[10px] text-purple-600">Live Auction Play</p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
        <motion.div 
          className="sm:hidden flex items-center space-x-2 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RefreshCcw className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">Refund & Cancellation</h1>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-800 mb-2">Policy Overview</h3>
                  <p className="text-sm sm:text-base text-purple-700">
                    At Dream60, we strive to maintain a fair and transparent auction environment. 
                    Please review our refund and cancellation policies regarding entry fees and winning bid payments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>1. Entry Fee Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">1.1 Non-Refundable Nature:</strong> Entry fees paid to participate in an auction are non-refundable once the transaction is successful.</p>
                <p><strong className="text-purple-800">1.2 Participation:</strong> Payment of the entry fee grants access to the specific auction hour selected. Failure to participate or place bids does not entitle the user to a refund.</p>
                <p><strong className="text-purple-800">1.3 Technical Issues:</strong> Dream60 is not responsible for entry fee refunds due to user-side technical issues, including poor internet connectivity or device compatibility problems.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Ban className="w-5 h-5 text-purple-600" />
                  <span>2. Cancellation Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">2.1 User-Initiated Cancellation:</strong> Users cannot cancel their participation once an entry fee has been paid or a bid has been placed.</p>
                <p><strong className="text-purple-800">2.2 Auction Cancellation by Dream60:</strong> In the rare event that Dream60 cancels an auction due to internal technical failures or unforeseen circumstances, the entry fees for that specific auction will be credited back to the user's account or original payment method within 5-7 working days.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>3. Winning Bid Payments</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">3.1 Finality:</strong> Payments made by winners for their respective bid amounts are final and non-refundable.</p>
                <p><strong className="text-purple-800">3.2 Forfeiture:</strong> If a winner fails to pay the bid amount within the specified timeframe, their win is forfeited, and no refunds for previously paid entry fees will be provided.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>4. Dispute Resolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">4.1 Support Contact:</strong> For any payment-related concerns or perceived errors in billing, please contact our support team at support@dream60.com with your transaction details.</p>
                <p><strong className="text-purple-800">4.2 Investigation:</strong> Dream60 will investigate all reported issues and provide a resolution based on platform logs and payment gateway reports.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-purple-800 font-semibold">
                Last updated: January 23, 2026
              </p>
              <p className="text-sm text-purple-600 mt-2">
                For further clarification, please reach out to us at support@dream60.com.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
