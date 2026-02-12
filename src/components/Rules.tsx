import { ArrowLeft, Clock, Target, Trophy, AlertCircle, Sparkles, IndianRupee, Gift } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';


interface RulesProps {
  onBack: () => void;
}

export function Rules({ onBack }: RulesProps) {
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
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-purple-800">Auction Rules</h1>
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
          Auction Rules
        </motion.h1>
        
        <motion.div 
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
            {/* Introduction */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg relative overflow-hidden">
              <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span>Welcome to Dream60 India</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-700 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                Dream60 is India's premier online auction platform where you compete in real-time for valuable prizes. 
                Our system is transparent, fair, and exclusively uses Indian currency (₹).
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Daily Auctions
                  </div>
                    <div className="text-xs sm:text-sm text-purple-600 space-y-1">
                      <div>• premium hourly Auctions daily</div>
                      <div>• Each auction lasts exactly 60 minutes</div>
                    <div>• 2 entry boxes + 4 live bidding rounds</div>
                  </div>
                </div>
                <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <IndianRupee className="w-4 h-4 mr-1" />
                    Participation
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600 space-y-1">
                      <div>• All transactions strictly in INR (₹)</div>
                      <div>• Entry fees based on product value</div>
                      <div>• Entry fee will company decided</div>
                      <div>• Fast and secure local payments</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* How It Works */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 relative z-10">
              <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span>How It Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-600 text-white">1</Badge>
                    <h3 className="text-purple-800 font-semibold text-sm sm:text-base">Pay Entry Fee</h3>
                  </div>
                        <p className="text-purple-600 text-xs sm:text-sm">
                          Entry fee will company decided based on product worth. Pay to unlock all 4 rounds.
                        </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-600 text-white">2</Badge>
                    <h3 className="text-purple-800 font-semibold text-sm sm:text-base">Bidding Rounds</h3>
                  </div>
                  <p className="text-purple-600 text-xs sm:text-sm">
                    4 rounds open every 15 minutes. All players advance to the next round. Winners are announced in the final round (Round 4). If only 3 participants, winners are announced in Round 1 itself.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <div className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Round Schedule
                </div>
                <div className="text-blue-700 text-xs sm:text-sm space-y-1">
                  <div>• Round 1: Opens immediately after entry payment</div>
                  <div>• Round 2: After 15 minutes • Round 3: After 30 minutes</div>
                  <div>• Round 4: After 45 minutes (Final Round)</div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Key Rules */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 relative z-10">
              <CardTitle className="text-base sm:text-lg md:text-xl text-green-800 flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span>Key Rules</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <h4 className="text-green-800 font-semibold text-sm mb-2">Entry Phase</h4>
                    <div className="text-green-700 text-xs sm:text-sm space-y-1">
                      <div>• Entry fee will company decided</div>
                      <div>• Mandatory to join rounds</div>
                      <div>• Unlocks all 4 bidding rounds</div>
                      <div>• Single payment per box</div>
                    </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                  <h4 className="text-purple-800 font-semibold text-sm mb-2">Bidding Phase</h4>
                  <div className="text-purple-700 text-xs sm:text-sm space-y-1">
                    <div>• Progressive bidding required</div>
                    <div>• One bid per 15-minute round</div>
                    <div>• Highest final round bid wins prize</div>
                    <div>• Non-refundable participation</div>
                  </div>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded mt-3 sm:col-span-2">
                  <h4 className="text-orange-800 font-semibold text-sm mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Elimination Process
                  </h4>
                  <div className="text-orange-700 text-xs sm:text-sm space-y-1">
                    <div>• <strong>After each round</strong>, all players advance to the next round</div>
                    <div>• <strong>All participants</strong> move forward through each round</div>
                    <div>• <strong>Round 1-3:</strong> Place strategic bids to build your position</div>
                    <div>• <strong>Round 4 (Final):</strong> Winners are announced in the final round</div>
                    <div>• <strong>3 or fewer participants?</strong> Winners are announced in Round 1 itself</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <div className="text-red-800 font-semibold text-sm mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Important Transparency Note
                </div>
                  <div className="text-red-700 text-xs sm:text-sm space-y-1">
                    <div>• Entry fees are decided by the company based on product worth</div>
                    <div>• Fees are calibrated against the product market value for fairness</div>
                    <div>• All payments monitored for platform integrity</div>
                    <div>• Indian residents 18+ only</div>
                  </div>
              </div>
            </CardContent>
          </Card>

            {/* Detailed Mechanics */}
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 relative z-10">
              <CardTitle className="text-base sm:text-lg md:text-xl text-blue-800 flex items-center space-x-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span>Detailed Auction Mechanics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Entry Phase */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Entry Phase (Boxes 1 & 2)</h3>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Duration:</strong> Join window opens at the start of each hour.
                  </p>
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Payment:</strong> Entry fee will company decided based on product worth.
                  </p>
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Strategy:</strong> Paying the entry fee unlocks access to bid for higher value prizes in rounds 3-6.
                  </p>
                </div>
              </div>

              {/* Bidding Phase */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Bidding Phase (Boxes 3-6)</h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Round Schedule:</strong> Rounds open every 15 minutes (0, 15, 30, 45 minutes).
                  </p>
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Frequency:</strong> Users can place one bid per box during each 15-minute window.
                  </p>
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Win Condition:</strong> The participant with the highest valid bid at the end of round 4 claims the prize.
                  </p>
                </div>
                
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 sm:p-4 space-y-2 text-xs sm:text-sm mt-3">
                  <h4 className="text-orange-800 font-semibold text-sm mb-2">How Elimination Works</h4>
                    <p className="text-orange-700">
                      <strong className="text-orange-800">Round Ranking:</strong> After each 15-minute round, participants are ranked by their bid amount in that specific round. Bids are separate for each round and NOT cumulative.
                    </p>
                  <p className="text-orange-700">
                    <strong className="text-orange-800">Survival Rule:</strong> All players advance to the next round. Winners are announced in the final round only.
                  </p>
                  <p className="text-orange-700">
                    <strong className="text-orange-800">Strategy Required:</strong> You must strategically increase your bids each round to maintain a top position and avoid elimination.
                  </p>
                    <p className="text-orange-700">
                      <strong className="text-orange-800">Final Showdown:</strong> By Round 4, only the highest bidders remain to compete for the prize.
                    </p>
                      <p className="text-orange-700">
                        <strong className="text-orange-800">Prize Claim:</strong> If the 1st winner fails to claim the prize within the <strong className="text-orange-800">15-minute time limit</strong>, the chance passes to the 2nd winner, and then to the 3rd winner if still unclaimed.
                      </p>
                  </div>
              </div>

                {/* Prize Claim */}
                <div>
                  <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Prize Claim</h3>
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

            {/* Prohibited & Fair Play */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="relative overflow-hidden group">
                <h3 className="text-red-800 font-semibold mb-3 text-sm sm:text-base flex items-center relative z-10 font-medium">
                <AlertCircle className="w-4 h-4 mr-1" />
                Prohibited Actions
              </h3>
              <div className="bg-red-50 border border-red-200 rounded p-3 relative z-10">
                <div className="text-red-700 text-xs space-y-2">
                  <div>• <strong>Multiple Accounts:</strong> Strictly prohibited</div>
                  <div>• <strong>Bot Usage:</strong> Automated bidding systems are banned</div>
                  <div>• <strong>Collusion:</strong> Cooperation between players results in ban</div>
                </div>
              </div>
            </div>

              <div className="relative overflow-hidden group">
                <h3 className="text-green-800 font-semibold mb-3 text-sm sm:text-base flex items-center relative z-10 font-medium">
                <Sparkles className="w-4 h-4 mr-1" />
                Fair Play Guarantee
              </h3>
              <div className="bg-green-50 border border-green-200 rounded p-3 relative z-10">
                <div className="text-green-700 text-xs space-y-2">
                  <div>• <strong>Secured Payments:</strong> via India's trusted payment gateway (INR)</div>
                  <div>• <strong>Timestamp Sync:</strong> All bids recorded by server time</div>
                  <div>• <strong>Zero Fraud:</strong> Advanced detection algorithms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg relative overflow-hidden">
            <CardContent className="p-4 sm:p-6 text-center space-y-3 sm:space-y-4 relative z-10">
              <h3 className="text-lg sm:text-xl font-bold text-purple-800">Ready to Start Winning?</h3>
              <p className="text-sm sm:text-base text-purple-600">
                Participation is easy, fair, and fun. Join thousands of Indian players today!
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
