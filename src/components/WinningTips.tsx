import { ArrowLeft, Lightbulb, Target, Timer, ShieldCheck, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SupportCenterHeader } from './SupportCenterHeader';

interface WinningTipsProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function WinningTips({ onBack, onNavigate }: WinningTipsProps) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('support');
      window.history.pushState({}, '', '/support');
    } else {
      onBack();
    }
  };
  const tips = [
    {
      title: 'Pay entry early',
      description: 'Entry fee is required before Round 1. Join early so you can bid in all four rounds.',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Entry',
    },
    {
      title: 'Treat Round 4 as final',
      description: 'Your last-round bid is the amount you pay to claim. Bid confidently but within budget.',
      icon: <Target className="w-5 h-5" />,
      badge: 'Final Bid',
    },
    {
      title: 'Watch time slots',
      description: 'Auctions are hourly with fixed numbers. Plan which slots you’ll play instead of reacting late.',
      icon: <Timer className="w-5 h-5" />,
      badge: 'Schedule',
    },
    {
      title: 'Aim for value spread',
      description: 'Compare prize worth vs. current bid trends. Higher value prizes are best when bids stay low.',
      icon: <Gift className="w-5 h-5" />,
      badge: 'Value',
    },
    {
      title: 'One bid per round',
      description: 'Use each round to move strategically upward; avoid tiny increments that won’t hold.',
      icon: <Lightbulb className="w-5 h-5" />,
      badge: 'Rounds',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <SupportCenterHeader
        title="Winning Tips"
        icon={<Lightbulb className="w-6 h-6" />}
        onBack={handleBack}
        backLabel="Back to Support"
      />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <Card className="border-2 border-purple-200/70 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6" /> Winning Tips
            </CardTitle>
            <p className="text-sm text-white/80 mt-1">Practical ways to increase your odds while keeping spend in control.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {tips.map((tip) => (
              <Card key={tip.title} className="border border-purple-100 bg-white/90 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                      {tip.icon}
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-200">{tip.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900">{tip.title}</h3>
                  <p className="text-sm text-purple-700 leading-relaxed">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
