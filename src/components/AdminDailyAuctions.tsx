import { useState, useEffect } from 'react';
import { Clock, Trophy, IndianRupee, Users, Search, RefreshCw, Calendar } from 'lucide-react';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';
import { toast } from 'sonner';

interface AdminDailyAuctionsProps {
  adminUserId: string;
}

export function AdminDailyAuctions({ adminUserId }: AdminDailyAuctionsProps) {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDailyAuctions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/scheduler/daily-auction?user_id=${adminUserId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setAuctions(data.data.auctions || []);
      }
    } catch (error) {
      console.error('Error fetching daily auctions:', error);
      toast.error('Failed to fetch daily auctions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAuctions();
  }, [adminUserId]);

  const filteredAuctions = auctions.filter(a => 
    a.auctionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.TimeSlot?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-purple-900">Today's Daily Auctions</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or time slot..."
              className="w-full pl-10 pr-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={fetchDailyAuctions}
            disabled={isLoading}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-700"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl h-48 animate-pulse border-2 border-purple-100" />
          ))
        ) : filteredAuctions.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border-2 border-dashed border-purple-200">
            <Calendar className="w-12 h-12 text-purple-200 mx-auto mb-4" />
            <p className="text-purple-600">No auctions found for today</p>
          </div>
        ) : (
          filteredAuctions.map((auction, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md p-5 border-2 border-purple-100 hover:border-purple-300 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-600">{auction.TimeSlot}</p>
                    <h3 className="font-bold text-purple-900">{auction.auctionName}</h3>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  auction.Status === 'LIVE' ? 'bg-green-100 text-green-700' :
                  auction.Status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {auction.Status}
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5" /> Prize Value
                  </span>
                  <span className="font-bold text-purple-900">₹{auction.prizeValue?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Rounds
                  </span>
                  <span className="font-semibold text-purple-700">{auction.roundCount || 4} Rounds</span>
                </div>
                <div className="pt-2 border-t border-purple-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-purple-600">
                    <Users className="w-3.5 h-3.5" />
                    <span>Configured</span>
                  </div>
                  <div className="text-xs font-bold text-purple-900">
                    {auction.EntryFee} Entry
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
