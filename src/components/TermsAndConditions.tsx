import { ArrowLeft, Scale, AlertTriangle, Shield, FileText, Users, Gavel, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';


interface TermsAndConditionsProps {
  onBack: () => void;
}

export function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
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
                <Scale className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl sm:text-2xl font-bold text-purple-800">Terms & Conditions</h1>
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
                <p className="text-[10px] text-purple-600">Live Auction Platform</p>
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
          <Scale className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-purple-800">Terms & Conditions</h1>
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
            {/* 1. Eligibility */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>1. Eligibility</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">1.1 Age and Capacity:</strong> Users must be at least 18 years old and legally capable of entering binding contracts to participate in any Dream60 auction.</p>
                <p><strong className="text-purple-800">1.2 Accurate Information:</strong> Users must provide true, accurate, current, and complete information, including full name, mobile number, email, and any other details requested during registration.</p>
                <p><strong className="text-purple-800">1.3 Verification:</strong> Account activation may require OTP or similar verification, and Dream60 may request additional documentation to confirm identity or eligibility at any time.</p>
                <p><strong className="text-purple-800">1.4 Right to Suspend or Terminate:</strong> Dream60 may suspend or terminate an account without prior notice if the information provided is false, misleading, incomplete, or cannot be verified to its satisfaction.</p>
              </CardContent>
            </Card>

            {/* 2. Account Registration */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>2. Account Registration and Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">2.1 Account Creation Requirement:</strong> Creating an account and logging in is mandatory to view full auction details, pay entry fees, and place bids.</p>
                <p><strong className="text-purple-800">2.2 Responsibility for Credentials:</strong> Users are solely responsible for maintaining the confidentiality of their login credentials and for all activities conducted through their accounts, whether authorized or not.</p>
                <p><strong className="text-purple-800">2.3 Notification of Unauthorized Use:</strong> Users must immediately notify Dream60 of any suspected unauthorized use or compromise of their account so Dream60 can investigate and, where appropriate, lock or suspend access.</p>
                <p><strong className="text-purple-800">2.4 Single User, Single Account:</strong> Each natural person is allowed only one account; maintaining multiple accounts may result in immediate suspension or permanent termination.</p>
              </CardContent>
            </Card>

            {/* 3. Structure of Dream60 Auctions */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  <span>3. Structure of Dream60 Auctions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">3.1 Entry Fee:</strong> Each auction has a clearly displayed entry fee that must be paid in full before participation. Payment grants the right to join that specific auction only.</p>
                <p><strong className="text-purple-800">3.2 Confirmation of Participation:</strong> An auction seat is confirmed only after successful payment processing; failed or pending payments do not grant bidding rights.</p>
                <p><strong className="text-purple-800">3.3 Non-Refundable Entry Fee:</strong> Entry fees are strictly non-refundable in all situations, including elimination in early rounds, user mistakes, or technical issues on the user’s side, except where applicable law mandates a refund.</p>
                <p><strong className="text-purple-800">3.4 Eligibility to Bid:</strong> Only users who have successfully paid the entry fee and hold an active, compliant account are eligible to place bids and win prizes in that auction.</p>
              </CardContent>
            </Card>

            {/* 4. Auction Rounds and Bidding Rules */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Gavel className="w-5 h-5 text-purple-600" />
                  <span>4. Auction Rounds and Bidding Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">4.1 Rounds and Duration:</strong> Each Dream60 auction consists of four rounds, each lasting 15 minutes, associated with Boxes 3, 4, 5, and 6 respectively.</p>
                <p><strong className="text-purple-800">4.2 Bid Submission Limits:</strong> In each round, a user may submit only one bid per eligible box; multiple bids or bid stacking in the same round is not permitted.</p>
                <p><strong className="text-purple-800">4.3 Irrevocability of Bids:</strong> Once submitted, a bid cannot be edited, reduced, cancelled, or withdrawn for any reason, including user error.</p>
                <p><strong className="text-purple-800">4.4 Advancement Criteria (Top 3 Rule):</strong> At the end of each round, the three highest bidders are ranked as the Top 3 and automatically advance to the next round, while all others are eliminated from the auction.</p>
                <p><strong className="text-purple-800">4.5 Progressive Bid Requirement:</strong> Any participant who advances must place a bid in the next round that is strictly higher than their previous round’s bid; placing a lower or equal bid may be treated as invalid and can result in disqualification.</p>
                <p><strong className="text-purple-800">4.6 Tie Handling:</strong> If two or more users submit identical bids for a position affecting advancement or ranking, Dream60 uses timestamp priority (earliest bid wins) to break ties.</p>
              </CardContent>
            </Card>

            {/* 5. Determining Winners and Prize Claim */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>5. Determining Winners and Prize Claim</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">5.1 Winner Selection:</strong> At the end of the final round, the participant with the highest valid bid is declared the provisional winner of that auction’s prize, subject to payment and verification.</p>
                <p><strong className="text-purple-800">5.2 Payment of Winning Bid:</strong> The Rank 1 winner must pay the exact final bid amount within the time frame communicated by Dream60 (for example, via app notification, SMS, or email); failure to do so results in forfeiture.</p>
                <p><strong className="text-purple-800">5.3 Escalation to Next Rank:</strong> If Rank 1 fails to pay on time, is disqualified, or cannot be verified, Dream60 may offer the prize to Rank 2, and then to Rank 3 if necessary, under the same payment and verification conditions.</p>
                <p><strong className="text-purple-800">5.4 Verification Requirements:</strong> Dream60 may request identity proof, address proof, or any relevant documentation before releasing the prize; failure to provide acceptable documents may lead to cancellation of the win without compensation.</p>
                <p><strong className="text-purple-800">5.5 Prize Delivery:</strong> Prizes are processed and dispatched only after receipt of the full winning bid amount and successful completion of verification, using methods and timelines communicated by Dream60.</p>
              </CardContent>
            </Card>

            {/* 6. Payments, Fees, and Refund Policy */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="text-lg sm:text-xl text-green-800 flex items-center space-x-2">
                  <span className="text-2xl">₹</span>
                  <span>6. Payments, Fees, and Refund Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">6.1 Accepted Payment Methods:</strong> Entry fees and winning bid payments must be made through payment methods supported on the platform, such as cards, wallets, bank transfers, or UPI, as available in India.</p>
                <p><strong className="text-purple-800">6.2 Finality of Payments:</strong> All successful payments, including entry fees and bid amounts, are final and non-reversible, except where Dream60 or applicable law explicitly authorizes a refund (e.g., cancelled auction).</p>
                <p><strong className="text-purple-800">6.3 Third-Party Payment Risks:</strong> Delays, declines, or additional charges from banks or payment gateways are outside Dream60’s control, and users must resolve such issues directly with their provider.</p>
                <p><strong className="text-purple-800">6.4 Failed or Reversed Payments:</strong> If a payment fails, is reversed, or is flagged as suspicious, Dream60 may cancel associated bids, remove the user from ongoing auctions, and suspend or terminate the account.</p>
                <p><strong className="text-purple-800">6.5 Taxes and Charges:</strong> Users are responsible for any taxes, duties, or additional charges imposed by authorities on winnings or payments, as required by Indian law.</p>
              </CardContent>
            </Card>

            {/* 7. Fair Auction Practices and Restrictions */}
            <Card className="bg-white border-red-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100">
                <CardTitle className="text-lg sm:text-xl text-red-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>7. Fair Auction Practices and Restrictions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">7.1 Fair Participation:</strong> Users must participate honestly and fairly, placing bids solely for their own benefit and not on behalf of others, unless explicitly allowed by Dream60.</p>
                <p><strong className="text-purple-800">7.2 Prohibition of Multiple Accounts:</strong> Creating or operating multiple accounts to gain an unfair advantage in auctions is strictly prohibited and may result in immediate termination of all related accounts.</p>
                <p><strong className="text-purple-800">7.3 Ban on Automation:</strong> Use of bots, scripts, or any automated tools to monitor auctions or place bids is forbidden; Dream60 may use technical and manual checks to detect such behavior.</p>
                <p><strong className="text-purple-800">7.4 No Collusion or Bid Rigging:</strong> Users may not collude or coordinate with others to manipulate auction outcomes, including sharing bid strategies or deliberately inflating or suppressing bids.</p>
                <p><strong className="text-purple-800">7.5 System Abuse:</strong> Attempting to hack, disrupt, overload, or exploit bugs or vulnerabilities in the platform is prohibited and may result in legal action in addition to account termination.</p>
                <p><strong className="text-purple-800">7.6 Enforcement Powers:</strong> Dream60 may suspend auctions, cancel bids, block accounts, or modify results if it believes fair-play rules have been violated or the integrity of an auction is compromised.</p>
              </CardContent>
            </Card>

            {/* 8. System Errors, Interruptions, and Auction Cancellation */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <CardTitle className="text-lg sm:text-xl text-blue-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>8. System Errors, Interruptions, and Auction Cancellation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">8.1 User-Side Issues:</strong> Dream60 is not responsible for failures arising from user devices, local networks, or internet connections that prevent timely bid placement or participation.</p>
                <p><strong className="text-purple-800">8.2 Platform-Side Failures:</strong> In case of server downtime, system errors, or platform-side technical failures that significantly affect an auction, Dream60 may cancel, pause, or re-run the auction at its sole discretion.</p>
                <p><strong className="text-purple-800">8.3 Remedies for Cancelled Auctions:</strong> If an auction is cancelled by Dream60 before completion, Dream60 may refund entry fees or offer an alternative solution (such as credit or a replacement auction), but is not obligated to replicate prior bids or rankings.</p>
                <p><strong className="text-purple-800">8.4 Final Decision:</strong> Dream60 has sole authority to decide whether a technical issue has materially affected an auction and what corrective actions are appropriate; such decisions will be final and binding.</p>
              </CardContent>
            </Card>

            {/* 9. User Behaviour and Community Standards */}
            <Card className="bg-white border-yellow-100 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
                <CardTitle className="text-lg sm:text-xl text-yellow-800 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <span>9. User Behaviour and Community Standards</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">9.1 Acceptable Conduct:</strong> Users must use the platform in a lawful and respectful manner and may not engage in harassment, hate speech, defamation, or any abusive conduct toward other users or Dream60 staff.</p>
                <p><strong className="text-purple-800">9.2 Prohibited Content:</strong> Users may not upload or share content that is fraudulent, obscene, infringing, or otherwise inappropriate through platform channels or communication features.</p>
                <p><strong className="text-purple-800">9.3 Fraud and Misuse:</strong> Any suspected fraud, identity theft, or misuse of the platform may result in immediate suspension or termination and reporting to law-enforcement authorities.</p>
                <p><strong className="text-purple-800">9.4 Moderation Rights:</strong> Dream60 may remove content, limit communication features, or restrict access to maintain a safe environment and protect users and the platform.</p>
              </CardContent>
            </Card>

            {/* 10. Intellectual Property and Use of the Platform */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <span>10. Intellectual Property and Use of the Platform</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">10.1 Ownership:</strong> All logos, trademarks, designs, text, graphics, software, and other content on Dream60 are owned or licensed by Dream60 and protected by applicable intellectual property laws.</p>
                <p><strong className="text-purple-800">10.2 Limited License:</strong> Users receive a limited, revocable, non-transferable license to access the platform and participate in auctions for personal use only.</p>
                <p><strong className="text-purple-800">10.3 Restrictions on Use:</strong> Users may not copy, reproduce, modify, distribute, sell, or create derivative works from any part of the platform without prior written consent from Dream60.</p>
                <p><strong className="text-purple-800">10.4 Protection of Rights:</strong> Unauthorized use of Dream60’s intellectual property may lead to immediate account termination and civil or criminal legal action.</p>
              </CardContent>
            </Card>

            {/* 11. Risk, Responsibility, and Limitation of Liability */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-purple-600" />
                  <span>11. Risk, Responsibility, and Limitation of Liability</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">11.1 Auction Risks:</strong> Participation in auctions involves financial risk; users understand and accept that they may lose entry fees and bid amounts without winning any prize.</p>
                <p><strong className="text-purple-800">11.2 User Mistakes:</strong> Dream60 is not responsible for user errors, such as bidding incorrect amounts, missing bidding windows, or failing to complete payments.</p>
                <p><strong className="text-purple-800">11.3 Liability Cap:</strong> Dream60’s total liability for any claim arising from or related to a specific auction is limited to the total amount the user paid to participate in that auction.</p>
                <p><strong className="text-purple-800">11.4 Exclusion of Indirect Damages:</strong> Dream60 will not be liable for indirect, incidental, special, consequential, or punitive damages arising from use of the platform or participation in auctions.</p>
              </CardContent>
            </Card>

            {/* 12. Changes to Terms and Auction Policies */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>12. Changes to Terms and Auction Policies</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">12.1 Right to Modify:</strong> Dream60 may amend, update, or replace these Terms & Conditions and auction rules at any time, and will make the updated version available on the platform.</p>
                <p><strong className="text-purple-800">12.2 Notice of Changes:</strong> Changes may be notified via app notifications, email, or website banners; users are responsible for regularly reviewing the terms.</p>
                <p><strong className="text-purple-800">12.3 Acceptance of Changes:</strong> Continued use of the platform or participation in auctions after changes take effect constitutes acceptance of the revised revised terms.</p>
              </CardContent>
            </Card>

            {/* 13. Disputes, Governing Law, and Contact */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-lg sm:text-xl text-purple-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span>13. Disputes, Governing Law, and Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 text-sm sm:text-base text-purple-700">
                <p><strong className="text-purple-800">13.1 Internal Resolution:</strong> Users should first raise any issues or disputes related to auctions, payments, or account actions with Dream60 customer support through official channels.</p>
                <p><strong className="text-purple-800">13.2 Governing Law:</strong> These terms are governed by the laws of India. Any disputes will be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana.</p>
                <p><strong className="text-purple-800">13.3 Contact for Legal Notices:</strong> Formal legal notices must be sent to support@dream60.com or our registered address: Finpages Tech Private Limited, Hyderabad, Telangana, India.</p>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-purple-800 font-semibold">
                Last updated: December 21, 2025
              </p>
              <p className="text-sm text-purple-600 mt-2">
                For questions about these terms, please contact our support team at support@dream60.com.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
