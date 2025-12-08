import { ArrowLeft, Clock, DollarSign, Target, Trophy, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'motion/react';
import { AnimatedBackground } from './AnimatedBackground';

interface RulesProps {
  onBack: () => void;
}

export function Rules({ onBack }: RulesProps) {
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
            <h1 className="text-2xl font-bold text-purple-800">Game Rules</h1>
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
          {/* Introduction */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl text-purple-800 flex items-center space-x-2">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                <span>Welcome to Dream60</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-purple-700 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                Dream60 is an exciting online auction game where you compete against other players in 60-minute auctions. 
                Each auction features 6 boxes with valuable prizes, and smart bidding strategy is key to winning!
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Quick Overview
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600 space-y-1">
                    <div>• 6 auctions run daily</div>
                    <div>• Each lasts 60 minutes</div>
                    <div>• 2 entry fee boxes + 4 bidding rounds</div>
                  </div>
                </div>
                <div className="bg-white/70 border border-purple-300 rounded-lg p-3">
                  <div className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    Prize Range
                  </div>
                  <div className="text-xs sm:text-sm text-purple-600 space-y-1">
                    <div>• Entry boxes: $500-$1,500</div>
                    <div>• Bidding rounds: $1,000-$5,000+</div>
                    <div>• All prizes in USD</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
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
                    Choose Box 1 or 2 and pay the exact entry fee (₹1000-₹3500). This unlocks all 4 bidding rounds.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-600 text-white">2</Badge>
                    <h3 className="text-purple-800 font-semibold text-sm sm:text-base">Bidding Rounds</h3>
                  </div>
                  <p className="text-purple-600 text-xs sm:text-sm">
                    4 rounds open every 15 minutes. Strategic bidding is key - you can only bid once per interval.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                <div className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Round Schedule
                </div>
                <div className="text-blue-700 text-xs sm:text-sm space-y-1">
                  <div>• Round 1: Opens immediately after entry fee payment</div>
                  <div>• Round 2: After 15 minutes • Round 3: After 30 minutes</div>
                  <div>• Round 4: After 45 minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Rules */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
              <CardTitle className="text-base sm:text-lg md:text-xl text-green-800 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                <span>Key Rules</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                  <h4 className="text-green-800 font-semibold text-sm mb-2">Entry Boxes (1 & 2)</h4>
                  <div className="text-green-700 text-xs sm:text-sm space-y-1">
                    <div>• Random fixed fee ₹1000-₹3500</div>
                    <div>• Must pay exact amount</div>
                    <div>• Unlocks all 4 bidding rounds</div>
                    <div>• Can pay entry fee for both boxes</div>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                  <h4 className="text-purple-800 font-semibold text-sm mb-2">Bidding Rounds (3-6)</h4>
                  <div className="text-purple-700 text-xs sm:text-sm space-y-1">
                    <div>• Min bid: ₹700 (fixed)</div>
                    <div>• Max: 90% of prize value</div>
                    <div>• One bid per 15-minute interval</div>
                    <div>• Highest bid wins the box</div>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                <div className="text-red-800 font-semibold text-sm mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Important Rules
                </div>
                <div className="text-red-700 text-xs sm:text-sm space-y-1">
                  <div>• All payments are final and non-refundable</div>
                  <div>• Must be 18+ years old to participate</div>
                  <div>• One account per person strictly enforced</div>
                  <div>• Winners must claim prizes within 30 days</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Mechanics */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
              <CardTitle className="text-base sm:text-lg md:text-xl text-blue-800 flex items-center space-x-2">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <span>Detailed Game Mechanics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Entry Phase */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Entry Phase (Boxes 1 & 2)</h3>
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Duration:</strong> Available throughout the entire 60-minute auction
                  </p>
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Payment:</strong> Each box displays a random entry fee between ₹1000-₹3500. You must pay the exact amount shown.
                  </p>
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Strategy:</strong> Paying an entry fee unlocks all 4 bidding rounds. You can pay for both entry boxes if desired.
                  </p>
                  <p className="text-purple-700">
                    <strong className="text-purple-800">Timing:</strong> Round 1 opens immediately after your first entry fee payment.
                  </p>
                </div>
              </div>

              {/* Bidding Phase */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Bidding Phase (Boxes 3-6)</h3>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Round Schedule:</strong> Rounds open every 15 minutes (0, 15, 30, 45 minutes)
                  </p>
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Bidding Limits:</strong> Minimum ₹700, Maximum 90% of the prize value
                  </p>
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Frequency:</strong> You can place one bid per box every 15 minutes
                  </p>
                  <p className="text-blue-700">
                    <strong className="text-blue-800">Win Condition:</strong> Highest bid when the round closes wins the prize
                  </p>
                </div>
              </div>

              {/* Prize Distribution */}
              <div>
                <h3 className="text-purple-800 font-semibold mb-3 text-sm sm:text-base">Prize Distribution & Values</h3>
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2">Entry Boxes</h4>
                    <div className="text-yellow-700 text-xs space-y-1">
                      <div>• Prize Value: $500 - $1,500</div>
                      <div>• Winner: Pays entry fee</div>
                      <div>• Examples: Electronics, Gift Cards</div>
                    </div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                    <h4 className="text-green-800 font-semibold text-xs sm:text-sm mb-2">Bidding Rounds</h4>
                    <div className="text-green-700 text-xs space-y-1">
                      <div>• Prize Value: $1,000 - $5,000+</div>
                      <div>• Winner: Highest bidder</div>
                      <div>• Examples: Laptops, Gaming Rigs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prohibited & Fair Play */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-red-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Prohibited Actions
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="text-red-700 text-xs space-y-2">
                      <div>• <strong>Multiple Accounts:</strong> Strictly prohibited</div>
                      <div>• <strong>Bid Manipulation:</strong> No collusion allowed</div>
                      <div>• <strong>Bot Usage:</strong> Automated bidding banned</div>
                      <div>• <strong>Fraud:</strong> Zero tolerance policy</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-green-800 font-semibold mb-3 text-sm sm:text-base flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Fair Play Guarantee
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="text-green-700 text-xs space-y-2">
                      <div>• <strong>Random Fees:</strong> Certified algorithms</div>
                      <div>• <strong>Real-time Bids:</strong> Timestamp verification</div>
                      <div>• <strong>Transparent:</strong> All timers synchronized</div>
                      <div>• <strong>Anti-Fraud:</strong> Advanced detection systems</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Tips */}
          <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
              <CardTitle className="text-base sm:text-lg md:text-xl text-yellow-800 flex items-center space-x-2">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                <span>Winning Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded">
                  <h4 className="text-purple-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Entry Strategy
                  </h4>
                  <div className="text-purple-700 text-xs space-y-1">
                    <div>• Compare entry fees and choose wisely</div>
                    <div>• Pay early to maximize bidding time</div>
                    <div>• Consider paying for both boxes</div>
                  </div>
                </div>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <h4 className="text-blue-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Bidding Strategy
                  </h4>
                  <div className="text-blue-700 text-xs space-y-1">
                    <div>• Start with conservative bids</div>
                    <div>• Save aggressive bids for final rounds</div>
                    <div>• Monitor other players' patterns</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <h4 className="text-yellow-800 font-semibold text-xs sm:text-sm mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Timing Tips
                </h4>
                <div className="text-yellow-700 text-xs">
                  Watch the countdown timers carefully. Bid near the end of each round for maximum impact, 
                  but remember you can only bid once per 15-minute interval.
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}