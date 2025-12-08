import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Trophy,
  DollarSign,
  LogOut,
  Plus,
  Activity,
  UserCheck,
  UserX,
  Shield,
  RefreshCw,
  Search,
  Calendar,
  Clock,
  Trash2,
  Edit,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  user_id: string;
  username: string;
  email: string;
  userType: string;
  userCode: string;
}

interface Statistics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    deletedUsers: number;
    adminUsers: number;
  };
  activity: {
    totalAuctions: number;
    totalWins: number;
    totalAmountSpent: number;
    totalAmountWon: number;
  };
  recentUsers: Array<{
    user_id: string;
    username: string;
    email: string;
    mobile: string;
    userCode: string;
    joinedAt: string;
    totalAuctions: number;
    totalWins: number;
  }>;
  topSpenders: Array<{
    user_id: string;
    username: string;
    email: string;
    userCode: string;
    totalAmountSpent: number;
    totalAuctions: number;
  }>;
  topWinners: Array<{
    user_id: string;
    username: string;
    email: string;
    userCode: string;
    totalWins: number;
    totalAmountWon: number;
  }>;
}

interface MasterAuction {
  master_id: string;
  totalAuctionsPerDay: number;
  isActive: boolean;
  createdAt: string;
  dailyAuctionConfig: DailyAuctionConfigItem[];
}

interface AdminDashboardProps {
  adminUser: AdminUser;
  onLogout: () => void;
}
interface CombinedUser {
  user_id: string;
  username: string;
  email: string;
  userCode: string;
  mobile?: string;
  joinedAt?: string;

  totalAuctions?: number;
  totalWins?: number;
  totalAmountSpent?: number;
  totalAmountWon?: number;
}


