import { ArrowLeft, Scale, AlertTriangle, Shield, FileText, Clock, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';

interface RefundPolicyProps {
  onBack: () => void;
}

export function RefundPolicy({ onBack }: RefundPolicyProps) {
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
                <RefreshCw className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Refund & Cancellation</h1>
              </div>
            </div>
            
            {/* Logo */}
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
        {/* Mobile Title */}
        <motion.div 
          className="sm:hidden flex items-center space-x-2 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RefreshCw className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">Refund & Cancellation</h1>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Important Notice */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-800 mb-2">Policy Overview</h3>
                  <p className="text-sm sm:text-base text-purple-700">
                    Dream60 operates a live auction platform where participation involves real-time costs and commitments. 
                    Please review our refund and cancellation terms carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Sections */}
          <div className="space-y-4 sm:space-y-6">
            {/* 1. Refund Policy */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <span>1. Refund Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">1.1 Entry Fees:</strong> All entry fees paid to join an auction are strictly non-refundable. This applies even if you choose not to place a bid, are eliminated in early rounds, or face technical issues on your side.</p>
                <p><strong className="text-purple-800">1.2 Bid Payments:</strong> Once a winning bid amount is paid by the Rank 1 winner, it is final and non-refundable, as the prize fulfillment process begins immediately.</p>
                <p><strong className="text-purple-800">1.3 Digital Nature:</strong> Since Dream60 provides a digital service with real-time participation, we do not offer refunds once the service has been accessed or used.</p>
              </CardContent>
            </Card>

            {/* 2. Cancellation Policy */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-purple-600" />
                  <span>2. Cancellation Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">2.1 Auction Cancellation by User:</strong> Users cannot cancel their participation or withdraw a bid once it has been submitted. All actions in the live auction environment are final.</p>
                <p><strong className="text-purple-800">2.2 Auction Cancellation by Company:</strong> Dream60 reserves the right to cancel, postpone, or reschedule any auction at its sole discretion for reasons including but not limited to technical failures, system integrity, or low participation.</p>
                <p><strong className="text-purple-800">2.3 Rights of the Company:</strong> <span className="text-purple-900 font-bold">The company holds all rights to cancel any Auction at their choice without prior notice.</span></p>
              </CardContent>
            </Card>

            {/* 3. Exceptional Cases */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>3. Exceptional Cases</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">3.1 System Malfunctions:</strong> In the rare event of a platform-wide technical failure confirmed by Dream60, entry fees for the affected auction may be credited back to the user's account at the company's discretion.</p>
                <p><strong className="text-purple-800">3.2 Account Termination:</strong> If an account is terminated due to a violation of our Terms and Conditions, all pending fees and winnings will be forfeited and no refunds will be issued.</p>
              </CardContent>
            </Card>
          </div>

          {/* Footer Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-purple-800 font-semibold">
                Last updated: January 20, 2026
              </p>
              <p className="text-sm text-purple-600 mt-2">
                If you have any questions regarding these policies, please reach out to our support team at support@dream60.com.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
