import { ArrowLeft, Scale, AlertTriangle, Shield, FileText, Users, Gavel } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';

interface TermsAndConditionsProps {
  onBack: () => void;
}

export function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <motion.header 
        className="bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-sm relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
            <div className="w-px h-6 bg-purple-300"></div>
            <div className="flex items-center space-x-2">
              <Scale className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-purple-800">Terms & Conditions</h1>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
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
                  <h3 className="text-lg sm:text-xl font-semibold text-purple-800 mb-2">Important Notice</h3>
                  <p className="text-sm sm:text-base text-purple-700">
                    By participating in Dream60 auctions, you agree to these terms and conditions. 
                    Please read carefully before placing any bids.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-4 sm:space-y-6">
            {/* 1. Acceptance of Terms */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>1. Acceptance of Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">1.1 Agreement:</strong> By accessing or using Dream60, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                <p><strong className="text-purple-800">1.2 Eligibility:</strong> You must be at least 18 years old and legally capable of entering into binding contracts to use our services.</p>
                <p><strong className="text-purple-800">1.3 Jurisdiction:</strong> These terms are governed by the laws of the United States and the State of Delaware.</p>
                <p><strong className="text-purple-800">1.4 Modifications:</strong> We reserve the right to modify these terms at any time with 30 days notice via email and platform notifications.</p>
              </CardContent>
            </Card>

            {/* 2. Game Rules */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>2. Game Rules and Mechanics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">2.1 Auction Format:</strong> Dream60 operates 6 auctions daily, each lasting exactly 60 minutes with 6 boxes per auction.</p>
                <p><strong className="text-purple-800">2.2 Entry Requirements:</strong> Boxes 1-2 require random entry fees (₹1000-₹3500) paid exactly as displayed. Entry fee unlocks access to all bidding rounds.</p>
                <p><strong className="text-purple-800">2.3 Bidding Rounds:</strong> Boxes 3-6 open every 15 minutes (at 0, 15, 30, and 45-minute marks) with minimum bids of ₹700 and maximum bids of 90% of prize value.</p>
                <p><strong className="text-purple-800">2.4 Bidding Frequency:</strong> Users may place one bid per box per 15-minute interval. No bid stacking or automated bidding allowed.</p>
                <p><strong className="text-purple-800">2.5 Winning Conditions:</strong> Highest valid bid when each box closes wins the associated prize. Multiple winners possible per auction.</p>
                <p><strong className="text-purple-800">2.6 Tie-Breaking:</strong> In case of identical bids, the first bid submitted wins (timestamp priority).</p>
              </CardContent>
            </Card>

            {/* 3. Account Terms */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>3. Account Terms and Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">3.1 Account Creation:</strong> Users must provide accurate, complete, and current information. One account per person strictly enforced.</p>
                <p><strong className="text-purple-800">3.2 Identity Verification:</strong> We require government-issued photo ID and address verification for accounts with winnings over $600.</p>
                <p><strong className="text-purple-800">3.3 Account Security:</strong> Users are responsible for maintaining account security. Report suspected unauthorized access immediately.</p>
                <p><strong className="text-purple-800">3.4 Account Suspension:</strong> We reserve the right to suspend accounts for violations, fraud, or suspicious activity.</p>
                <p><strong className="text-purple-800">3.5 Account Termination:</strong> Either party may terminate the account relationship with 30 days notice. Immediate termination for serious violations.</p>
              </CardContent>
            </Card>

            {/* 4. Financial Terms */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="text-lg sm:text-xl text-green-800 flex items-center space-x-2">
                  <span className="text-2xl">💰</span>
                  <span>4. Financial Terms and Payment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">4.1 Pay-As-You-Go Model:</strong> Dream60 operates on direct payment basis. No pre-funding or subscription fees required.</p>
                <p><strong className="text-purple-800">4.2 Entry Fees:</strong> All entry fees are final and non-refundable once paid, regardless of auction outcome or user participation.</p>
                <p><strong className="text-purple-800">4.3 Bid Payments:</strong> All bids require immediate payment and are final. No bid cancellations or modifications allowed.</p>
                <p><strong className="text-purple-800">4.4 Payment Methods:</strong> We accept major credit cards, debit cards, PayPal, and select digital payment methods. All payments processed securely.</p>
                <p><strong className="text-purple-800">4.5 Failed Payments:</strong> Failed payments result in immediate bid/entry disqualification. No grace period provided.</p>
                <p><strong className="text-purple-800">4.6 Chargebacks:</strong> Unauthorized chargebacks result in immediate account termination and potential legal action.</p>
                <p><strong className="text-purple-800">4.7 Taxes:</strong> Winners are responsible for all applicable taxes on prizes valued over $600.</p>
              </CardContent>
            </Card>

            {/* 5. Prize Terms */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
                <CardTitle className="text-lg sm:text-xl text-yellow-800 flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span>5. Prize Terms and Fulfillment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">5.1 Prize Values:</strong> All prize values are stated in USD and represent fair market value at time of auction.</p>
                <p><strong className="text-purple-800">5.2 Prize Claim Period:</strong> Winners have 30 days to claim prizes. Unclaimed prizes forfeit to Dream60.</p>
                <p><strong className="text-purple-800">5.3 Delivery:</strong> Prizes shipped free worldwide within 14 business days of verification. Tracking information provided.</p>
                <p><strong className="text-purple-800">5.4 Cash Alternatives:</strong> We reserve the right to substitute cash value for physical prizes at our discretion.</p>
                <p><strong className="text-purple-800">5.5 Import Duties:</strong> International winners responsible for customs fees and import duties.</p>
                <p><strong className="text-purple-800">5.6 Prize Condition:</strong> Prizes delivered new in original packaging unless otherwise specified.</p>
              </CardContent>
            </Card>

            {/* 6. Prohibited Activities */}
            <Card className="bg-white border-red-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100">
                <CardTitle className="text-lg sm:text-xl text-red-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>6. Prohibited Activities</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-red-800">6.1 Multiple Accounts:</strong> Creating or operating multiple accounts strictly prohibited. Immediate termination of all accounts.</p>
                <p><strong className="text-red-800">6.2 Automated Systems:</strong> Use of bots, scripts, or automated bidding systems prohibited. Technical measures in place to detect violations.</p>
                <p><strong className="text-red-800">6.3 Collusion:</strong> Coordinating with other users to manipulate auctions prohibited. Includes bid sharing or strategic coordination.</p>
                <p><strong className="text-red-800">6.4 System Exploitation:</strong> Attempting to exploit bugs, glitches, or vulnerabilities prohibited. Report issues to support immediately.</p>
                <p><strong className="text-red-800">6.5 False Information:</strong> Providing false identity, payment, or contact information prohibited.</p>
                <p><strong className="text-red-800">6.6 Harassment:</strong> Abusive behavior toward other users or staff prohibited. Respectful communication required.</p>
              </CardContent>
            </Card>

            {/* 7. Platform Responsibilities */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <CardTitle className="text-lg sm:text-xl text-blue-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>7. Platform Responsibilities</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">7.1 Service Availability:</strong> We strive for 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance communicated in advance.</p>
                <p><strong className="text-purple-800">7.2 Technical Issues:</strong> In case of system failures during auctions, affected auctions may be paused, restarted, or cancelled with full refunds.</p>
                <p><strong className="text-purple-800">7.3 Fair Play Monitoring:</strong> We actively monitor for violations using automated systems and manual review.</p>
                <p><strong className="text-purple-800">7.4 Dispute Resolution:</strong> All legitimate disputes investigated within 5 business days. Decision final and binding.</p>
                <p><strong className="text-purple-800">7.5 Data Security:</strong> We implement industry-standard security measures but cannot guarantee absolute security.</p>
                <p><strong className="text-purple-800">7.6 Customer Support:</strong> Support available 24/7 via email, live chat, and phone for urgent issues.</p>
              </CardContent>
            </Card>

            {/* 8-12 collapsed for brevity */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Gavel className="w-5 h-5 text-purple-600" />
                  <span>8. Limitation of Liability</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">8.1 Maximum Liability:</strong> Our total liability for any claims related to an auction is limited to the total amount you paid for that specific auction.</p>
                <p><strong className="text-purple-800">8.2 Indirect Damages:</strong> We are not liable for indirect, incidental, special, consequential, or punitive damages under any circumstances.</p>
                <p><strong className="text-purple-800">8.3 Service Disclaimer:</strong> Services provided "as is" without warranties of any kind, express or implied.</p>
                <p><strong className="text-purple-800">8.4 Force Majeure:</strong> Not liable for delays or failures due to acts of God, government actions, network failures, or other circumstances beyond our reasonable control.</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800">9-12. Additional Terms</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">9. Intellectual Property:</strong> All platform content and trademarks are our exclusive property.</p>
                <p><strong className="text-purple-800">10. Privacy:</strong> See our Privacy Policy for details on data collection and usage.</p>
                <p><strong className="text-purple-800">11. Dispute Resolution:</strong> Disputes resolved through binding arbitration in Delaware under AAA rules. Class action waiver applies.</p>
                <p><strong className="text-purple-800">12. Contact:</strong> Legal notices must be sent to legal@dream60.com with certified delivery.</p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-purple-800 font-semibold">
                Last updated: December 5, 2025
              </p>
              <p className="text-sm text-purple-600 mt-2">
                For questions about these terms, please contact our support team.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}