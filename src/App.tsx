// ✅ Updated initial import statements
import { useState, useEffect } from 'react';

import { Clock } from 'lucide-react';
import { Header } from './components/Header';
import { AuctionGrid } from './components/AuctionGrid';
import { AuctionSchedule } from './components/AuctionSchedule';
import { PrizeShowcase } from './components/PrizeShowcase';
import { Footer } from './components/Footer';
import { TermsAndConditions } from './components/TermsAndConditions';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Support } from './components/Support';
import { Contact } from './components/Contact';
import { Rules } from './components/Rules';
import { Participation } from './components/Participation';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { PaymentSuccess } from './components/PaymentSuccess';
import { PaymentFailure } from './components/PaymentFailure';
import { Leaderboard } from './components/Leaderboard';
import { AccountSettings } from './components/AccountSettings';
import { AuctionHistory } from './components/AuctionHistory';
import { AuctionDetailsPage } from './components/AuctionDetailsPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { AdvertisementPopup } from './components/AdvertisementPopup';
import { toast } from 'sonner';
import { parseAPITimestamp } from './utils/timezone';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Sonner } from '@/components/ui/sonner';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { BrowserRouter } from 'react-router-dom';
import { API_ENDPOINTS } from '@/lib/api-config';


export default function App() {
  const [currentAuction, setCurrentAuction] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEntrySuccess, setShowEntrySuccess] = useState(null);
  const [showEntryFailure, setShowEntryFailure] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [forceRefetchTrigger, setForceRefetchTrigger] = useState(0);

  const handleNavigate = (path) => {
    // Handle navigation logic
  };

  const handlePlaceBid = async (boxId, bidAmount) => {
    // Handle placing bid logic
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const handleEntrySuccess = () => {
    setShowEntrySuccess(null);
  };

  const handleEntryFailure = () => {
    setShowEntryFailure(null);
  };

  const handleRetryPayment = () => {
    // Handle retry payment logic
  };

  useEffect(() => {
    // Initialize auction data and user state
    // This is a placeholder - actual implementation depends on your data fetching logic
  }, []);

  return (
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Header onNavigate={handleNavigate} />

          <main className="container mx-auto px-4 py-8">
            {/* Payment Success Handler */}
            {currentAuction && currentAuction.userHasPaidEntry && (
              <button
                onClick={() => {
                  // ✅ CRITICAL FIX: Trigger IMMEDIATE refresh when payment succeeds
                  console.log('💳 Payment successful - triggering IMMEDIATE auction data refresh');
                  setForceRefetchTrigger(prev => prev + 1);
                }}
              />
            )}

            {/* Auction Grid */}
            <AuctionGrid
              boxes={currentAuction.boxes}
              serverTime={serverTime} // ✅ Pass server time from parent
              onPlaceBid={handlePlaceBid}
              onShowLeaderboard={handleShowLeaderboard}
              userHasPaidEntry={currentAuction.userHasPaidEntry}
              currentUser={currentUser}
              userBidsPerRound={currentAuction.userBidsPerRound}
              userQualificationPerRound={currentAuction.userQualificationPerRound}
              winnersAnnounced={currentAuction.winnersAnnounced}
              isPlacingBid={isPlacingBid}
            />

            {/* Auction Schedule Info */}
            <AuctionSchedule />
          </main>

          <Footer onNavigate={handleNavigate} />

          {/* Modals */}
          {showEntrySuccess && (
            <PaymentSuccess
              entryFee={showEntrySuccess.entryFee}
              boxNumber={showEntrySuccess.boxNumber}
              onClose={handleEntrySuccess}
            />
          )}

          {showEntryFailure && (
            <PaymentFailure
              entryFee={showEntryFailure.entryFee}
              errorMessage={showEntryFailure.errorMessage}
              onClose={handleEntryFailure}
              onRetry={handleRetryPayment}
            />
          )}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}