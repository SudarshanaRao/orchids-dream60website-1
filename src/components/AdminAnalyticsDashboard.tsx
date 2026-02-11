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
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface AnalyticsData {
  viewType: string;
  startDate: string;
  endDate: string;
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
      totalAmountSpentByClaiming: number;
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
    date: string;
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
  lastTrendData: Array<{
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

type ViewType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export const AdminAnalyticsDashboard = forwardRef<{ refresh: () => Promise<void> }, AdminAnalyticsDashboardProps>(
  ({ adminUserId }, ref) => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewType, setViewType] = useState<ViewType>('today');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedDate, setLastFetchedDate] = useState<string>('');

    const formatDateToDDMMYYYY = (dateStr: string) => {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      return `${day}-${month}-${year}`;
    };

    const fetchAnalytics = async (dateOverride?: string) => {
      const dateToFetch = dateOverride || startDate;
      
      if (viewType === 'today' && dateToFetch === lastFetchedDate && analyticsData) {
        return;
      }
      
        try {
          setIsLoading(true);
          setError(null);
          const backendUrl = API_BASE_URL;
          
          let url = `${backendUrl}/admin/analytics?user_id=${adminUserId}&viewType=${viewType}`;
        
        if (viewType === 'today') {
          url += `&date=${formatDateToDDMMYYYY(dateToFetch)}`;
        } else if (viewType === 'custom') {
          url += `&startDate=${formatDateToDDMMYYYY(startDate)}&endDate=${formatDateToDDMMYYYY(endDate)}`;
        }

        const response = await fetch(url);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Analytics API not available. Please ensure backend is deployed with the latest code.');
        }
        
        const data = await response.json();

        if (data.success) {
          setAnalyticsData(data.data);
          if (viewType === 'today') {
            setLastFetchedDate(dateToFetch);
          }
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
      refresh: () => fetchAnalytics(),
    }));

    useEffect(() => {
      setLastFetchedDate('');
      fetchAnalytics();
    }, [viewType, adminUserId]);

    useEffect(() => {
      if (viewType === 'today' && startDate !== lastFetchedDate) {
        fetchAnalytics(startDate);
      }
    }, [startDate]);

    const handleDateChange = (days: number) => {
      if (viewType !== 'today') return;
      const newDate = new Date(startDate);
      newDate.setDate(newDate.getDate() + days);
      setStartDate(newDate.toISOString().split('T')[0]);
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
          <button
            onClick={() => fetchAnalytics()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!analyticsData) return null;

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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-purple-700" />
                <h2 className="text-xl font-bold text-purple-900">Analytics Dashboard</h2>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'week', label: 'Weekly' },
                  { id: 'month', label: 'Monthly' },
                  { id: 'custom', label: 'Custom' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setViewType(type.id as ViewType);
                      if (type.id === 'today') setStartDate(new Date().toISOString().split('T')[0]);
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewType === type.id
                        ? 'bg-purple-600 text-white shadow-md scale-105'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-purple-50 rounded-xl gap-4">
              <div className="flex items-center gap-2 text-purple-900 font-semibold">
                <Filter className="w-5 h-5" />
                <span>Range: {analyticsData.startDate} to {analyticsData.endDate}</span>
              </div>

              {viewType === 'today' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDateChange(-1)}
                    className="p-2 bg-white border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-purple-700" />
                  </button>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-4 py-2 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 text-purple-900 font-medium"
                  />
                  <button
                    onClick={() => handleDateChange(1)}
                    className="p-2 bg-white border border-purple-200 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-purple-700" />
                  </button>
                </div>
              )}

              {viewType === 'custom' && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-700">From:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-purple-900 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-purple-700">To:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 text-purple-900 text-sm"
                    />
                  </div>
                  <button
                    onClick={fetchAnalytics}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
                  >
                    Apply
                  </button>
                </div>
              )}

              <div className="text-right">
                <p className="text-sm text-purple-600 font-medium">{analyticsData.currentTime}</p>
                <p className="text-xs text-purple-400">Current Slot: {analyticsData.currentTimeSlot}</p>
              </div>
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
                <p className="text-purple-100">Entry Fees Paid</p>
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
                  <p className="text-amber-100">Total Amount Claimed</p>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalClaimedValue)}</p>
              </div>

              <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <IndianRupee className="w-6 h-6" />
                  <p className="text-rose-100">Amount Spent by Users</p>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(analyticsData.summary.totalAmountSpentByClaiming)}</p>
              </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Activity Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.lastTrendData}>
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
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} angle={-45} textAnchor="end" height={60} />
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
            <h3 className="text-lg font-bold text-purple-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.lastTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} angle={-45} textAnchor="end" height={60} />
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
                No auction data for this range
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
                No claim data for this range
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-4">Auction Details</h3>
          {analyticsData.auctionDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-purple-200">
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Prize</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Users</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Wins</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Claimed</th>
                    <th className="text-left py-3 px-4 text-purple-700 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.auctionDetails.map((auction) => (
                    <tr key={auction.auctionId} className="border-b border-purple-100 hover:bg-purple-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-600">{auction.date}</td>
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
                        <span className={auction.claimedCount > 0 ? 'text-green-600 font-bold' : 'text-gray-500'}>
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
              <p>No auctions found for this range</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

AdminAnalyticsDashboard.displayName = 'AdminAnalyticsDashboard';
