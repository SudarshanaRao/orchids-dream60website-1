import { ArrowLeft, Clock, Target, Trophy, AlertCircle, Sparkles, IndianRupee, Gift, Users, Timer, Award, ChevronRight, Zap, Shield, UserCheck, LogIn, Eye, CreditCard, Hash, BarChart3, Scale, CheckCircle2, TrendingUp, Lock, Bot, Ban } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

interface NewRulesProps {
  onBack: () => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export function NewRules({ onBack }: NewRulesProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden">
      {/* Header */}
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
              <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-purple-800">
                Dream60 Auction Rules
              </h1>
            </div>
            <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold bg-gradient-to-r from-[#53317B] via-[#6B3FA0] to-[#8456BC] bg-clip-text text-transparent">
                  Dream60
                </h2>
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
          Dream60 Auction Rules
        </motion.h1>

        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">

          {/* Section 1: Overview Banner */}
          <motion.div custom={0} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-br from-[#53317B] via-[#6B3FA0] to-[#8456BC] border-0 shadow-xl text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
              <CardContent className="p-5 sm:p-8 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">1. Overview</h2>
                    <p className="text-purple-200 text-sm">Real-time, structured online auction</p>
                  </div>
                </div>
                <p className="text-purple-100 text-sm sm:text-base leading-relaxed mb-4">
                    Dream60 is a real-time, structured online auction platform where users strategically compete across four timed bidding rounds within 60 minutes to win high-value products.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Timer className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                    <div className="text-lg font-bold">60 min</div>
                    <div className="text-xs text-purple-200">Per Auction</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                    <div className="text-lg font-bold">4</div>
                    <div className="text-xs text-purple-200">Bidding Rounds</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                    <div className="text-lg font-bold">All</div>
                    <div className="text-xs text-purple-200">Players Advance</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                    <Award className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
                    <div className="text-lg font-bold">3</div>
                    <div className="text-xs text-purple-200">Winners</div>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 space-y-1.5">
                  <p className="text-purple-100 text-xs sm:text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" /> Every participant continues through all rounds</p>
                  <p className="text-purple-100 text-xs sm:text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" /> No player is eliminated mid-auction</p>
                  <p className="text-purple-100 text-xs sm:text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" /> Final ranking is determined based on structured bid evaluation</p>
                    <p className="text-purple-100 text-xs sm:text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" /> Timing and bid strategy determine success</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 2: User Registration & Account Access */}
          <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-base sm:text-lg text-purple-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold shrink-0">2</span>
                  <span>User Registration & Account Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-purple-600" />
                      <h4 className="text-purple-800 font-semibold text-sm">Account Creation</h4>
                    </div>
                    <ul className="text-purple-600 text-xs space-y-1">
                      <li>Valid Email Address</li>
                      <li>Mobile Number</li>
                      <li>Secure Password</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-purple-600" />
                      <h4 className="text-purple-800 font-semibold text-sm">OTP Verification</h4>
                    </div>
                    <ul className="text-purple-600 text-xs space-y-1">
                      <li>OTP sent to registered mobile</li>
                      <li>Account activated after verification</li>
                      <li>Unverified accounts cannot participate</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <LogIn className="w-5 h-5 text-purple-600" />
                      <h4 className="text-purple-800 font-semibold text-sm">Login Required</h4>
                    </div>
                    <ul className="text-purple-600 text-xs space-y-1">
                      <li>View live auctions</li>
                      <li>Pay entry fees & place bids</li>
                      <li>Claim prizes</li>
                      <li>Guest access does not allow bidding</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 3: Hourly Auction Participation */}
          <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
                <CardTitle className="text-base sm:text-lg text-blue-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">3</span>
                  <span>Hourly Auction Participation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <p className="text-blue-700 text-sm sm:text-base">
                  Dream60 hosts <strong>hourly auctions</strong>, each with one specific product, a clearly defined prize value, a defined entry fee, and a pre-configured cutoff percentage. Each auction has a unique auction ID and runs independently.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-blue-800 font-semibold text-sm">Entry Fee & Confirmation</div>
                      <ul className="text-blue-600 text-xs space-y-1 mt-1">
                        <li>Select the desired auction</li>
                        <li>Click "Pay Entry Fee" and complete payment</li>
                        <li>Participation is confirmed instantly</li>
                        <li>Eligible to bid in all 4 rounds</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-red-800 font-semibold text-sm">Important</div>
                      <p className="text-red-600 text-xs mt-1">
                        Entry fee is <strong>mandatory</strong> and <strong>non-refundable</strong>. It is set by the company based on the product's worth.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 4: Auction Structure – 4 Progressive Rounds */}
          <motion.div custom={3} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100">
                <CardTitle className="text-base sm:text-lg text-indigo-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold shrink-0">4</span>
                  <span>Auction Structure – 4 Progressive Rounds</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="space-y-3">
                  {[
                    { round: 1, time: '0 – 15 Minutes', box: 'Box 3', label: 'Opening Round', desc: 'All participants place their first bid.' },
                    { round: 2, time: '15 – 30 Minutes', box: 'Box 4', label: 'Second Round', desc: 'Everyone advances. Increase your bid strategically.' },
                    { round: 3, time: '30 – 45 Minutes', box: 'Box 5', label: 'Third Round', desc: 'Build your position for the final round.' },
                    { round: 4, time: '45 – 60 Minutes', box: 'Box 6', label: 'Final Round', desc: 'Winners are decided! Highest bidders win the prize.' },
                  ].map((r) => (
                    <div
                      key={r.round}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        r.round === 4
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-indigo-50/50 border-indigo-100'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm shrink-0 ${
                          r.round === 4
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                        }`}
                      >
                        R{r.round}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${r.round === 4 ? 'text-yellow-800' : 'text-indigo-800'}`}>
                            {r.label}
                          </span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${r.round === 4 ? 'border-yellow-400 text-yellow-700' : 'border-indigo-300 text-indigo-600'}`}>
                            {r.time}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${r.round === 4 ? 'border-yellow-400 text-yellow-700' : 'border-indigo-300 text-indigo-600'}`}>
                            {r.box}
                          </Badge>
                        </div>
                        <p className={`text-xs mt-0.5 ${r.round === 4 ? 'text-yellow-700' : 'text-indigo-600'}`}>
                          {r.desc}
                        </p>
                      </div>
                      {r.round < 4 && <ChevronRight className="w-4 h-4 text-indigo-300 mt-3 shrink-0 hidden sm:block" />}
                      {r.round === 4 && <Trophy className="w-5 h-5 text-yellow-500 mt-2.5 shrink-0" />}
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-semibold text-sm">Every Player Moves Forward</span>
                  </div>
                  <p className="text-green-700 text-xs sm:text-sm">
                    There is <strong>no elimination</strong> between rounds. All participants advance from Round 1 through Round 4. The auction runs for exactly <strong>60 minutes</strong> and completes at the end of the hour at any cost.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 5: Bidding Rules */}
          <motion.div custom={4} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b border-orange-100">
                <CardTitle className="text-base sm:text-lg text-orange-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold shrink-0">5</span>
                  <span>Bidding Rules (No Elimination Model)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
                  <h4 className="text-orange-800 font-semibold text-sm mb-2">One Bid Per Round Rule</h4>
                  <ul className="text-orange-700 text-xs sm:text-sm space-y-1">
                    <li>Each participant can place <strong>only one bid per round</strong>.</li>
                    <li>Once submitted: it <strong>cannot be edited, cancelled, or reduced</strong>.</li>
                      <li>If a user fails to bid in a round: they are marked inactive for that round but remain in the auction. Their cumulative score may be impacted.</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <h4 className="text-red-800 font-semibold text-sm">Important: Budget Your Bids Wisely</h4>
                    </div>
                    <p className="text-red-700 text-xs sm:text-sm">
                      If you exhaust your total bid amount in the early rounds and are unable to meet the <strong>minimum bid criteria</strong> in later rounds, you will <strong>not be able to place bids</strong> in the remaining rounds. Plan your bidding strategy across all 4 rounds accordingly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          {/* Section 6: Progressive Bidding Structure */}
          <motion.div custom={5} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100">
                <CardTitle className="text-base sm:text-lg text-teal-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold shrink-0">6</span>
                  <span>Progressive Bidding Structure</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <p className="text-teal-700 text-sm sm:text-base">
                  Dream60 enforces <strong>mandatory progressive bidding</strong>, <strong>cutoff percentage validation</strong>, and <strong>entry-fee-based increment logic</strong> to ensure structured and meaningful competition.
                </p>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-teal-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                      <h4 className="text-teal-800 font-semibold text-sm">Mandatory Bid Increase</h4>
                    </div>
                    <ul className="text-teal-600 text-xs space-y-1">
                      <li>New bid must be <strong>strictly greater</strong> than your previous bid</li>
                      <li>Equal or lower bids are automatically rejected</li>
                      <li>System prevents invalid submissions</li>
                    </ul>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      <h4 className="text-teal-800 font-semibold text-sm">Cutoff Percentage Rule</h4>
                    </div>
                    <ul className="text-teal-600 text-xs space-y-1">
                      <li>Each auction has a defined cutoff percentage</li>
                      <li>Ensures controlled bid growth</li>
                      <li>Fair escalation & prevention of stagnation</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-teal-800 font-semibold text-sm">Minimum Bid Calculation</h4>
                  <div className="text-teal-700 text-xs sm:text-sm space-y-1.5">
                      <p><strong>Formula 1:</strong> Cutoff % of Highest Previous Round Bid</p>
                    <p><strong>Formula 2:</strong> Previous User Bid + Entry Fee</p>
                    <p>The <strong>higher of the two values</strong> becomes the system minimum.</p>
                  </div>
                    <div className="bg-white rounded-lg p-3 mt-2 border border-teal-100">
                      <h5 className="text-teal-800 font-semibold text-xs mb-1.5">Example:</h5>
                      <div className="text-teal-600 text-xs space-y-0.5">
                        <p>Highest bid in previous round: <strong>Rs.1000</strong></p>
                        <p>Entry fee: <strong>Rs.40</strong></p>
                        <p>Cutoff percentage: <strong>60%</strong></p>
                        <p>Cutoff calculation: 60% of Rs.1000 = <strong>Rs.600</strong></p>
                        <p>Entry rule calculation: Previous user bid + Rs.40</p>
                        <p className="font-semibold text-teal-800 pt-1">Minimum acceptable bid = Higher of the two</p>
                        <p className="text-red-600">Any bid below system minimum is automatically rejected.</p>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 7: Bid Evaluation & Ranking Logic */}
          <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-white border-b border-yellow-100">
                <CardTitle className="text-base sm:text-lg text-yellow-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white text-sm font-bold shrink-0">7</span>
                  <span>Bid Evaluation & Ranking Logic</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <p className="text-yellow-700 text-sm sm:text-base">
                  Since all users move through all rounds, ranking is determined at the end of <strong>Round 4</strong>.
                </p>

                <div className="space-y-3">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                    <h4 className="text-yellow-800 font-semibold text-sm mb-1">Standard Auction (More than 3 participants)</h4>
                    <p className="text-yellow-700 text-xs sm:text-sm">
                      Winners are announced at the end of <strong>Round 4</strong> (the final round). The top 3 highest bidders in Round 4 are ranked as 1st, 2nd, and 3rd winners based on bid amount. If bids are tied, the player with the <strong>higher cumulative bid total</strong> from previous rounds wins.
                    </p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg">
                    <h4 className="text-orange-800 font-semibold text-sm mb-1">Small Auction (3 or fewer participants)</h4>
                    <p className="text-orange-700 text-xs sm:text-sm">
                      If there are <strong>3 or fewer participants</strong>, winners are announced in <strong>Round 1 itself</strong> - no need to wait until Round 4.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                    <h4 className="text-yellow-800 font-semibold text-sm">Cumulative Bid Formula</h4>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-100">
                    <p className="text-yellow-800 font-mono text-sm text-center font-semibold">
                      Cumulative Bid = Sum of all valid bids placed across all 4 rounds
                    </p>
                  </div>
                  <ul className="text-yellow-700 text-xs sm:text-sm space-y-1">
                    <li>Consistency across all rounds matters</li>
                    <li>Strategy across rounds matters</li>
                    <li>Not just final round aggression</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-amber-600" />
                    <h4 className="text-amber-800 font-semibold text-sm">Tie Resolution Logic</h4>
                  </div>
                  <p className="text-amber-700 text-xs sm:text-sm mb-2">If two or more players have the same final round bid:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      <p className="text-amber-700 text-xs sm:text-sm">Compare <strong>cumulative bid totals</strong> from all rounds</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      <p className="text-amber-700 text-xs sm:text-sm"><strong>Higher cumulative total wins</strong></p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      <p className="text-amber-700 text-xs sm:text-sm">If still equal, <strong>earlier timestamp wins</strong> (server time)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 8: Winner Declaration & Prize Claim */}
          <motion.div custom={7} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100">
                <CardTitle className="text-base sm:text-lg text-green-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold shrink-0">8</span>
                  <span>Winner Declaration & Prize Claim</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { place: '1st', color: 'from-yellow-400 to-yellow-500', desc: 'First chance to claim the prize' },
                    { place: '2nd', color: 'from-gray-300 to-gray-400', desc: 'Gets chance if 1st doesn\'t claim' },
                    { place: '3rd', color: 'from-orange-300 to-orange-400', desc: 'Gets chance if 2nd doesn\'t claim' },
                  ].map((w) => (
                    <div key={w.place} className="bg-white border border-purple-100 rounded-lg p-3 text-center shadow-sm">
                      <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${w.color} flex items-center justify-center mb-2`}>
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-purple-800 font-bold text-sm">{w.place} Winner</div>
                      <div className="text-purple-600 text-xs mt-1">{w.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Gift className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-green-800 font-semibold text-sm">Prize Claim Process</h4>
                      <ul className="text-green-700 text-xs sm:text-sm space-y-1.5 mt-1.5 list-disc list-inside">
                        <li>Only Rank 1 initially receives the prize claim option.</li>
                        <li>Rank 1 must pay the <strong>final round bid amount</strong> within the claim window.</li>
                        <li>Receive your Amazon voucher code via email and message within 24 hours.</li>
                        <li>View the code anytime in the <strong>Transactions</strong> page under <strong>Amazon Vouchers</strong>.</li>
                        <li>Voucher is valid for up to <strong>12 months</strong> from distribution.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 font-semibold text-sm">Prize Transfer Rule</span>
                  </div>
                  <ul className="text-red-700 text-xs sm:text-sm space-y-1">
                    <li>If Rank 1 fails to pay within <strong>15 minutes</strong>, the offer moves to Rank 2.</li>
                    <li>If Rank 2 fails, the offer moves to Rank 3.</li>
                    <li>If all fail, the auction closes without a winner.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 9: System Transparency & Automation */}
          <motion.div custom={8} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-white border-b border-cyan-100">
                <CardTitle className="text-base sm:text-lg text-cyan-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600 text-white text-sm font-bold shrink-0">9</span>
                  <span>System Transparency & Automation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: <Zap className="w-5 h-5" />, label: 'Real-time bid validation' },
                    { icon: <Lock className="w-5 h-5" />, label: 'Server-based time locking' },
                    { icon: <BarChart3 className="w-5 h-5" />, label: 'Automated ranking calculation' },
                    { icon: <Eye className="w-5 h-5" />, label: 'Transparent minimum bid display' },
                    { icon: <Shield className="w-5 h-5" />, label: 'No manual interference' },
                    { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Tamper-proof calculations' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-cyan-50 rounded-lg p-3 flex flex-col items-center text-center gap-2">
                      <div className="text-cyan-600">{item.icon}</div>
                      <span className="text-cyan-800 text-xs font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 10: Fair Play & Compliance */}
          <motion.div custom={9} variants={fadeIn} initial="hidden" animate="visible">
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-white border-red-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b border-red-100 py-3 px-4">
                  <CardTitle className="text-sm sm:text-base text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    10. Fair Play & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-red-700 text-xs sm:text-sm space-y-2">
                    <p>Dream60 is a <strong>structured auction platform</strong>, not a lottery or game of chance.</p>
                      <div><strong>Strategic:</strong> Winning depends entirely on strategic bidding</div>
                    <div><strong>No Guarantee:</strong> Entry fee does not guarantee winning</div>
                    <div><strong>Final Bids:</strong> All bids are final and binding</div>
                    <div className="flex items-start gap-1.5"><Ban className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Collusion & manipulation are strictly prohibited</div>
                    <div className="flex items-start gap-1.5"><Bot className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Automated bidding tools are banned</div>
                    <div>Suspicious activity may result in <strong>account suspension</strong></div>
                    <div><strong>Age Requirement:</strong> Indian residents 18+ only</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-100 py-3 px-4">
                  <CardTitle className="text-sm sm:text-base text-green-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    11. Why This Model Is Stronger
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-green-700 text-xs sm:text-sm space-y-2">
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> No sudden elimination</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Higher engagement for full 60 minutes</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Fair progression for all participants</div>
                      <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Strategic layering across rounds</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> More predictable revenue model</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Better legal positioning as a structured auction</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Secured payments via India's trusted gateway (INR)</div>
                    <div className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-600" /> Server-synced timestamps for all bids</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Section 12: Auction Duration */}
          <motion.div custom={10} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b border-purple-100">
                <CardTitle className="text-base sm:text-lg text-purple-800 flex items-center gap-3">
                  <Timer className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>Auction Duration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="bg-purple-50 border-l-4 border-purple-400 p-3 sm:p-4 rounded-r-lg">
                  <p className="text-purple-700 text-sm sm:text-base">
                    Every auction lasts exactly <strong>1 hour</strong>. If an auction starts at 11:00, it will be completed at 12:00. The auction closes at the end of the hour regardless of whether winners have been declared or not. All auction results are finalized within this window.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 12: Auction Flow Summary */}
          <motion.div custom={11} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-white border-purple-200 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-white border-b border-violet-100">
                <CardTitle className="text-base sm:text-lg text-violet-800 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-600 text-white text-sm font-bold shrink-0">12</span>
                  <span>Auction Flow Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                  {[
                    'User registers & verifies account',
                    'User pays entry fee',
                    'Round 1 bid placed',
                    'Round 2 progressive bid',
                    'Round 3 strategic escalation',
                    'Round 4 final bid',
                    'System calculates ranking',
                    'Rank 1 gets prize claim window',
                    'If unpaid, offer shifts sequentially to Rank 2, then Rank 3',
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-violet-50/50">
                      <span className="bg-violet-200 text-violet-800 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-violet-700 text-xs sm:text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div custom={12} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-lg overflow-hidden">
              <CardContent className="p-5 sm:p-6 text-center space-y-3">
                <h3 className="text-lg sm:text-xl font-bold text-purple-800">Ready to Start Winning?</h3>
                <p className="text-sm sm:text-base text-purple-600">
                  Join thousands of Indian players and compete for premium prizes every day!
                </p>
                <Button
                  onClick={onBack}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold px-6 py-2 hover:from-purple-500 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all"
                >
                  Join Current Auction
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
