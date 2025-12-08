import { ArrowLeft, Clock, Shield, Star, Play, CreditCard, TrendingUp, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';

interface ParticipationProps {
  onBack: () => void;
}

export function Participation({ onBack }: ParticipationProps) {
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
            <h1 className="text-2xl font-bold text-purple-800">How to Participate</h1>
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
          {/* Getting Started */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span>Getting Started with Dream60</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-700 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                Welcome to Dream60, the ultimate online auction experience! Our unique pay-as-you-go system 
                means you only pay when you decide to participate. No subscriptions, no pre-funding required.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    What Makes Us Special
                  </div>
                  <div className="text-purple-600 text-xs space-y-1">
                    <div>• No subscription fees or monthly charges</div>
                    <div>• Pay only when you want to participate</div>
                    <div>• 6 auctions daily with varying prizes</div>
                    <div>• Real-time competitive bidding</div>
                  </div>
                </div>
                <div className="bg-white/70 border border-green-300 rounded-lg p-3">
                  <div className="text-green-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Budget Planning
                  </div>
                  <div className="text-green-600 text-xs space-y-1">
                    <div>• Entry fees: ₹1000-₹3500 per box</div>
                    <div>• Minimum bids: ₹700 per round</div>
                    <div>• Suggested budget: ₹3500-₹10,500</div>
                    <div>• Set spending limits before you start</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Tutorial */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
              <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span>Watch: How to Play Dream60</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-purple-50 shadow-inner">
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/i4SMEaGDNq0?si=QKecVGKIUAjHk9Ob" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                ></iframe>
              </div>
              <p className="text-purple-600 text-xs sm:text-sm mt-3 text-center">
                Watch this quick tutorial to learn how to participate and win amazing prizes!
              </p>
            </CardContent>
          </Card>

          {/* Complete Participation Guide */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <CardTitle className="text-base sm:text-lg md:text-xl text-blue-800">Complete Participation Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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
                        <div>• Provide valid email address</div>
                        <div>• Choose secure password</div>
                        <div>• Verify email confirmation</div>
                        <div>• Complete profile setup</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2">Identity Verification</h4>
                      <div className="text-purple-700 text-xs space-y-1">
                        <div>• Must be 18+ years old</div>
                        <div>• Valid government ID required</div>
                        <div>• Address verification</div>
                        <div>• One account per person limit</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Understanding Auctions */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                  Understanding Our Auction System
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4">
                  <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Timing
                      </h4>
                      <div className="text-blue-700 text-xs space-y-1">
                        <div>• 6 auctions per day</div>
                        <div>• Each lasts exactly 60 minutes</div>
                        <div>• Fixed start times</div>
                        <div>• No extensions</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        Box Types
                      </h4>
                      <div className="text-blue-700 text-xs space-y-1">
                        <div>• 2 Entry boxes (pay fixed fee)</div>
                        <div>• 4 Bidding rounds (competitive)</div>
                        <div>• Different prize values</div>
                        <div>• Independent winners</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Prizes
                      </h4>
                      <div className="text-blue-700 text-xs space-y-1">
                        <div>• Electronics & tech</div>
                        <div>• Gift cards & vouchers</div>
                        <div>• Cash prizes</div>
                        <div>• Luxury items</div>
                      </div>
                    </div>
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
                        Accepted Payment Methods
                      </h4>
                      <div className="text-green-700 text-xs space-y-1">
                        <div>• Major Credit Cards (Visa, MasterCard, Amex)</div>
                        <div>• Debit Cards with Visa/MC logo</div>
                        <div>• PayPal (verified accounts only)</div>
                        <div>• Apple Pay & Google Pay</div>
                        <div>• Bank transfers (24-48hr processing)</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-green-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Payment Security
                      </h4>
                      <div className="text-green-700 text-xs space-y-1">
                        <div>• SSL 256-bit encryption</div>
                        <div>• PCI DSS compliant processing</div>
                        <div>• No card data stored on servers</div>
                        <div>• Fraud protection systems</div>
                        <div>• Instant payment verification</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Strategic Playing */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">4</span>
                  Strategic Playing
                </h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4">
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Entry Strategy
                      </h4>
                      <div className="text-yellow-700 text-xs space-y-1">
                        <div>• Compare both entry box fees</div>
                        <div>• Pay early to maximize bidding time</div>
                        <div>• Consider prize-to-fee ratio</div>
                        <div>• Monitor competition levels</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        Bidding Strategy
                      </h4>
                      <div className="text-yellow-700 text-xs space-y-1">
                        <div>• Track other players' patterns</div>
                        <div>• Bid conservatively early</div>
                        <div>• Save aggressive bids for finals</div>
                        <div>• Use 15-minute intervals wisely</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mt-3">
                    <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-1 flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Pro Tips
                    </h4>
                    <div className="text-yellow-700 text-xs">
                      Start with lower-value auctions to learn the dynamics. Set a budget before you begin 
                      and stick to it. Remember: highest bid wins, but timing your bids strategically 
                      within each 15-minute window can make the difference.
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5: Prize Collection */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">5</span>
                  Prize Collection & Delivery
                </h3>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4">
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        Winning Process
                      </h4>
                      <div className="text-purple-700 text-xs space-y-1">
                        <div>• Winners notified immediately</div>
                        <div>• Confirmation email sent</div>
                        <div>• Prize claim window: 30 days</div>
                        <div>• Address verification required</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Delivery Details
                      </h4>
                      <div className="text-purple-700 text-xs space-y-1">
                        <div>• Free shipping worldwide</div>
                        <div>• Processing: 2-3 business days</div>
                        <div>• Delivery: 7-14 business days</div>
                        <div>• Tracking information provided</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Tips */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-base sm:text-lg text-purple-800 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>Daily Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm bg-purple-50 p-2 rounded">
                    <span className="text-purple-800 font-semibold">8:00 AM</span>
                    <span className="text-purple-600">Morning ($500-$1,500)</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm bg-purple-50 p-2 rounded">
                    <span className="text-purple-800 font-semibold">12:00 PM</span>
                    <span className="text-purple-600">Lunch ($800-$2,000)</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm bg-purple-50 p-2 rounded">
                    <span className="text-purple-800 font-semibold">6:00 PM</span>
                    <span className="text-purple-600">Prime ($2,000-$5,000)</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm bg-purple-50 p-2 rounded">
                    <span className="text-purple-800 font-semibold">11:00 PM</span>
                    <span className="text-purple-600">Night ($600-$1,800)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="text-base sm:text-lg text-green-800 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Security & Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <div className="bg-green-50 border-l-4 border-green-400 rounded p-3">
                  <div className="text-green-800 font-semibold text-xs sm:text-sm mb-1">Security</div>
                  <div className="text-green-700 text-xs">
                    Bank-level encryption • 2FA available • Licensed platform
                  </div>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 rounded p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-1">Pro Tips</div>
                  <div className="text-purple-700 text-xs">
                    Start small • Time your bids • Monitor patterns • Be patient
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-bold text-purple-800">Ready to Start Winning?</h3>
              <p className="text-sm sm:text-base text-purple-600">
                Join thousands of players in the most exciting online auction game!
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