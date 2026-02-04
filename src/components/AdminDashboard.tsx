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
      MessageSquare,
    } from 'lucide-react';

import { toast } from 'sonner';
import { API_BASE_URL as API_BASE } from '@/lib/api-config';
import { AdminEmailManagement } from './AdminEmailManagement';
  import { AdminPushNotifications } from './AdminPushNotifications';
  import { CreateMasterAuctionModal } from './CreateMasterAuctionModal';
  import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
  import { SuperAdminUserAnalytics } from './SuperAdminUserAnalytics';
  import { AdminVoucherManagement } from './AdminVoucherManagement';
  import { AdminSmsManagement } from './AdminSmsManagement';
import { AdminDailyAuctions } from './AdminDailyAuctions';
import { AdminHourlyAuctions } from './AdminHourlyAuctions';
import { AdminRefundManagement } from './AdminRefundManagement';


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
  editingProductIndex?: number;
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
      const validTabs = ['overview', 'users', 'auctions', 'daily-auctions', 'hourly-auctions', 'refunds', 'analytics', 'emails', 'sms', 'notifications', 'userAnalytics', 'vouchers'] as const;
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
    const [expandedAuctions, setExpandedAuctions] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    
    const [usersPage, setUsersPage] = useState(1);
    const [usersLimit] = useState(20);
    const [paginatedUsers, setUsers] = useState<CombinedUser[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    const analyticsRef = useRef<{ refresh: () => Promise<void> }>(null);
    
    const isSuperAdmin = adminUser.isSuperAdmin === true;

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/admin/users?user_id=${adminUser.user_id}&page=${usersPage}&limit=${usersLimit}&search=${searchTerm}`
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setTotalUsers(data.meta.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, usersPage, searchTerm]);

  const Pagination = ({ 
    currentPage, 
    totalItems, 
    pageSize, 
    onPageChange,
    loading = false
  }: { 
    currentPage: number, 
    totalItems: number, 
    pageSize: number, 
    onPageChange: (page: number) => void,
    loading?: boolean
  }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1 && totalItems > 0) return null;
    if (totalItems === 0) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-xl shadow-sm border-2 border-purple-100">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || loading}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || loading}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || loading}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/admin/statistics?user_id=${adminUser.user_id}`
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
        `${API_BASE}/admin/master-auctions/?user_id=${adminUser.user_id}`
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

    const toggleAuctionExpand = (masterId: string) => {
      setExpandedAuctions(prev => {
        const next = new Set(prev);
        if (next.has(masterId)) {
          next.delete(masterId);
        } else {
          next.add(masterId);
        }
        return next;
      });
    };

    const handleToggleAuctionStatus = async (auction: MasterAuction) => {
      const newStatus = !auction.isActive;
      const statusText = newStatus ? 'active' : 'inactive';
      
      if (!confirm(`Are you sure you want to change the status of this master auction to ${statusText}?`)) {
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/admin/master-auctions/${auction.master_id}?user_id=${adminUser.user_id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ...auction,
              isActive: newStatus 
            }),
          }
        );
        const data = await response.json();

        if (data.success) {
          toast.success(`Master auction is now ${statusText}`);
          fetchMasterAuctions();
        } else {
          toast.error(data.message || 'Failed to update status');
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Failed to update status');
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
        `${API_BASE}/admin/master-auctions/${masterId}?user_id=${adminUser.user_id}`,
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
        `${API_BASE}/admin/master-auctions/${masterId}/slots/${auctionNumber}?user_id=${adminUser.user_id}`,
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

    // Edit a specific product within a master auction
    const handleEditProductInAuction = (auction: MasterAuction, auctionNumber: number) => {
      setEditingAuction({
        ...auction,
        editingProductIndex: auctionNumber
      });
      setShowCreateAuction(true);
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
          <div className="flex gap-2 mt-4 border-b border-purple-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
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
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
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
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'auctions'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Trophy className="w-5 h-5 inline-block mr-2" />
                Master Auctions
              </button>
              <button
                onClick={() => setActiveTab('daily-auctions')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'daily-auctions'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Calendar className="w-5 h-5 inline-block mr-2" />
                Daily Auctions
              </button>
              <button
                onClick={() => setActiveTab('hourly-auctions')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'hourly-auctions'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Clock className="w-5 h-5 inline-block mr-2" />
                Hourly Auctions
              </button>
              <button
                onClick={() => setActiveTab('refunds')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'refunds'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <IndianRupee className="w-5 h-5 inline-block mr-2" />
                Refunds
              </button>
              <button
                onClick={() => setActiveTab('emails')}
              className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                activeTab === 'emails'
                  ? 'text-purple-700 border-b-2 border-purple-700'
                  : 'text-purple-500 hover:text-purple-700'
              }`}
            >
<Mail className="w-5 h-5 inline-block mr-2" />
                Email Management
              </button>
              {/* Added Analytics tab */}
              <button
                onClick={() => setActiveTab('sms')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap flex items-center ${
                  activeTab === 'sms'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                SMS Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <BarChart3 className="w-5 h-5 inline-block mr-2" />
                Analytics
              </button>
              {/* Added Notifications tab */}
<button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Bell className="w-5 h-5 inline-block mr-2" />
                Push Notifications
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab('userAnalytics')}
                  className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'userAnalytics'
                      ? 'text-purple-700 border-b-2 border-purple-700'
                      : 'text-purple-500 hover:text-purple-700'
                  }`}
                >
                  <Eye className="w-5 h-5 inline-block mr-2" />
                  User Tracking
                </button>
              )}
              <button
                onClick={() => setActiveTab('vouchers')}
                className={`px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'vouchers'
                    ? 'text-purple-700 border-b-2 border-purple-700'
                    : 'text-purple-500 hover:text-purple-700'
                }`}
              >
                <Ticket className="w-5 h-5 inline-block mr-2" />
                Voucher Management
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

          {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search Bar and Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setUsersPage(1); // Reset to page 1 on search
                        }}
                        placeholder="Search users by username, email, mobile, or user code..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
  
              {/* All Users Table */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200 overflow-hidden relative">
                {isUsersLoading && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-purple-900 mb-4">All Users ({totalUsers})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">User Code</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Username</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Mobile</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Auctions</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Wins</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Spent</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Won</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">No users found matching your search</td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user: CombinedUser) => (
                          <tr key={user.user_id} className="border-b border-purple-100 hover:bg-purple-50">
                            <td className="py-3 px-4 font-mono text-sm">{user.userCode}</td>
                            <td className="py-3 px-4 font-medium text-purple-900">{user.username}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{user.mobile || 'N/A'}</td>
                            <td className="py-3 px-4">{user.totalAuctions || 0}</td>
                            <td className="py-3 px-4 font-semibold text-green-600">{user.totalWins || 0}</td>
                            <td className="py-3 px-4">₹{(user.totalAmountSpent || 0).toLocaleString()}</td>
                            <td className="py-3 px-4">₹{(user.totalAmountWon || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Pagination 
                  currentPage={usersPage}
                  totalItems={totalUsers}
                  pageSize={usersLimit}
                  onPageChange={setUsersPage}
                  loading={isUsersLoading}
                />
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
                          {/* Cumulative Totals */}
                          {(() => {
                            const totalEntryFees = auction.dailyAuctionConfig?.reduce((sum, cfg) => {
                              if (cfg.EntryFee === 'RANDOM') {
                                return sum + ((cfg.minEntryFee || 0) + (cfg.maxEntryFee || 0)) / 2;
                              }
                              return sum + ((cfg.FeeSplits?.BoxA || 0) + (cfg.FeeSplits?.BoxB || 0));
                            }, 0) || 0;
                            const totalPrizeWorth = auction.dailyAuctionConfig?.reduce((sum, cfg) => sum + (cfg.prizeValue || 0), 0) || 0;
                            return (
                              <div className="flex items-center gap-3 mr-2 text-xs">
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold">
                                  Total Fees: ₹{totalEntryFees.toLocaleString()}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                                  Total Worth: ₹{totalPrizeWorth.toLocaleString()}
                                </span>
                              </div>
                            );
                          })()}
                          <button
                            onClick={() => handleToggleAuctionStatus(auction)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm shadow-sm transition-all ${
                              auction.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                            title={`Click to make ${auction.isActive ? 'Inactive' : 'Active'}`}
                          >
                            {auction.isActive ? (
                              <><Power className="w-4 h-4" /> Active</>
                            ) : (
                              <><Power className="w-4 h-4" /> Inactive</>
                            )}
                          </button>
                          <button
                            onClick={() => toggleAuctionExpand(auction.master_id)}
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1 text-purple-700 font-semibold text-sm"
                            title={expandedAuctions.has(auction.master_id) ? "Collapse" : "Expand to see products"}
                          >
                            {expandedAuctions.has(auction.master_id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <><ChevronDown className="w-5 h-5" /> View Products ({auction.dailyAuctionConfig?.length || 0})</>
                            )}
                          </button>
                          <button
                            onClick={() => handleEditAuction(auction)}
                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                            title="Edit auction"
                          >
                            <Edit className="w-5 h-5 text-purple-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteAuction(auction.master_id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete auction"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
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

                    {expandedAuctions.has(auction.master_id) && auction.dailyAuctionConfig && auction.dailyAuctionConfig.length > 0 && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <h4 className="font-bold text-base text-purple-900 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Auction Slots
                        </h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
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
                                              <p className="text-xs text-purple-500 mt-1">
                                                Entry Fee: {config.EntryFee === 'RANDOM'
                                                  ? `₹${config.minEntryFee || 0} - ₹${config.maxEntryFee || 0}`
                                                  : `₹${((config.FeeSplits?.BoxA || 0) + (config.FeeSplits?.BoxB || 0)).toLocaleString()}`}
                                              </p>

                                          </div>
                                        <button
                                          onClick={() => handleEditProductInAuction(auction, config.auctionNumber)}
                                          className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                          title="Edit this product"
                                        >
                                          <Edit className="w-4 h-4 text-purple-600" />
                                        </button>
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

{/* Email & Notifications Tabs */}
          {activeTab === 'emails' && (
            <>
              <AdminEmailManagement adminUserId={adminUser.user_id} />
            </>
          )}

          {activeTab === 'sms' && (
            <AdminSmsManagement adminUserId={adminUser.user_id} />
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

                {activeTab === 'daily-auctions' && (
                  <AdminDailyAuctions adminUserId={adminUser.user_id} />
                )}

                {activeTab === 'hourly-auctions' && (
                  <AdminHourlyAuctions adminUserId={adminUser.user_id} />
                )}

                {activeTab === 'refunds' && (
                  <AdminRefundManagement adminUserId={adminUser.user_id} />
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