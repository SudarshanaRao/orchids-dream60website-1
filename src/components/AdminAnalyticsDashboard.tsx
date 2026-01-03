import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  date: string;
  dateISO: string;
  currentTime: string;
  currentTimeISO: string;
  currentTimeSlot: string;
  fetchedAt: string;
  isToday: boolean;
  schedulerDataIncluded?: boolean;
  summary: {
    totalAuctions: number;
    liveAuctions: number;
    completedAuctions: number;
    upcomingAuctions: number;
    uniqueParticipants: number;
    totalParticipations: number;
    totalClaimed: number;
    totalPending: number;
    totalExpired: number;
    totalEntryFees: number;
    totalPrizeValue: number;
    totalClaimedValue: number;
  };
  statusDistribution: {
    live: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
  claimStatusDistribution: {
    claimed: number;
    pending: number;
    expired: number;
    notApplicable: number;
  };
  auctionDetails: Array<{
    auctionId: string;
    auctionCode: string;
    auctionName: string;
    timeSlot: string;
    status: string;
    dbStatus?: string;
    prizeValue: number;
    participantCount: number;
    currentRound: number;
    totalRounds: number;
    winnersCount: number;
    claimedCount: number;
    totalEntryFees: number;
    fromScheduler?: boolean;
    winners: Array<{
      rank: number;
      username: string;
      prizeAmount: number;
      claimStatus: string;
      claimedAt: string | null;
    }>;
  }>;
  last7DaysData: Array<{
    date: string;
    dateISO?: string;
    dayName: string;
    participants: number;
    claimed: number;
    revenue: number;
  }>;
  upcomingAuctionsList?: Array<{
    auctionId: string;
    auctionCode: string;
    auctionName: string;
    timeSlot: string;
    prizeValue: number;
    status: string;
    auctionDate: string;
    auctionDateISO?: string;
  }>;
  currentLiveAuction: {
    auctionId: string;
    auctionName: string;
    timeSlot: string;
    prizeValue: number;
    currentRound: number;
    totalRounds: number;
    participantCount: number;
  } | null;
}

interface AdminAnalyticsDashboardProps {
  adminUserId: string;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];
const STATUS_COLORS = {
  LIVE: '#10b981',
  COMPLETED: '#6b7280',
  UPCOMING: '#3b82f6',
  CANCELLED: '#ef4444',
};

