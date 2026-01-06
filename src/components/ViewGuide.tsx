import { ArrowLeft, BookOpen, ListChecks, Clock, ShieldCheck, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SupportCenterHeader } from './SupportCenterHeader';

interface ViewGuideProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function ViewGuide({ onBack, onNavigate }: ViewGuideProps) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('support');
      window.history.pushState({}, '', '/support');
    } else {
      onBack();
    }
  };
  const steps = [
    {
      title: 'Join an auction',
      detail: 'Pick a time slot from Today’s Schedule. Auction numbers are fixed for the day.',
      icon: <Clock className="w-5 h-5" />,
      badge: 'Schedule',
    },
    {
      title: 'Pay entry fee',
      detail: 'Entry fee is mandatory before Round 1. Once paid, you can bid in every round.',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Entry',
    },
    {
      title: 'Bid once per round',
      detail: 'Four bidding rounds open every 15 minutes. Raise strategically; small bumps may not hold.',
      icon: <ListChecks className="w-5 h-5" />,
      badge: 'Bidding',
    },
    {
      title: 'Win & claim',
      detail: 'Highest final bid wins. Pay only your last-round bid to claim and receive the full product worth as an Amazon voucher.',
      icon: <Trophy className="w-5 h-5" />,
      badge: 'Claim',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      <SupportCenterHeader
        title="Dream60 Guide"
        icon={<BookOpen className="w-6 h-6" />}
        onBack={handleBack}
        backLabel="Back to Support"
      />
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <Card className="border-2 border-purple-200/70 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 text-white p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Dream60 Guide
            </CardTitle>
            <p className="text-sm text-white/80 mt-1">Step-by-step instructions to play, bid, and claim.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            {steps.map((step, idx) => (
              <Card key={step.title} className="border border-purple-100 bg-white/90 shadow-sm">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border border-purple-200">Step {idx + 1}</Badge>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200">{step.badge}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-purple-900">{step.title}</h3>
                    <p className="text-sm text-purple-700 leading-relaxed">{step.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
