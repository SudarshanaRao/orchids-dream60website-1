import { ArrowLeft, Clock, Shield, Star, Play, CreditCard, TrendingUp, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';


interface ParticipationProps {
  onBack: () => void;
}

export function Participation({ onBack }: ParticipationProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
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
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-purple-800">How to Participate</h1>
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
        <motion.h1 
          className="sm:hidden text-2xl font-bold text-purple-800 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          How to Participate
        </motion.h1>

          <motion.div 
            className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Getting Started */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg relative overflow-hidden group">
              <CardHeader className="relative z-10 font-medium">
                <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <span>Getting Started with Dream60 India</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-purple-700 space-y-3 sm:space-y-4 text-sm sm:text-base relative z-10">
                <p>
                  Welcome to Dream60, India's ultimate online auction experience! Our unique participation system 
                  is designed to be transparent, fair, and based on the specific product value. 
                  Pay only when you decide to join an auction.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                    <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Indian Focused Platform
                    </div>
                    <div className="text-purple-600 text-xs space-y-1">
                      <div>• Only Indian currency (₹ INR) accepted</div>
                      <div>• Localized support and fulfillment</div>
                        <div>• premium hourly Auctions daily</div>
                      <div>• Real-time competitive bidding</div>
                    </div>
                  </div>
                  <div className="bg-white/70 border border-green-300 rounded-lg p-3">
                    <div className="text-green-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-1" />
                      Product-Based Entry Fees
                    </div>
                        <div className="text-green-600 text-xs space-y-1">
                          <div>• Entry fee varies based on product value</div>
                          <div>• Entry fee will company decided based on product worth</div>
                          <div>• Full disclosure of fees upon auction opening</div>
                        </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Tutorial */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 relative z-10">
                <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  <span>Watch: How to Participate in Dream60</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-purple-50 shadow-inner">
                  <iframe 
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/qc73f7dw6Ds?si=znvGtlL8xzjtGqaD" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="text-purple-600 text-xs sm:text-sm mt-3 text-center">
                  Watch this tutorial to learn how to join and win amazing prizes!
                </p>
              </CardContent>
            </Card>

            {/* Complete Participation Guide */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 relative z-10">
                <CardTitle className="text-base sm:text-lg md:text-xl text-blue-800">Complete Participation Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 relative z-10">
                {/* Step 1: Account Setup */}
                <div>
                  <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
                    Account Setup
                  </h3>
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4">
                    <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2">Create Your Account</h4>
                        <div className="text-purple-700 text-xs space-y-1">
                          <div>• Provide valid Indian mobile number</div>
                          <div>• Choose secure password</div>
                          <div>• Verify via mobile OTP</div>
                          <div>• Complete basic profile info</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2">Eligibility</h4>
                        <div className="text-purple-700 text-xs space-y-1">
                          <div>• Must be 18+ years old</div>
                          <div>• Resident of India</div>
                          <div>• Valid ID proof for verification</div>
                          <div>• Only one account per natural person</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Understanding Auctions */}
                <div>
                  <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                    How Auctions Work
                  </h3>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
                    <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Timing
                        </h4>
                        <div className="text-blue-700 text-xs space-y-1">
                            <div>• premium hourly Auctions daily</div>
                          <div>• Duration: 60 minutes</div>
                          <div>• Slots starting every hour</div>
                          <div>• No extensions permitted</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <Gift className="w-4 h-4 mr-1" />
                          Participation Fees
                        </h4>
                          <div className="text-blue-700 text-xs space-y-1">
                            <div>• Entry fee is product-based</div>
                            <div>• Entry fee will company decided</div>
                            <div>• Paid only when you join</div>
                            <div>• Non-refundable in all cases</div>
                          </div>
                      </div>
                      <div>
                        <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Winners
                        </h4>
                        <div className="text-blue-700 text-xs space-y-1">
                          <div>• Highest bidder in final round wins</div>
                          <div>• Prize value delivered via voucher</div>
                          <div>• Verified Indian winners only</div>
                          <div>• Fast and secure prize claim</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3 sm:p-4 mt-3">
                    <h4 className="text-orange-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      Elimination Process
                    </h4>
                      <div className="text-orange-700 text-xs space-y-1">
                        <div>• <strong>Progressive rounds:</strong> All players advance to the next round.</div>
                        <div>• <strong>Separate Bids:</strong> Bids for each round are separate and NOT cumulative.</div>
                        <div>• <strong>All players</strong> move forward through each round</div>
                        <div>• <strong>Winners announced</strong> in the final round (Round 4) only</div>
                        <div>• <strong>3 or fewer participants?</strong> Winners are announced in Round 1 itself</div>
                        <div>• <strong>Stay competitive:</strong> Strategically place your bids each round to maximize your position</div>
                      </div>
                  </div>
                </div>

                {/* Step 3: Payment Methods */}
                <div>
                  <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
                    Payment Methods
                  </h3>
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4">
                    <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <h4 className="text-green-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-1" />
                          Accepted via India's trusted payment gateway
                        </h4>
                        <div className="text-green-700 text-xs space-y-1">
                          <div>• UPI (Google Pay, PhonePe, Paytm)</div>
                          <div>• Net Banking (All Indian banks)</div>
                          <div>• Credit/Debit Cards (Visa, MC, RuPay)</div>
                          <div>• Mobile Wallets</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-green-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          Transactions in INR
                        </h4>
                        <div className="text-green-700 text-xs space-y-1">
                          <div>• All fees and bids processed in ₹</div>
                          <div>• Secure, encrypted processing</div>
                          <div>• Instant payment verification</div>
                          <div>• Detailed transaction history</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Strategic Playing */}
                <div>
                  <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</span>
                    Strategic Participation
                  </h3>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
                    <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Entry Strategy
                        </h4>
                        <div className="text-yellow-700 text-xs space-y-1">
                          <div>• Review the entry fee for each box</div>
                          <div>• Pay within the first 15 mins to join</div>
                          <div>• Choose based on prize preference</div>
                          <div>• Monitor current participant levels</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Bidding Rounds
                        </h4>
                        <div className="text-yellow-700 text-xs space-y-1">
                          <div>• 4 bidding rounds open sequentially</div>
                          <div>• Raise your bid strategically each round</div>
                          <div>• Maintain your position through all rounds</div>
                          <div>• Final round bid determines winner</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
                      <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-1 flex items-center relative z-10 font-bold">
                        <Star className="w-4 h-4 mr-1" />
                        Pro Tip
                      </h4>
                      <div className="text-yellow-700 text-xs relative z-10">
                          Entry fee will company decided based on product worth. Always check the fee on the auction box before joining!
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Step 5: Prize Claim */}
                  <div>
                    <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                      <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">5</span>
                      Prize Claim
                    </h3>
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4">
                      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Gift className="w-4 h-4 text-purple-600" />
                            <h4 className="text-purple-800 font-semibold text-xs sm:text-sm">How to claim your voucher</h4>
                          </div>
                          <div className="text-purple-700 text-xs space-y-2">
                            <p>• After paying the final bid amount, you will receive an email and message with your Amazon voucher code within 24 hours.</p>
                            <p>• You can also view the code in the <strong className="text-purple-800">Transactions</strong> page under the <strong className="text-purple-800">Amazon Vouchers</strong> section.</p>
                            <p>• The voucher is valid for up to <strong className="text-purple-800">12 months</strong> from the date of distribution.</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            <h4 className="text-purple-800 font-semibold text-xs sm:text-sm">Claim Window</h4>
                          </div>
                          <div className="text-purple-700 text-xs space-y-2">
                            <p>• <strong className="text-purple-800">Only 15-min claim window applies.</strong></p>
                            <p>• Notification sent immediately upon winning.</p>
                            <p>• Pay final bid amount within 15 mins to claim.</p>
                            <p>• Verified identity required for distribution.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg relative overflow-hidden group">
              <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4 relative z-10 font-medium">
                <h3 className="text-lg sm:text-xl font-bold text-purple-800">Ready to Start Winning?</h3>
                <p className="text-sm sm:text-base text-purple-600">
                  Join India's most exciting auction platform today!
                </p>
                <Button 
                  onClick={onBack}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-6 py-2 hover:from-purple-500 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
                >
                  🚀 Join Current Auction
                </Button>
              </CardContent>
            </Card>
          </motion.div>
      </main>
    </div>
  );
}
