import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  Eye,
  Clock,
  Activity,
  Monitor,
  Smartphone,
  Search,
  RefreshCw,
  MousePointer,
  ArrowLeft,
  FileText,
  Download,
  Link as LinkIcon,
  Navigation,
  MousePointerClick,
  FormInput,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api-config';

interface UserActivitySummary {
  userId: string;
  username: string;
  totalSessions: number;
  totalActiveTime: number;
  totalPageViews: number;
  totalInteractions: number;
  lastSeen: string;
  isOnline: boolean;
  currentPage: string | null;
}

interface PageStat {
  path: string;
  views: number;
  totalTime: number;
}

interface PageViewDetail {
  page: string;
  path: string;
  enterTime: string;
  exitTime?: string;
  duration: number;
  scrollDepth: number;
}

interface InteractionDetail {
  type: string;
  element?: string;
  page?: string;
  path?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface SessionDetail {
  date: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  duration: number;
  deviceInfo: {
    userAgent?: string;
    platform?: string;
    screenWidth?: number;
    screenHeight?: number;
    isMobile?: boolean;
  };
  totalPageViews: number;
  totalInteractions: number;
  pageViews: PageViewDetail[];
  interactions: InteractionDetail[];
  isActive: boolean;
}

interface DailyBreakdown {
  date: string;
  dateStr: string;
  totalSessions: number;
  totalActiveTime: number;
  totalPageViews: number;
  totalInteractions: number;
  firstActivity: string;
  lastActivity: string;
}

interface UserActivityDetail {
  userId: string;
  username: string;
  viewType: string;
  startDate: string;
  endDate: string;
  currentSession: {
    sessionId: string;
    startTime: string;
    lastHeartbeat: string;
    currentPage: string;
    isActive: boolean;
  };
  lifetimeStats: {
    totalSessions: number;
    totalActiveTime: number;
    totalPageViews: number;
    totalInteractions: number;
    firstSeen: string;
    lastSeen: string;
    averageSessionDuration: number;
  };
  periodStats: {
    totalSessions: number;
    totalActiveTime: number;
    totalPageViews: number;
    totalInteractions: number;
    firstActivity: string;
    lastActivity: string;
  };
  pageStats: PageStat[];
  sessions: SessionDetail[];
  dailyBreakdown: DailyBreakdown[];
}

interface SuperAdminUserAnalyticsProps {
  adminUserId: string;
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6', '#f97316'];

type ViewType = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const interactionIcons: Record<string, React.ReactNode> = {
  download: <Download className="w-4 h-4 text-blue-500" />,
  button_click: <MousePointerClick className="w-4 h-4 text-purple-500" />,
  link_click: <LinkIcon className="w-4 h-4 text-green-500" />,
  navigation: <Navigation className="w-4 h-4 text-amber-500" />,
  form_submit: <FormInput className="w-4 h-4 text-pink-500" />,
  modal_open: <Eye className="w-4 h-4 text-indigo-500" />,
  modal_close: <Eye className="w-4 h-4 text-gray-500" />,
  click: <MousePointer className="w-4 h-4 text-gray-600" />,
  other: <Activity className="w-4 h-4 text-gray-400" />,
};

const getInteractionIcon = (type: string) => {
  return interactionIcons[type] || interactionIcons.other;
};

const getInteractionLabel = (type: string) => {
  const labels: Record<string, string> = {
    download: 'Downloaded',
    button_click: 'Clicked Button',
    link_click: 'Clicked Link',
    navigation: 'Navigated',
    form_submit: 'Submitted Form',
    modal_open: 'Opened Modal',
    modal_close: 'Closed Modal',
    click: 'Clicked',
    auction_join: 'Joined Auction',
    bid: 'Placed Bid',
    purchase: 'Made Purchase',
  };
  return labels[type] || type;
};

export function SuperAdminUserAnalytics({ adminUserId }: SuperAdminUserAnalyticsProps) {
  const [userList, setUserList] = useState<UserActivitySummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserActivityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<ViewType>('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const backendUrl = API_BASE_URL;

    const fetchUserList = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);
      const response = await fetch(`${backendUrl}/user-activity/admin/list?user_id=${adminUserId}&_t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        setUserList(data.data || []);
        setOnlineCount(data.data?.filter((u: UserActivitySummary) => u.isOnline).length || 0);
      } else {
        toast.error(data.message || 'Failed to fetch user list');
      }
    } catch (error) {
      console.error('Error fetching user list:', error);
      toast.error('Failed to fetch user activity list');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchUserDetail = async (userId: string, showLoading = true) => {
    try {
      if (showLoading) setIsLoadingDetail(true);
      let url = `${backendUrl}/user-activity/admin/user/${userId}?admin_user_id=${adminUserId}&viewType=${viewType}&_t=${Date.now()}`;
      if (viewType === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setUserDetail(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast.error('Failed to fetch user details');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedUser) {
      await fetchUserDetail(selectedUser, false);
    } else {
      await fetchUserList(false);
    }
    toast.success('Data refreshed');
  };

  useEffect(() => {
    fetchUserList();
    const interval = setInterval(fetchUserList, 60000);
    return () => clearInterval(interval);
  }, [adminUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserDetail(selectedUser);
    }
  }, [selectedUser, viewType]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const filteredUsers = userList.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedUser && userDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedUser(null);
              setUserDetail(null);
              setExpandedSessions(new Set());
            }}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to User List
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-purple-900">{userDetail.username}</h2>
              <p className="text-purple-600 text-sm">User ID: {userDetail.userId}</p>
              {userDetail.currentSession?.isActive && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-sm text-green-700">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Currently on:</span>
                    <span className="bg-green-50 px-2 py-0.5 rounded">{userDetail.currentSession.currentPage}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['today', 'yesterday', 'week', 'month', 'custom'] as ViewType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    viewType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {viewType === 'custom' && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-purple-50 rounded-xl">
              <span className="text-sm text-purple-700">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border-2 border-purple-200 rounded-lg"
              />
              <span className="text-sm text-purple-700">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border-2 border-purple-200 rounded-lg"
              />
              <button
                onClick={() => fetchUserDetail(selectedUser)}
                className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700"
              >
                Apply
              </button>
            </div>
          )}

          <div className="text-sm text-purple-600 mb-4">
            Range: {userDetail.startDate} to {userDetail.endDate}
          </div>
        </div>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{userDetail.periodStats.totalSessions}</span>
                </div>
                <p className="text-sm text-purple-600 font-medium">Sessions</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{formatDuration(userDetail.periodStats.totalActiveTime)}</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Active Time</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{userDetail.periodStats.totalPageViews}</span>
                </div>
                <p className="text-sm text-blue-600 font-medium">Page Views</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <MousePointer className="w-5 h-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-900">{userDetail.periodStats.totalInteractions}</span>
                </div>
                <p className="text-sm text-amber-600 font-medium">Interactions</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Page Time Distribution</h3>
                {userDetail.pageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={userDetail.pageStats.slice(0, 8)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="totalTime"
                        nameKey="path"
                        label={({ path, percent }) => `${path.split('/').pop() || 'Home'} ${(percent * 100).toFixed(0)}%`}
                      >
                        {userDetail.pageStats.slice(0, 8).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatDuration(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-purple-500">
                    No page data for this period
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4">Daily Activity</h3>
                {userDetail.dailyBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userDetail.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="totalPageViews" name="Page Views" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="totalSessions" name="Sessions" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-purple-500">
                    No daily data for this period
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Page Statistics</h3>
              {userDetail.pageStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-purple-200">
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Page</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Views</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Total Time</th>
                        <th className="text-left py-3 px-4 text-purple-700 font-semibold">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userDetail.pageStats.map((page, idx) => (
                        <tr key={idx} className="border-b border-purple-100 hover:bg-purple-50">
                          <td className="py-3 px-4 font-medium">{page.path || '/'}</td>
                          <td className="py-3 px-4">{page.views}</td>
                          <td className="py-3 px-4">{formatDuration(page.totalTime)}</td>
                          <td className="py-3 px-4">{formatDuration(Math.round(page.totalTime / (page.views || 1)))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-purple-500">No page statistics for this period</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Session History with Activity Timeline</h3>
              {userDetail.sessions.length > 0 ? (
                <div className="space-y-4">
                  {userDetail.sessions.map((session, idx) => (
                    <div key={idx} className={`rounded-lg border-2 ${session.isActive ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => toggleSessionExpand(session.sessionId)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {session.deviceInfo?.isMobile ? (
                              <Smartphone className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Monitor className="w-4 h-4 text-purple-600" />
                            )}
                            <span className="font-semibold text-purple-900">{session.date}</span>
                            {session.isActive && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Active</span>
                            )}
                            {expandedSessions.has(session.sessionId) ? (
                              <ChevronUp className="w-4 h-4 text-purple-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-600" />
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : 'Ongoing'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium">{formatDuration(session.duration)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Pages:</span>
                            <span className="ml-2 font-medium">{session.totalPageViews}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Interactions:</span>
                            <span className="ml-2 font-medium">{session.totalInteractions}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Device:</span>
                            <span className="ml-2 font-medium">{session.deviceInfo?.platform || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>

                      {expandedSessions.has(session.sessionId) && (
                        <div className="border-t-2 border-gray-200 p-4 bg-white rounded-b-lg">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Pages Visited ({session.pageViews.length})
                              </h4>
                              {session.pageViews.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {session.pageViews.map((pv, pvIdx) => (
                                    <div key={pvIdx} className="p-2 bg-purple-50 rounded-lg text-sm">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-purple-900">{pv.path || '/'}</span>
                                        <span className="text-purple-600">{formatDuration(pv.duration)}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <span>Enter: {formatTime(pv.enterTime)}</span>
                                        <span>Scroll: {pv.scrollDepth}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No page views recorded</p>
                              )}
                            </div>

                            <div>
                              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                <MousePointer className="w-4 h-4" />
                                User Actions ({session.interactions.length})
                              </h4>
                              {session.interactions.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                  {session.interactions.map((inter, interIdx) => (
                                    <div key={interIdx} className="p-2 bg-amber-50 rounded-lg text-sm">
                                      <div className="flex items-center gap-2">
                                        {getInteractionIcon(inter.type)}
                                        <span className="font-medium text-amber-900">
                                          {getInteractionLabel(inter.type)}
                                        </span>
                                      </div>
                                      {inter.element && (
                                        <div className="text-xs text-gray-600 mt-1 truncate">
                                          "{inter.element}"
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                                        <span>{inter.path || '/'}</span>
                                        <span>{formatTime(inter.timestamp)}</span>
                                      </div>
                                      {inter.metadata && Object.keys(inter.metadata).length > 0 && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          {inter.metadata.href && (
                                            <span className="truncate block">URL: {String(inter.metadata.href)}</span>
                                          )}
                                          {inter.metadata.fileName && (
                                            <span>File: {String(inter.metadata.fileName)}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No interactions recorded</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-purple-500">No sessions for this period</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <h3 className="text-lg font-bold text-purple-900 mb-4">Lifetime Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-purple-900">{userDetail.lifetimeStats.totalSessions}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600">Total Active Time</p>
                  <p className="text-2xl font-bold text-green-900">{formatDuration(userDetail.lifetimeStats.totalActiveTime)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total Page Views</p>
                  <p className="text-2xl font-bold text-blue-900">{userDetail.lifetimeStats.totalPageViews}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600">Avg Session Duration</p>
                  <p className="text-2xl font-bold text-amber-900">{formatDuration(userDetail.lifetimeStats.averageSessionDuration)}</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                First seen: {userDetail.lifetimeStats.firstSeen ? new Date(userDetail.lifetimeStats.firstSeen).toLocaleDateString('en-IN') : '-'} | 
                Last seen: {userDetail.lifetimeStats.lastSeen ? new Date(userDetail.lifetimeStats.lastSeen).toLocaleDateString('en-IN') : '-'}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-purple-700" />
            <h2 className="text-xl font-bold text-purple-900">User Activity Analytics</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-semibold">{onlineCount} Online</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-purple-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">User</th>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">Sessions</th>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">Active Time</th>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">Page Views</th>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">Interactions</th>
                    <th className="text-left py-4 px-6 text-purple-700 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      onClick={() => setSelectedUser(user.userId)}
                      className="border-b border-purple-100 hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="font-semibold text-purple-900">{user.username}</span>
                        <div className="text-xs text-gray-500">
                          Last: {user.lastSeen ? new Date(user.lastSeen).toLocaleString('en-IN') : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">{user.totalSessions}</td>
                      <td className="py-4 px-6">{formatDuration(user.totalActiveTime)}</td>
                      <td className="py-4 px-6">{user.totalPageViews}</td>
                      <td className="py-4 px-6">{user.totalInteractions || 0}</td>
                      <td className="py-4 px-6">
                        {user.isOnline ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Online
                            </span>
                            {user.currentPage && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{user.currentPage}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                            Offline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 border-2 border-purple-200 text-center">
          <Users className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-900 mb-2">No User Activity Data</h3>
          <p className="text-purple-600">User activity tracking will appear here once users start browsing.</p>
        </div>
      )}
    </div>
  );
}
