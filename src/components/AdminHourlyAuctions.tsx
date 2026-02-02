import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, IndianRupee, Users, Search, RefreshCw, XCircle, AlertCircle, ShieldAlert, CheckCircle2, PlayCircle } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface AdminHourlyAuctionsProps {
  adminUserId: string;
}

export function AdminHourlyAuctions({ adminUserId }: AdminHourlyAuctionsProps) {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverTime, setServerTime] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('live');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [auctionToCancel, setAuctionToCancel] = useState<any>(null);

  const fetchHourlyAuctions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scheduler/hourly-auctions?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setAuctions(data.data || []);
      }
      
      const timeRes = await fetch(`${API_BASE}/utility/server-time`);
      const timeData = await timeRes.json();
      if (timeData.success) {
        setServerTime(timeData.data);
      }
    } catch (error) {
      console.error('Error fetching hourly auctions:', error);
      toast.error('Failed to fetch hourly auctions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHourlyAuctions();
    const interval = setInterval(() => {
      fetchHourlyAuctions();
    }, 30000);
    return () => clearInterval(interval);
  }, [adminUserId]);

  const handleCancelAuction = async () => {
    if (!auctionToCancel) return;

    try {
      const response = await fetch(`${API_BASE}/admin/hourly-auctions/${auctionToCancel.hourlyAuctionId}/cancel?user_id=${adminUserId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Auction cancelled and refunds initiated');
        setShowCancelModal(false);
        setAuctionToCancel(null);
        fetchHourlyAuctions();
      } else {
        toast.error(data.message || 'Failed to cancel auction');
      }
    } catch (error) {
      console.error('Error cancelling auction:', error);
      toast.error('Error cancelling auction');
    }
  };

  const canCancel = (auction: any) => {
    if (auction.Status === 'CANCELLED') return false;
    if (auction.Status === 'COMPLETED') return false;
    if (auction.Status === 'UPCOMING') return true;
    
    // If LIVE, check if within 12 minutes
    if (auction.Status === 'LIVE' && serverTime) {
      const [h, m] = auction.TimeSlot.split(':').map(Number);
      const auctionStartTime = new Date(serverTime.timestamp);
      auctionStartTime.setUTCHours(h, m, 0, 0);
      
      const now = serverTime.timestamp;
      const diffMinutes = (now - auctionStartTime.getTime()) / (1000 * 60);
      
      return diffMinutes <= 12;
    }
    
    return false;
  };

  const filteredAuctions = useMemo(() => {
    return auctions.filter(a => {
      const matchesSearch = a.auctionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           a.TimeSlot?.includes(searchTerm);
      
      if (!matchesSearch) return false;

      if (activeTab === 'all') return true;
      if (activeTab === 'live') return a.Status === 'LIVE';
      if (activeTab === 'upcoming') return a.Status === 'UPCOMING';
      if (activeTab === 'completed') return a.Status === 'COMPLETED';
      if (activeTab === 'cancelled') return a.Status === 'CANCELLED';
      
      return true;
    }).sort((a, b) => a.TimeSlot.localeCompare(b.TimeSlot));
  }, [auctions, searchTerm, activeTab]);

  const stats = useMemo(() => ({
    live: auctions.filter(a => a.Status === 'LIVE').length,
    upcoming: auctions.filter(a => a.Status === 'UPCOMING').length,
    completed: auctions.filter(a => a.Status === 'COMPLETED').length,
    cancelled: auctions.filter(a => a.Status === 'CANCELLED').length,
    all: auctions.length
  }), [auctions]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-purple-900">Today's Hourly Slots</h2>
            <p className="text-xs text-purple-600">Manage and monitor daily auction operations</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or time..."
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={fetchHourlyAuctions}
            disabled={isLoading}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700 border-2 border-purple-100"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-purple-50 p-1 rounded-xl border border-purple-100">
              <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                <PlayCircle className="w-4 h-4 mr-2 text-green-600" />
                Live ({stats.live})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-2 text-purple-600" />
                Done ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                Cancelled ({stats.cancelled})
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm">
                All ({stats.all})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && auctions.length === 0 ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl h-48 animate-pulse border-2 border-purple-100" />
          ))
        ) : filteredAuctions.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-purple-200">
            <AlertCircle className="w-12 h-12 text-purple-200 mx-auto mb-3" />
            <p className="text-purple-600 font-medium">No auctions found in this category</p>
          </div>
        ) : filteredAuctions.map((auction, idx) => {
          const cancelAvailable = canCancel(auction);
          return (
            <div key={idx} className={`bg-white rounded-xl shadow-md p-5 border-2 transition-all hover:shadow-lg ${
              auction.Status === 'CANCELLED' ? 'border-red-200 bg-red-50/30' : 
              auction.Status === 'LIVE' ? 'border-green-300 shadow-green-50 ring-2 ring-green-100 ring-offset-2' : 
              auction.Status === 'COMPLETED' ? 'border-purple-100 opacity-90' :
              'border-purple-100'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    auction.Status === 'CANCELLED' ? 'bg-red-100' : 
                    auction.Status === 'LIVE' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      auction.Status === 'CANCELLED' ? 'text-red-700' : 
                      auction.Status === 'LIVE' ? 'text-green-700' :
                      'text-purple-700'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-600">{auction.TimeSlot}</p>
                    <h3 className="font-black text-purple-900 truncate max-w-[180px]" title={auction.auctionName}>
                      {auction.auctionName}
                    </h3>
                  </div>
                </div>
                <Badge className={`border uppercase text-[10px] font-black ${
                  auction.Status === 'LIVE' ? 'bg-green-100 text-green-700 border-green-200' :
                  auction.Status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' :
                  auction.Status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {auction.Status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                    <span className="text-[10px] text-purple-600 uppercase font-bold block mb-1">Participants</span>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-700" />
                      <span className="font-black text-purple-900">{auction.participants?.length || 0}</span>
                    </div>
                  </div>
                  <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                    <span className="text-[10px] text-purple-600 uppercase font-bold block mb-1">Current Round</span>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-purple-700" />
                      <span className="font-black text-purple-900">{auction.currentRound || 1} / 4</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  <span className="text-[10px] text-amber-700 uppercase font-bold block mb-1">Prize Value</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3 text-amber-700" />
                    <span className="font-black text-amber-900">₹{auction.prizeValue?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-purple-100">
                  {auction.Status === 'CANCELLED' ? (
                    <div className="flex items-center gap-2 text-red-600 text-[10px] font-black justify-center bg-red-100/50 py-2 rounded-lg border border-red-200">
                      <ShieldAlert className="w-4 h-4" />
                      CANCELLED & REFUNDED
                    </div>
                    ) : cancelAvailable ? (
                      <button
                        onClick={() => {
                          setAuctionToCancel(auction);
                          setShowCancelModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-black text-xs transition-all shadow-md active:scale-95 uppercase tracking-wider"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Auction
                      </button>
                    ) : auction.Status === 'COMPLETED' ? (
                    <div className="text-center text-[10px] text-green-600 font-black flex items-center justify-center gap-1 bg-green-50 py-2 rounded-lg border border-green-100">
                      <CheckCircle2 className="w-4 h-4" />
                      AUCTION COMPLETED
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-gray-400 font-bold flex items-center justify-center gap-1 py-2">
                      <AlertCircle className="w-3 h-3" />
                      Cancellation window closed
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCancelModal && auctionToCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-red-100"
            >
              <div className="bg-red-50 p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50">
                  <ShieldAlert className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-black text-red-900 mb-2">Cancel Auction?</h3>
                <p className="text-red-700 font-medium leading-relaxed">
                  Are you sure you want to cancel the <span className="font-black underline">"{auctionToCancel.auctionName}"</span> auction at <span className="font-black">{auctionToCancel.TimeSlot}</span>?
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 space-y-3">
                  <div className="flex items-center gap-3 text-red-800">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold">All {auctionToCancel.participants?.length || 0} participants will be refunded</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-800">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold">Slot will be locked and marked as cancelled</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-800">
                    <CheckCircle2 className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-bold">Push notifications will be sent to players</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setAuctionToCancel(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all active:scale-95"
                  >
                    No, Keep It
                  </button>
                  <button
                    onClick={handleCancelAuction}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 active:scale-95"
                  >
                    Yes, Cancel
                  </button>
                </div>
                
                <p className="text-[10px] text-center text-red-400 font-bold uppercase tracking-widest">
                  This action cannot be undone
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