export const AdminAnalyticsDashboard = forwardRef<{ refresh: () => Promise<void> }, AdminAnalyticsDashboardProps>(
  ({ adminUserId }, ref) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async (date?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const dateParam = date || selectedDate;
        const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'https://dev-api.dream60.com';
        const response = await fetch(
          `${backendUrl}/admin/analytics?user_id=${adminUserId}&date=${dateParam}`
        );
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Analytics API not available. Please ensure backend is deployed with the latest code.');
        }
        
        const data = await response.json();

        if (data.success) {
          setAnalyticsData(data.data);
        } else {
          setError(data.message || 'Failed to fetch analytics');
          toast.error(data.message || 'Failed to fetch analytics');
        }
      } catch (error: unknown) {
        console.error('Error fetching analytics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: () => fetchAnalytics(selectedDate),
    }));

    useEffect(() => {
      fetchAnalytics(selectedDate);
    }, [selectedDate, adminUserId]);

    const handleDateChange = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      if (newDate <= new Date()) {
        setSelectedDate(newDate.toISOString().split('T')[0]);
      }
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value);
    };

    if (isLoading && !analyticsData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
            <p className="text-purple-700 font-semibold">Loading analytics...</p>
          </div>
        </div>
      );
    }

    if (error && !analyticsData) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-900 mb-2">Analytics Not Available</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            The analytics API endpoint needs to be deployed on the backend server. 
            Please deploy the latest backend code to enable this feature.
          </p>
          <button
            onClick={() => fetchAnalytics(selectedDate)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!analyticsData) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-900 mb-2">No Data Available</h3>
          <p className="text-purple-600">No analytics data found for the selected date.</p>
        </div>
      );
    }

    const pieData = [
      { name: 'Live', value: analyticsData.statusDistribution.live, color: STATUS_COLORS.LIVE },
      { name: 'Completed', value: analyticsData.statusDistribution.completed, color: STATUS_COLORS.COMPLETED },
      { name: 'Upcoming', value: analyticsData.statusDistribution.upcoming, color: STATUS_COLORS.UPCOMING },
      { name: 'Cancelled', value: analyticsData.statusDistribution.cancelled, color: STATUS_COLORS.CANCELLED },
    ].filter(d => d.value > 0);

    const claimPieData = [
      { name: 'Claimed', value: analyticsData.claimStatusDistribution.claimed, color: '#10b981' },
      { name: 'Pending', value: analyticsData.claimStatusDistribution.pending, color: '#f59e0b' },
      { name: 'Expired', value: analyticsData.claimStatusDistribution.expired, color: '#ef4444' },
      { name: 'N/A', value: analyticsData.claimStatusDistribution.notApplicable, color: '#9ca3af' },
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-bold text-purple-900">Analytics Dashboard</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-purple-700" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-purple-900 font-medium"
              />
              <button
                onClick={() => handleDateChange(1)}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-purple-700" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {analyticsData.currentLiveAuction && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 animate-pulse" />
              <h3 className="text-xl font-bold">Live Auction Now</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-green-100 text-sm">Auction Name</p>
                <p className="text-xl font-bold">{analyticsData.currentLiveAuction.auctionName}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Time Slot</p>
                <p className="text-xl font-bold">{analyticsData.currentLiveAuction.timeSlot}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Prize Value</p>
                <p className="text-xl font-bold">{formatCurrency(analyticsData.currentLiveAuction.prizeValue)}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Round</p>
                <p className="text-xl font-bold">
                  {analyticsData.currentLiveAuction.currentRound} / {analyticsData.currentLiveAuction.totalRounds}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-900">{analyticsData.summary.totalAuctions}</span>
            </div>
            <p className="text-sm text-purple-600 font-medium">Total Auctions</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">{analyticsData.summary.liveAuctions}</span>
            </div>
            <p className="text-sm text-green-600 font-medium">Live</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold text-gray-900">{analyticsData.summary.completedAuctions}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Completed</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">{analyticsData.summary.upcomingAuctions}</span>
            </div>
            <p className="text-sm text-blue-600 font-medium">Upcoming</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-amber-600" />
              <span className="text-2xl font-bold text-amber-900">{analyticsData.summary.uniqueParticipants}</span>
            </div>
            <p className="text-sm text-amber-600 font-medium">Unique Users</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-indigo-900">{analyticsData.summary.totalParticipations}</span>
            </div>
            <p className="text-sm text-indigo-600 font-medium">Participations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <IndianRupee className="w-6 h-6" />
              <p className="text-purple-100">Total Entry Fees</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalEntryFees)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6" />
              <p className="text-green-100">Total Prize Value</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalPrizeValue)}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6" />
              <p className="text-amber-100">Total Claimed</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalClaimedValue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Last 7 Days Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.last7DaysData}>
                <defs>
                  <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dayName" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #8b5cf6',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="participants"
                  name="Participants"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorParticipants)"
                />
                <Area
                  type="monotone"
                  dataKey="claimed"
                  name="Claims"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Revenue Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.last7DaysData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="dayName" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #8b5cf6',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Auction Status Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-purple-500">
                No auction data for this date
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Prize Claim Status</h3>
            {claimPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={claimPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {claimPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-purple-500">
                No claim data for this date
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-700">Claimed: {analyticsData.claimStatusDistribution.claimed}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm text-gray-700">Pending: {analyticsData.claimStatusDistribution.pending}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-700">Expired: {analyticsData.claimStatusDistribution.expired}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-700">N/A: {analyticsData.claimStatusDistribution.notApplicable}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4">Auction Details</h3>
          {analyticsData.auctionDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Prize</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Participants</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Winners</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Claimed</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.auctionDetails.map((auction) => (
                    <tr key={auction.auctionId} className="border-b border-purple-100 hover:bg-purple-50">
                      <td className="py-3 px-4 font-medium">{auction.timeSlot}</td>
                      <td className="py-3 px-4">{auction.auctionName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            auction.status === 'LIVE'
                              ? 'bg-green-100 text-green-700'
                              : auction.status === 'COMPLETED'
                              ? 'bg-gray-100 text-gray-700'
                              : auction.status === 'UPCOMING'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {auction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(auction.prizeValue)}</td>
                      <td className="py-3 px-4">{auction.participantCount}</td>
                      <td className="py-3 px-4">{auction.winnersCount}</td>
                      <td className="py-3 px-4">
                        <span className={auction.claimedCount > 0 ? 'text-green-600' : 'text-gray-500'}>
                          {auction.claimedCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-purple-700">{formatCurrency(auction.totalEntryFees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-purple-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No auctions scheduled for this date</p>
            </div>
          )}
        </div>

        {analyticsData.auctionDetails.some(a => a.winners.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
            <h3 className="text-lg font-bold text-amber-900 mb-4">Today's Winners</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.auctionDetails
                .filter(a => a.winners.length > 0)
                .map((auction) => (
                  <div key={auction.auctionId} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <h4 className="font-bold text-amber-900 mb-2">{auction.auctionName}</h4>
                    <p className="text-sm text-amber-600 mb-3">{auction.timeSlot}</p>
                    <div className="space-y-2">
                      {auction.winners.map((winner, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded p-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {winner.rank}
                            </span>
                            <span className="font-medium text-sm">{winner.username}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-700">{formatCurrency(winner.prizeAmount)}</p>
                            <span
                              className={`text-xs ${
                                winner.claimStatus === 'CLAIMED'
                                  ? 'text-green-600'
                                  : winner.claimStatus === 'PENDING'
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {winner.claimStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AdminAnalyticsDashboard.displayName = 'AdminAnalyticsDashboard';
