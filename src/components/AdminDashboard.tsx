import { useState, useEffect, useRef } from 'react';
import {
  Users,
  TrendingUp,
  Trophy,
  IndianRupee,
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
    Mail,
      Bell,
      BarChart3,
      Eye,
      Ticket,
      ChevronDown,
      ChevronUp,
      ChevronLeft,
      ChevronRight,
      Power,
      ToggleLeft,
      ToggleRight,
      AlertCircle,
      Timer,
    } from 'lucide-react';

  import { toast } from 'sonner';
  import { AdminEmailManagement } from './AdminEmailManagement';
  import { AdminPushNotifications } from './AdminPushNotifications';
  import { CreateMasterAuctionModal } from './CreateMasterAuctionModal';
  import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
  import { SuperAdminUserAnalytics } from './SuperAdminUserAnalytics';
  import { AdminVoucherManagement } from './AdminVoucherManagement';


interface AdminUser {
  user_id: string;
  username: string;
  email: string;
  userType: string;
  userCode: string;
  isSuperAdmin?: boolean;
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

interface DailyAuctionConfigItem {
  auctionNumber: number;
  auctionId?: string;
  TimeSlot: string;
  auctionName: string;
  prizeValue: number;
  Status: string;
  maxDiscount: number;
  EntryFee: 'RANDOM' | 'MANUAL';
  minEntryFee: number | null;
  maxEntryFee: number | null;
  FeeSplits: { BoxA: number; BoxB: number } | null;
  roundCount: number;
  roundConfig: Array<{
    round: number;
    minPlayers: number | null;
    duration: number;
    maxBid: number | null;
    roundCutoffPercentage: number | null;
    topBidAmountsPerRound: number;
  }>;
  imageUrl?: string;
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
    const validTabs = ['overview', 'users', 'auctions', 'analytics', 'emails', 'notifications', 'userAnalytics', 'vouchers'] as const;
    type TabType = typeof validTabs[number];
    
    const getInitialTab = (): TabType => {
      const hash = window.location.hash.replace('#', '');
      if (validTabs.includes(hash as TabType)) {
        return hash as TabType;
      }
      const stored = localStorage.getItem('admin_active_tab');
      if (stored && validTabs.includes(stored as TabType)) {
        return stored as TabType;
      }
      return 'overview';
    };

    const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [masterAuctions, setMasterAuctions] = useState<MasterAuction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateAuction, setShowCreateAuction] = useState(false);
    const [editingAuction, setEditingAuction] = useState<MasterAuction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const analyticsRef = useRef<{ refresh: () => Promise<void> }>(null);
    const [expandedAuctions, setExpandedAuctions] = useState<Set<string>>(new Set());
    const [togglingAuction, setTogglingAuction] = useState<string | null>(null);
    const [showStatusConfirm, setShowStatusConfirm] = useState<{show: boolean, auction: MasterAuction | null}>({
      show: false,
      auction: null
    });
    const tabsRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
    
    const isSuperAdmin = adminUser.isSuperAdmin === true;
    const SESSION_DURATION = 15 * 60 * 1000;

    useEffect(() => {
      localStorage.setItem('admin_active_tab', activeTab);
      window.location.hash = activeTab;
    }, [activeTab]);

    useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash.replace('#', '');
        if (validTabs.includes(hash as TabType)) {
          setActiveTab(hash as TabType);
        }
      };
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
      if (isSuperAdmin) {
        setSessionTimeLeft(null);
        return;
      }

      const loginTimeKey = 'admin_login_time';
      let loginTime = parseInt(localStorage.getItem(loginTimeKey) || '0', 10);
      
      if (!loginTime || loginTime === 0) {
        loginTime = Date.now();
        localStorage.setItem(loginTimeKey, loginTime.toString());
      }

      const checkSession = () => {
        const elapsed = Date.now() - loginTime;
        const remaining = SESSION_DURATION - elapsed;

        if (remaining <= 0) {
          toast.error('Session expired. Please log in again.');
          localStorage.removeItem(loginTimeKey);
          localStorage.removeItem('admin_active_tab');
          onLogout();
          return;
        }

        setSessionTimeLeft(Math.ceil(remaining / 1000));
      };

      checkSession();
      const interval = setInterval(checkSession, 1000);

      return () => clearInterval(interval);
    }, [isSuperAdmin, onLogout]);

    const formatSessionTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
      }
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scrollTabs = (direction: 'left' | 'right') => {
      if (tabsRef.current) {
        const scrollAmount = 200;
        tabsRef.current.scrollBy({
          left: direction === 'left' ? -scrollAmount : scrollAmount,
          behavior: 'smooth'
        });
      }
    };

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

  const handleDeleteAuction = async (masterId: string) => {
    if (!confirm('Are you sure you want to delete this master auction? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(
        `https://dev-api.dream60.com/admin/master-auctions/${masterId}?user_id=${adminUser.user_id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success('Master auction deleted successfully');
        fetchMasterAuctions();
      } else {
        toast.error(data.message || 'Failed to delete master auction');
      }
    } catch (error) {
      console.error('Error deleting master auction:', error);
      toast.error('Failed to delete master auction');
    }
  };

  const handleDeleteAuctionSlot = async (masterId: string, auctionNumber: number) => {
    if (!confirm(`Are you sure you want to delete auction slot #${auctionNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://dev-api.dream60.com/admin/master-auctions/${masterId}/slots/${auctionNumber}?user_id=${adminUser.user_id}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success('Auction slot deleted successfully');
        fetchMasterAuctions();
      } else {
        toast.error(data.message || 'Failed to delete auction slot');
      }
    } catch (error) {
      console.error('Error deleting auction slot:', error);
      toast.error('Failed to delete auction slot');
    }
  };

  const handleCloseAuctionModal = () => {
    setShowCreateAuction(false);
    setEditingAuction(null);
  };

  const toggleAuctionExpand = (masterId: string) => {
    setExpandedAuctions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(masterId)) {
        newSet.delete(masterId);
      } else {
        newSet.add(masterId);
      }
      return newSet;
    });
  };

  const handleToggleActiveStatus = async (auction: MasterAuction) => {
    setTogglingAuction(auction.master_id);
    try {
      const response = await fetch(
        `https://dev-api.dream60.com/admin/master-auctions/${auction.master_id}?user_id=${adminUser.user_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !auction.isActive,
          }),
        }
      );
      const data = await response.json();

      if (data.success) {
        toast.success(`Master auction ${!auction.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchMasterAuctions();
      } else {
        toast.error(data.message || 'Failed to update auction status');
      }
    } catch (error) {
      console.error('Error toggling auction status:', error);
      toast.error('Failed to update auction status');
    } finally {
      setTogglingAuction(null);
    }
  };

  const expandAllAuctions = () => {
    setExpandedAuctions(new Set(masterAuctions.map(a => a.master_id)));
  };

  const collapseAllAuctions = () => {
    setExpandedAuctions(new Set());
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
    try {
      if (activeTab === 'overview' || activeTab === 'users') {
        await fetchStatistics();
      } else if (activeTab === 'auctions') {
        await fetchMasterAuctions();
      } else if (activeTab === 'analytics') {
        await analyticsRef.current?.refresh();
      }
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
    setIsLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_user_id');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_login_time');
    localStorage.removeItem('admin_active_tab');
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
                {sessionTimeLeft !== null && !isSuperAdmin && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    sessionTimeLeft <= 60 
                      ? 'bg-red-50 border-red-300 text-red-700' 
                      : sessionTimeLeft <= 300 
                        ? 'bg-amber-50 border-amber-300 text-amber-700' 
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                  }`}>
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      Session: {formatSessionTime(sessionTimeLeft)}
                    </span>
                  </div>
                )}
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

          {/* Tabs with Arrows */}
          <div className="relative mt-4 group">
            {showLeftArrow && (
              <button
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-white via-white to-transparent text-purple-700 hover:text-purple-900 transition-all flex items-center"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            <div 
              ref={tabsRef}
              onScroll={checkScroll}
              className="flex gap-2 border-b border-purple-200 overflow-x-auto scrollbar-hide scroll-smooth"
            >
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'overview'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Activity className="w-5 h-5 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'users'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('auctions')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'auctions'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Trophy className="w-5 h-5 mr-2" />
                Master Auctions
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'emails'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Mail className="w-5 h-5 mr-2" />
                Email Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'analytics'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'notifications'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Bell className="w-5 h-5 mr-2" />
                Push Notifications
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('userAnalytics')}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                    activeTab === 'userAnalytics'
                      ? 'text-purple-700 border-b-2 border-purple-700'
                      : 'text-purple-500 hover:text-purple-700'
                  }`}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  User Tracking
                </button>
              )}
              <button
                onClick={() => setActiveTab('vouchers')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'vouchers'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Ticket className="w-5 h-5 mr-2" />
                Voucher Management
              </button>
            </div>

            {showRightArrow && (
              <button
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-white via-white to-transparent text-purple-700 hover:text-purple-900 transition-all flex items-center"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
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
                      <IndianRupee className="w-6 h-6 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-purple-600">Total Amount Spent</h3>
                      <p className="text-3xl font-bold text-purple-900">
                        {statistics.activity.totalAmountSpent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <IndianRupee className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-green-600">Total Amount Won</h3>
                      <p className="text-3xl font-bold text-green-900">
                        {statistics.activity.totalAmountWon.toLocaleString()}
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
              {/* Search Bar and Filters */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search users by username, email, mobile, or user code..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                      className="px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 bg-white text-purple-900 font-medium"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Last 24 Hours</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>
                  </div>
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
                        .filter((user: CombinedUser) => {
                          if (dateFilter === 'all') return true;
                          if (!user.joinedAt) return false;
                          const joinedDate = new Date(user.joinedAt);
                          const now = new Date();
                          const diffTime = now.getTime() - joinedDate.getTime();
                          const diffDays = diffTime / (1000 * 60 * 60 * 24);
                          if (dateFilter === 'today') return diffDays <= 1;
                          if (dateFilter === 'week') return diffDays <= 7;
                          if (dateFilter === 'month') return diffDays <= 30;
                          return true;
                        })
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
              {/* Header with Create Button and Expand/Collapse All */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={expandAllAuctions}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllAuctions}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                    Collapse All
                  </button>
                </div>
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
                {masterAuctions.map((auction) => {
                  const isExpanded = expandedAuctions.has(auction.master_id);
                  return (
                  <div
                    key={auction.master_id}
                    className={`bg-gradient-to-br from-white via-purple-50/30 to-white rounded-xl shadow-lg border-2 transition-all duration-300 ${
                      auction.isActive ? 'border-purple-300 hover:shadow-xl' : 'border-gray-300 opacity-80'
                    }`}
                  >
                    {/* Header - Always Visible */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleAuctionExpand(auction.master_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg shadow-md ${
                            auction.isActive 
                              ? 'bg-gradient-to-br from-purple-600 to-purple-700' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                              Master Auction
                              <span className="text-sm font-normal text-purple-600">
                                ({auction.dailyAuctionConfig?.length || 0} slots)
                              </span>
                            </h3>
                            <p className="text-sm text-purple-600 flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(auction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Active/Inactive Toggle Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowStatusConfirm({ show: true, auction });
                              }}
                              disabled={togglingAuction === auction.master_id}

                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                              auction.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } ${togglingAuction === auction.master_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={auction.isActive ? 'Click to deactivate' : 'Click to activate'}
                          >
                            {togglingAuction === auction.master_id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : auction.isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                            {auction.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAuction(auction);
                            }}
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Edit auction"
                          >
                            <Edit className="w-5 h-5 text-purple-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAuction(auction.master_id);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete auction"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                          {/* Expand/Collapse Indicator */}
                          <div className="p-2">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-purple-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-purple-200">
                        <div className="grid grid-cols-2 gap-3 my-4">
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

                                      {/* Right: Image Preview, Prize Value & Delete Button */}
                                      <div className="flex items-center gap-3">
                                        {config.imageUrl && (
                                          <div className="w-16 h-16 bg-gray-100 rounded-md border border-purple-200 overflow-hidden flex-shrink-0">
                                            <img
                                              src={config.imageUrl}
                                              alt={config.auctionName}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                                              }}
                                            />
                                          </div>
                                        )}
                                        <div className="text-left">
                                          <p className="text-xs text-purple-600 font-semibold mb-1">Prize Value</p>
                                          <p className="text-lg font-bold text-purple-900">
                                            ₹{config.prizeValue.toLocaleString()}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteAuctionSlot(auction.master_id, config.auctionNumber)}
                                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                          title="Delete auction slot"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )})}
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

{/* Email & Notifications Tabs */}
          {activeTab === 'emails' && (
            <>
              <AdminEmailManagement adminUserId={adminUser.user_id} />
            </>
          )}

          {activeTab === 'analytics' && (
            <AdminAnalyticsDashboard ref={analyticsRef} adminUserId={adminUser.user_id} />
          )}

{activeTab === 'notifications' && (
              <AdminPushNotifications adminUserId={adminUser.user_id} />
            )}

              {activeTab === 'userAnalytics' && isSuperAdmin && (
                <SuperAdminUserAnalytics adminUserId={adminUser.user_id} />
              )}

              {activeTab === 'vouchers' && (
                <AdminVoucherManagement adminUserId={adminUser.user_id} />
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
        {/* Status Confirmation Modal */}
        {showStatusConfirm.show && showStatusConfirm.auction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${showStatusConfirm.auction.isActive ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <AlertCircle className={`w-6 h-6 ${showStatusConfirm.auction.isActive ? 'text-amber-700' : 'text-green-700'}`} />
                  </div>
                  <button 
                    onClick={() => setShowStatusConfirm({ show: false, auction: null })}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {showStatusConfirm.auction.isActive ? 'Deactivate Master Auction?' : 'Activate Master Auction?'}
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to {showStatusConfirm.auction.isActive ? 'deactivate' : 'activate'} this master auction? 
                  {showStatusConfirm.auction.isActive 
                    ? ' This will prevent new daily auctions from being created from this master config.' 
                    : ' This will allow new daily auctions to be created automatically.'}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStatusConfirm({ show: false, auction: null })}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showStatusConfirm.auction) {
                        handleToggleActiveStatus(showStatusConfirm.auction);
                        setShowStatusConfirm({ show: false, auction: null });
                      }
                    }}
                    className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                      showStatusConfirm.auction.isActive 
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' 
                        : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    Confirm {showStatusConfirm.auction.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