export const AdminDashboard = ({ adminUser, onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'auctions'>('overview');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [masterAuctions, setMasterAuctions] = useState<MasterAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [editingAuction, setEditingAuction] = useState<MasterAuction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `https://dev-api.dream60.com/admin/statistics?user_id=${adminUser.user_id}`
      );
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchMasterAuctions = async () => {
    try {
      const response = await fetch(
        `https://dev-api.dream60.com/admin/master-auctions/?user_id=${adminUser.user_id}`
      );
      const data = await response.json();

      if (data.success) {
        setMasterAuctions(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch master auctions');
      }
    } catch (error) {
      console.error('Error fetching master auctions:', error);
      toast.error('Failed to fetch master auctions');
    }
  };

  const handleEditAuction = (auction: MasterAuction) => {
    setEditingAuction(auction);
    setShowCreateAuction(true);
  };

  const handleCloseAuctionModal = () => {
    setShowCreateAuction(false);
    setEditingAuction(null);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStatistics(), fetchMasterAuctions()]);
      setIsLoading(false);
    };
    loadData();
  }, [adminUser.user_id]);

  const handleRefresh = async () => {
    setIsLoading(true);
    if (activeTab === 'overview' || activeTab === 'users') {
      await fetchStatistics();
    }
    if (activeTab === 'auctions') {
      await fetchMasterAuctions();
    }
    setIsLoading(false);
    toast.success('Data refreshed');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user_id');
    localStorage.removeItem('admin_email');
    toast.success('Logged out successfully');
    onLogout();
  };

  if (isLoading && !statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-700 mx-auto mb-4"></div>
          <p className="text-purple-700 font-semibold">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-purple-700" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-sm text-purple-600">Dream60 Platform Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {adminUser.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-purple-900">{adminUser.username}</p>
                  <p className="text-xs text-purple-600">{adminUser.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-purple-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'text-purple-700 border-b-2 border-purple-700'
                  : 'text-purple-500 hover:text-purple-700'
              }`}
            >
              <Activity className="w-5 h-5 inline-block mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'users'
                  ? 'text-purple-700 border-b-2 border-purple-700'
                  : 'text-purple-500 hover:text-purple-700'
              }`}
            >
              <Users className="w-5 h-5 inline-block mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'auctions'
                  ? 'text-purple-700 border-b-2 border-purple-700'
                  : 'text-purple-500 hover:text-purple-700'
              }`}
            >
              <Trophy className="w-5 h-5 inline-block mr-2" />
              Master Auctions
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && statistics && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-700" />
                  </div>
                  <span className="text-2xl font-bold text-purple-900">
                    {statistics.overview.totalUsers}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-purple-600">Total Users</h3>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-700" />
                  </div>
                  <span className="text-2xl font-bold text-green-900">
                    {statistics.overview.activeUsers}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-green-600">Active Users</h3>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-700" />
                  </div>
                  <span className="text-2xl font-bold text-blue-900">
                    {statistics.activity.totalAuctions}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-blue-600">Total Auctions</h3>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Trophy className="w-6 h-6 text-amber-700" />
                  </div>
                  <span className="text-2xl font-bold text-amber-900">
                    {statistics.activity.totalWins}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-amber-600">Total Wins</h3>
              </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-purple-600">Total Amount Spent</h3>
                    <p className="text-3xl font-bold text-purple-900">
                      ₹{statistics.activity.totalAmountSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-green-600">Total Amount Won</h3>
                    <p className="text-3xl font-bold text-green-900">
                      ₹{statistics.activity.totalAmountWon.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h2 className="text-xl font-bold text-purple-900 mb-4">Recent Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">User Code</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Username</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Mobile</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Joined</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Auctions</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Wins</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.recentUsers.map((user) => (
                      <tr key={user.user_id} className="border-b border-purple-100 hover:bg-purple-50">
                        <td className="py-3 px-4 font-mono text-sm">{user.userCode}</td>
                        <td className="py-3 px-4">{user.username}</td>
                        <td className="py-3 px-4 text-sm">{user.email}</td>
                        <td className="py-3 px-4">{user.mobile}</td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">{user.totalAuctions}</td>
                        <td className="py-3 px-4">{user.totalWins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <h2 className="text-xl font-bold text-purple-900 mb-4">Top Spenders</h2>
                <div className="space-y-3">
                  {statistics.topSpenders.slice(0, 5).map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-purple-900">{user.username}</p>
                          <p className="text-sm text-purple-600">{user.userCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-900">
                          ₹{user.totalAmountSpent.toLocaleString()}
                        </p>
                        <p className="text-sm text-purple-600">{user.totalAuctions} auctions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                <h2 className="text-xl font-bold text-green-900 mb-4">Top Winners</h2>
                <div className="space-y-3">
                  {statistics.topWinners.slice(0, 5).map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">{user.username}</p>
                          <p className="text-sm text-green-600">{user.userCode}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-900">{user.totalWins} wins</p>
                        <p className="text-sm text-green-600">
                          ₹{user.totalAmountWon.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && statistics && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users by username, email, mobile, or user code..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* All Users Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h2 className="text-xl font-bold text-purple-900 mb-4">All Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">User Code</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Username</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Auctions</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Wins</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Spent</th>
                      <th className="text-left py-3 px-4 text-purple-700 font-semibold">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...statistics.recentUsers, ...statistics.topSpenders, ...statistics.topWinners]
                      .filter((user, index, self) => 
                        self.findIndex(u => u.user_id === user.user_id) === index
                      )
                      .filter(user => 
                        !searchTerm || 
                        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        user.userCode.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user: CombinedUser) => (
                        <tr key={user.user_id} className="border-b border-purple-100 hover:bg-purple-50">
                          <td className="py-3 px-4 font-mono text-sm">{user.userCode}</td>
                          <td className="py-3 px-4">{user.username}</td>
                          <td className="py-3 px-4 text-sm">{user.email}</td>
                          <td className="py-3 px-4">{user.totalAuctions || 0}</td>
                          <td className="py-3 px-4">{user.totalWins || 0}</td>
                          <td className="py-3 px-4">₹{(user.totalAmountSpent || 0).toLocaleString()}</td>
                          <td className="py-3 px-4">₹{(user.totalAmountWon || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="space-y-6">
            {/* Create Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingAuction(null);
                  setShowCreateAuction(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Master Auction
              </button>
            </div>

            {/* Master Auctions List */}
            <div className="grid grid-cols-1 gap-4">
              {masterAuctions.map((auction) => (
                <div
                  key={auction.master_id}
                  className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-xl shadow-lg p-6 border-2 border-purple-300 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg shadow-md">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">
                          Master Auction
                        </h3>
                        <p className="text-sm text-purple-600 flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(auction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-4 py-2 rounded-full font-bold text-sm shadow-md ${
                          auction.isActive
                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                        }`}
                      >
                        {auction.isActive ? '● Active' : '○ Inactive'}
                      </span>
                      <button
                        onClick={() => handleEditAuction(auction)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Edit auction"
                      >
                        <Edit className="w-5 h-5 text-purple-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-3 border border-purple-300 shadow-sm">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Daily Auctions</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {auction.totalAuctionsPerDay}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-3 border border-blue-300 shadow-sm">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Configured</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {auction.dailyAuctionConfig?.length || 0}
                      </p>
                    </div>
                  </div>

                  {auction.dailyAuctionConfig && auction.dailyAuctionConfig.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-bold text-base text-purple-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Auction Slots
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {auction.dailyAuctionConfig.map((config) => (
                          <div
                            key={config.auctionNumber}
                            className="group bg-white rounded-lg overflow-hidden border border-purple-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all duration-300"
                          >
                            <div className="flex flex-col sm:flex-row">
                              {/* Image Section */}
                              <div className="relative w-full sm:w-32 h-24 sm:h-auto flex-shrink-0">
                                {config.imageUrl ? (
                                  <div className="relative h-full bg-gradient-to-br from-purple-100 to-purple-200 overflow-hidden">
                                    <img
                                      src={config.imageUrl}
                                      alt={config.auctionName}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                    <Trophy className="w-8 h-8 text-purple-400" />
                                  </div>
                                )}
                                <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                  #{config.auctionNumber}
                                </div>
                              </div>

                              {/* Content Section */}
                              <div className="flex-1 p-3">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  {/* Left: Name & Time */}
                                  <div className="flex-1">
                                    <h5 className="font-bold text-base text-purple-900 mb-1">
                                      {config.auctionName}
                                    </h5>
                                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                                      <Clock className="w-3 h-3" />
                                      <span className="font-semibold text-sm">{config.TimeSlot}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        config.Status === 'LIVE' ? 'bg-green-100 text-green-700' :
                                        config.Status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                        config.Status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {config.Status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Prize Value */}
                                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                    <div className="text-left sm:text-right">
                                      <p className="text-xs text-purple-600 font-semibold mb-1">Prize Value</p>
                                      <p className="text-lg font-bold text-purple-900">
                                        ₹{config.prizeValue.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {masterAuctions.length === 0 && (
                <div className="bg-gradient-to-br from-white via-purple-50/30 to-white rounded-xl shadow-lg p-12 border-2 border-purple-300 text-center">
                  <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-900 mb-2">
                    No Master Auctions Yet
                  </h3>
                  <p className="text-purple-600 mb-4 text-base">
                    Create your first master auction to get started
                  </p>
                  <button
                    onClick={() => {
                      setEditingAuction(null);
                      setShowCreateAuction(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Create Master Auction
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Master Auction Modal */}
      {showCreateAuction && (
        <CreateMasterAuctionModal
          adminUserId={adminUser.user_id}
          editingAuction={editingAuction}
          onClose={handleCloseAuctionModal}
          onSuccess={() => {
            handleCloseAuctionModal();
            fetchMasterAuctions();
          }}
        />
      )}
    </div>
  );
};

// Create/Edit Master Auction Modal Component
interface CreateMasterAuctionModalProps {
  adminUserId: string;
  editingAuction?: MasterAuction | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface RoundConfig {
  round: number;
  duration: number;
  roundCutoffPercentage: number;
  topBidAmountsPerRound: number;
}

interface DailyAuctionConfigItem {
  auctionNumber: number;
  TimeSlot: string;
  auctionName: string;
  imageUrl: string;
  prizeValue: number;
  Status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  maxDiscount: number;
  EntryFee: 'RANDOM' | 'MANUAL';
  minEntryFee: number;
  maxEntryFee: number;
  FeeSplits?: { BoxA: number; BoxB: number };
  roundCount: number;
  roundConfig: RoundConfig[];
}

const CreateMasterAuctionModal = ({
  adminUserId,
  editingAuction,
  onClose,
  onSuccess,
}: CreateMasterAuctionModalProps) => {
  const [formData, setFormData] = useState({
    totalAuctionsPerDay: editingAuction?.totalAuctionsPerDay || 10,
    isActive: editingAuction?.isActive ?? true,
  });
  const [dailyAuctions, setDailyAuctions] = useState<DailyAuctionConfigItem[]>(
    editingAuction?.dailyAuctionConfig || []
  );
  const [currentAuction, setCurrentAuction] = useState<DailyAuctionConfigItem>({
    auctionNumber: 1,
    TimeSlot: '12:00',
    auctionName: 'iPhone 14 Pro',
    imageUrl: '',
    prizeValue: 65000,
    Status: 'UPCOMING',
    maxDiscount: 10,
    EntryFee: 'RANDOM',
    minEntryFee: 20,
    maxEntryFee: 80,
    roundCount: 4,
    roundConfig: [
      { round: 1, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
      { round: 2, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
      { round: 3, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
      { round: 4, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
    ],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Auto-generate daily configs when totalAuctionsPerDay changes
  const handleTotalAuctionsChange = (value: number) => {
    const newTotal = Math.min(Math.max(value, 1), 24);
    setFormData({ ...formData, totalAuctionsPerDay: newTotal });

    // Only auto-generate if not editing an existing auction
    if (!editingAuction) {
      // Generate daily auction configs automatically
      const newDailyAuctions: DailyAuctionConfigItem[] = [];
      for (let i = 0; i < newTotal; i++) {
        const hour = 9 + i; // Start from 9:00 AM
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        newDailyAuctions.push({
          auctionNumber: i + 1,
          TimeSlot: timeSlot,
          auctionName: `Auction ${i + 1}`,
          imageUrl: '',
          prizeValue: 10000,
          Status: 'UPCOMING',
          maxDiscount: 10,
          EntryFee: 'RANDOM',
          minEntryFee: 20,
          maxEntryFee: 80,
          roundCount: 4,
          roundConfig: [
            { round: 1, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
            { round: 2, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
            { round: 3, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
            { round: 4, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
          ],
        });
      }
      
      setDailyAuctions(newDailyAuctions);
    }
  };

  const handleAddRound = () => {
    setCurrentAuction({
      ...currentAuction,
      roundConfig: [
        ...currentAuction.roundConfig,
        {
          round: currentAuction.roundConfig.length + 1,
          duration: 15,
          roundCutoffPercentage: 40,
          topBidAmountsPerRound: 3,
        },
      ],
    });
  };

  const handleRemoveRound = (index: number) => {
    const newRoundConfig = currentAuction.roundConfig.filter((_, i) => i !== index);
    setCurrentAuction({
      ...currentAuction,
      roundConfig: newRoundConfig.map((round, i) => ({ ...round, round: i + 1 })),
    });
  };

  const handleUpdateRound = (index: number, field: keyof RoundConfig, value: number) => {
    const newRoundConfig = [...currentAuction.roundConfig];
    newRoundConfig[index] = { ...newRoundConfig[index], [field]: value };
    setCurrentAuction({
      ...currentAuction,
      roundConfig: newRoundConfig,
    });
  };

  const handleAddAuction = () => {
    if (editingIndex !== null) {
      // Update existing auction
      const newAuctions = [...dailyAuctions];
      newAuctions[editingIndex] = currentAuction;
      setDailyAuctions(newAuctions);
      setEditingIndex(null);
    } else {
      // Add new auction
      setDailyAuctions([...dailyAuctions, currentAuction]);
    }

    // Reset form with proper round configs
    setCurrentAuction({
      auctionNumber: dailyAuctions.length + 1,
      TimeSlot: '12:00',
      auctionName: '',
      imageUrl: '',
      prizeValue: 0,
      Status: 'UPCOMING',
      maxDiscount: 10,
      EntryFee: 'RANDOM',
      minEntryFee: 20,
      maxEntryFee: 80,
      roundCount: 4,
      roundConfig: [
        { round: 1, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
        { round: 2, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
        { round: 3, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
        { round: 4, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
      ],
    });
    setShowAuctionForm(false);
    toast.success(editingIndex !== null ? 'Auction updated' : 'Auction added');
  };

  const handleEditAuction = (index: number) => {
    setCurrentAuction(dailyAuctions[index]);
    setEditingIndex(index);
    setShowAuctionForm(true);
  };

  const handleDeleteAuction = (index: number) => {
    setDailyAuctions(dailyAuctions.filter((_, i) => i !== index));
    toast.success('Auction removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dailyAuctions.length === 0) {
      toast.error('Please add at least one daily auction');
      return;
    }

    if (dailyAuctions.length !== formData.totalAuctionsPerDay) {
      toast.error(`Expected ${formData.totalAuctionsPerDay} daily auctions, but got ${dailyAuctions.length}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingAuction
        ? `https://dev-api.dream60.com/admin/master-auctions/${editingAuction.master_id}?user_id=${adminUserId}`
        : `https://dev-api.dream60.com/admin/master-auctions?user_id=${adminUserId}`;
      
      const method = editingAuction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dailyAuctionConfig: dailyAuctions,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || `Failed to ${editingAuction ? 'update' : 'create'} master auction`);
        setIsSubmitting(false);
        return;
      }

      toast.success(`Master auction ${editingAuction ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (error) {
      console.error(`Error ${editingAuction ? 'updating' : 'creating'} master auction:`, error);
      toast.error(`Failed to ${editingAuction ? 'update' : 'create'} master auction`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-900">
            {editingAuction ? 'Edit' : 'Create'} Master Auction
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-purple-700" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4">Basic Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  Total Auctions Per Day *
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.totalAuctionsPerDay}
                  onChange={(e) => handleTotalAuctionsChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                  required
                />
                <p className="text-xs text-purple-600 mt-1">
                  {editingAuction 
                    ? 'Current daily auction configurations will be preserved'
                    : 'Daily configs will be auto-generated based on this value'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-purple-700">
                  Set as Active
                </label>
              </div>
            </div>
          </div>

          {/* Daily Auctions List */}
          <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-purple-900">
                Daily Auction Config ({dailyAuctions.length}/{formData.totalAuctionsPerDay})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAuctionForm(true);
                  setEditingIndex(null);
                  setCurrentAuction({
                    auctionNumber: dailyAuctions.length + 1,
                    TimeSlot: '12:00',
                    auctionName: '',
                    imageUrl: '',
                    prizeValue: 0,
                    Status: 'UPCOMING',
                    maxDiscount: 10,
                    EntryFee: 'RANDOM',
                    minEntryFee: 20,
                    maxEntryFee: 80,
                    roundCount: 4,
                    roundConfig: [
                      { round: 1, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
                      { round: 2, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
                      { round: 3, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
                      { round: 4, duration: 15, roundCutoffPercentage: 40, topBidAmountsPerRound: 3 },
                    ],
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Edit Auction
              </button>
            </div>

            {dailyAuctions.length === 0 ? (
              <div className="text-center py-8 text-purple-600">
                Set "Total Auctions Per Day" to auto-generate daily configs
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dailyAuctions.map((auction, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-purple-200 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-purple-900">#{auction.auctionNumber}</span>
                        <span className="text-sm font-semibold text-purple-700">
                          {auction.TimeSlot}
                        </span>
                        <span className="text-sm text-purple-600">{auction.auctionName}</span>
                        {auction.imageUrl && (
                          <span className="text-xs text-purple-500">🖼️ Has Image</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-purple-600">
                        <span>Prize: ₹{auction.prizeValue.toLocaleString()}</span>
                        <span>Entry: {auction.EntryFee}</span>
                        <span>Rounds: {auction.roundCount}</span>
                        <span className="px-2 py-1 bg-purple-100 rounded">{auction.Status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditAuction(index)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5 text-purple-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auction Form Modal */}
          {showAuctionForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  {editingIndex !== null ? 'Edit' : 'Add'} Daily Auction
                </h3>

                <div className="space-y-4">
                  {/* Basic Auction Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Auction Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentAuction.auctionNumber}
                        onChange={(e) =>
                          setCurrentAuction({
                            ...currentAuction,
                            auctionNumber: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Time Slot
                      </label>
                      <input
                        type="time"
                        value={currentAuction.TimeSlot}
                        onChange={(e) =>
                          setCurrentAuction({ ...currentAuction, TimeSlot: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Auction Name
                      </label>
                      <input
                        type="text"
                        value={currentAuction.auctionName}
                        onChange={(e) =>
                          setCurrentAuction({ ...currentAuction, auctionName: e.target.value })
                        }
                        placeholder="iPhone 14 Pro"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={currentAuction.imageUrl}
                        onChange={(e) =>
                          setCurrentAuction({ ...currentAuction, imageUrl: e.target.value })
                        }
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Prize Value (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentAuction.prizeValue}
                        onChange={(e) =>
                          setCurrentAuction({
                            ...currentAuction,
                            prizeValue: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Status
                      </label>
                      <select
                        value={currentAuction.Status}
                        onChange={(e) =>
                          setCurrentAuction({
                            ...currentAuction,
                            Status: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Max Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentAuction.maxDiscount}
                        onChange={(e) =>
                          setCurrentAuction({
                            ...currentAuction,
                            maxDiscount: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Entry Fee Type
                      </label>
                      <select
                        value={currentAuction.EntryFee}
                        onChange={(e) => {
                          const newEntryFee = e.target.value as 'RANDOM' | 'MANUAL';
                          setCurrentAuction({
                            ...currentAuction,
                            EntryFee: newEntryFee,
                            // Set min and max to 0 when MANUAL is selected
                            minEntryFee: newEntryFee === 'MANUAL' ? 0 : currentAuction.minEntryFee,
                            maxEntryFee: newEntryFee === 'MANUAL' ? 0 : currentAuction.maxEntryFee,
                          });
                        }}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="RANDOM">RANDOM</option>
                        <option value="MANUAL">MANUAL</option>
                      </select>
                    </div>
                  </div>

                  {/* Entry Fee Configuration - Conditional based on type */}
                  <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                    <h4 className="text-base font-bold text-amber-900 mb-3">
                      Entry Fee Configuration
                    </h4>
                    
                    {currentAuction.EntryFee === 'MANUAL' ? (
                      /* MANUAL Mode - Show BoxA and BoxB inputs */
                      <div>
                        <p className="text-sm text-amber-700 mb-3">
                          Enter the entry fee split values for Box A and Box B
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-amber-700 mb-2">
                              Box A Entry Fee (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentAuction.FeeSplits?.BoxA || 0}
                              onChange={(e) =>
                                setCurrentAuction({
                                  ...currentAuction,
                                  FeeSplits: {
                                    BoxA: parseInt(e.target.value) || 0,
                                    BoxB: currentAuction.FeeSplits?.BoxB || 0,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-amber-700 mb-2">
                              Box B Entry Fee (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentAuction.FeeSplits?.BoxB || 0}
                              onChange={(e) =>
                                setCurrentAuction({
                                  ...currentAuction,
                                  FeeSplits: {
                                    BoxA: currentAuction.FeeSplits?.BoxA || 0,
                                    BoxB: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-amber-100 rounded-lg border border-amber-300">
                          <p className="text-sm font-semibold text-amber-900">
                            Total Entry Fee: ₹{((currentAuction.FeeSplits?.BoxA || 0) + (currentAuction.FeeSplits?.BoxB || 0)).toLocaleString()}
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Min & Max Entry Fee will be set to 0 for MANUAL mode
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* RANDOM Mode - Show min/max only, backend generates BoxA and BoxB */
                      <div>
                        <p className="text-sm text-amber-700 mb-3">
                          Set the range for random entry fee generation. BoxA and BoxB will be automatically generated by the system.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-amber-700 mb-2">
                              Min Entry Fee (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentAuction.minEntryFee}
                              onChange={(e) =>
                                setCurrentAuction({
                                  ...currentAuction,
                                  minEntryFee: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-amber-700 mb-2">
                              Max Entry Fee (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentAuction.maxEntryFee}
                              onChange={(e) =>
                                setCurrentAuction({
                                  ...currentAuction,
                                  maxEntryFee: parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:border-amber-500"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-amber-100 rounded-lg border border-amber-300">
                          <p className="text-sm font-semibold text-amber-900">
                            💡 Entry fee split (BoxA & BoxB) will be randomly generated within this range when you create the auction
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Round Count */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-purple-700 mb-2">
                        Round Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={currentAuction.roundCount}
                        onChange={(e) => {
                          const newRoundCount = parseInt(e.target.value) || 1;
                          
                          // Automatically generate round configs based on round count
                          const newRoundConfig: RoundConfig[] = [];
                          for (let i = 0; i < newRoundCount; i++) {
                            newRoundConfig.push({
                              round: i + 1,
                              duration: 15,
                              roundCutoffPercentage: 40,
                              topBidAmountsPerRound: 3,
                            });
                          }
                          
                          setCurrentAuction({
                            ...currentAuction,
                            roundCount: newRoundCount,
                            roundConfig: newRoundConfig,
                          });
                        }}
                        className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500"
                        required
                      />
                      <p className="text-xs text-purple-600 mt-1">
                        Round configs will be auto-generated based on this count
                      </p>
                    </div>
                  </div>

                  {/* Round Config */}
                  <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-purple-900">
                        Round Configuration ({currentAuction.roundConfig.length})
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddRound}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Round
                      </button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {currentAuction.roundConfig.map((round, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-3 border border-purple-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-purple-900">Round {round.round}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveRound(index)}
                              className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-purple-700 mb-1">
                                Duration (min)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={round.duration}
                                onChange={(e) =>
                                  handleUpdateRound(index, 'duration', parseInt(e.target.value))
                                }
                                className="w-full px-2 py-1 border border-purple-200 rounded text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-purple-700 mb-1">
                                Cutoff (%)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={round.roundCutoffPercentage}
                                onChange={(e) =>
                                  handleUpdateRound(
                                    index,
                                    'roundCutoffPercentage',
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 border border-purple-200 rounded text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-purple-700 mb-1">
                                Top Bids
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={round.topBidAmountsPerRound}
                                onChange={(e) =>
                                  handleUpdateRound(
                                    index,
                                    'topBidAmountsPerRound',
                                    parseInt(e.target.value)
                                  )
                                }
                                className="w-full px-2 py-1 border border-purple-200 rounded text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAuctionForm(false);
                        setEditingIndex(null);
                      }}
                      className="flex-1 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAuction}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
                    >
                      {editingIndex !== null ? 'Update' : 'Save'} Auction
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || dailyAuctions.length === 0 || dailyAuctions.length !== formData.totalAuctionsPerDay}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? `${editingAuction ? 'Updating' : 'Creating'}...` : `${editingAuction ? 'Update' : 'Create'} Master Auction`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};