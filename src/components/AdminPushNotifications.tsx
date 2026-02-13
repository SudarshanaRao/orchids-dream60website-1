import { useState, useEffect } from 'react';
import { Bell, Send, Users, Loader2, Smartphone, Monitor, Sparkles, Trash2, Volume2, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL, API_ENDPOINTS } from '@/lib/api-config';

interface SubscriptionUser {
  subscriptionId?: string;
  _id?: string;
  endpoint?: string;
  userId: string;
  username: string;
  email: string;
  mobile?: string;
  userCode: string;
  deviceType: 'PWA' | 'Web';
  createdAt: string;
  lastUsed: string;
}

interface SubscriptionStats {
  summary: {
    totalActive: number;
    totalInactive: number;
    pwaCount: number;
    webCount: number;
  };
  pwaUsers: SubscriptionUser[];
  webUsers: SubscriptionUser[];
}

interface User {
  username: string;
  mobile: string;
  email: string;
  user_id: string;
  userCode: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    bidAlerts: boolean;
    winNotifications: boolean;
  };
}

interface AdminPushNotificationsProps {
  adminUserId?: string;
}

const NOTIFICATION_SOUNDS = [
  { id: 'none', label: 'No Sound (Silent)', file: '' },
  { id: 'classic-alert', label: 'Classic Alert', file: '/sounds/classic-alert.wav' },
  { id: 'gentle-chime', label: 'Gentle Chime', file: '/sounds/gentle-chime.wav' },
  { id: 'urgent-alarm', label: 'Urgent Alarm', file: '/sounds/urgent-alarm.wav' },
  { id: 'success-fanfare', label: 'Success Fanfare', file: '/sounds/success-fanfare.wav' },
  { id: 'soft-pop', label: 'Soft Pop', file: '/sounds/soft-pop.wav' },
  { id: 'digital-ring', label: 'Digital Ring', file: '/sounds/digital-ring.wav' },
  { id: 'warning-siren', label: 'Warning Siren', file: '/sounds/warning-siren.wav' },
  { id: 'auction-bell', label: 'Auction Bell', file: '/sounds/auction-bell.wav' },
];

export function AdminPushNotifications({ adminUserId }: AdminPushNotificationsProps) {
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    url: '/'
  });
  const [selectedSound, setSelectedSound] = useState('classic-alert');
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [richNotificationData, setRichNotificationData] = useState({
    icon: '/icons/icon-192x192.png',
    image: '',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [] as Array<{ action: string; title: string; icon?: string }>
  });
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState<SubscriptionStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [usersWithBidAlerts, setUsersWithBidAlerts] = useState<User[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [selectedSubscriptions, setSelectedSubscriptions] = useState<Set<string>>(new Set());
    const [allSubscribedUsers, setAllSubscribedUsers] = useState<SubscriptionUser[]>([]);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const adminId = adminUserId || localStorage.getItem('admin_user_id');

  const getSubscriptionKey = (user: SubscriptionUser) =>
    user.subscriptionId || user._id || user.endpoint || '';

  const allSubscriptionKeys = allSubscribedUsers
    .map(getSubscriptionKey)
    .filter(Boolean);

  useEffect(() => {
    fetchSubscriptionStats();
    fetchUsersWithBidAlerts();
  }, []);

  const handlePreviewSound = (soundId: string) => {
    const sound = NOTIFICATION_SOUNDS.find(s => s.id === soundId);
    if (!sound || !sound.file) return;

    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    if (playingSound === soundId) {
      setPlayingSound(null);
      return;
    }

    const audio = new Audio(sound.file);
    audio.onended = () => setPlayingSound(null);
    audio.play().catch(() => toast.error('Could not play sound'));
    setAudioRef(audio);
    setPlayingSound(soundId);
  };

  const fetchUsersWithBidAlerts = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await fetch(`${API_BASE_URL}/auth/users`);
      const data = await response.json();

      if (data.success && data.users) {
        // Filter users who have bidAlerts enabled
        const alertUsers = data.users.filter((user: User) => user.preferences?.bidAlerts === true);
        setUsersWithBidAlerts(alertUsers);
        console.log(`✅ Found ${alertUsers.length} users with bidAlerts enabled`);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

    const fetchSubscriptionStats = async () => {
      try {
        setIsLoadingStats(true);
        
        if (!adminId) {
          toast.error('Admin session expired');
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/admin/push-subscriptions?user_id=${adminId}`
        );
        const data = await response.json();

        if (data.success) {
          const normalizedPwa = (data.data.pwaUsers || []).map((user: SubscriptionUser) => ({
            ...user,
            subscriptionId: user.subscriptionId || user._id || ''
          }));
          const normalizedWeb = (data.data.webUsers || []).map((user: SubscriptionUser) => ({
            ...user,
            subscriptionId: user.subscriptionId || user._id || ''
          }));

          setStats({
            ...data.data,
            pwaUsers: normalizedPwa,
            webUsers: normalizedWeb
          });
          // Combine PWA and Web users into a single array
          const allUsers = [...normalizedPwa, ...normalizedWeb];
          setAllSubscribedUsers(allUsers);
        } else {
          toast.error(data.message || 'Failed to load subscription stats');
        }
      } catch (error) {
        console.error('Error fetching subscription stats:', error);
        toast.error('Failed to load subscription stats');
      } finally {
        setIsLoadingStats(false);
      }
    };


  const handleSelectAll = () => {
    if (selectedSubscriptions.size === allSubscriptionKeys.length) {
      setSelectedSubscriptions(new Set());
    } else {
      const allIds = new Set(allSubscriptionKeys);
      setSelectedSubscriptions(allIds);
    }
  };

  const handleToggleSubscription = (subscriptionId: string) => {
    if (!subscriptionId) return;
    const next = new Set(selectedSubscriptions);
    if (next.has(subscriptionId)) {
      next.delete(subscriptionId);
    } else {
      next.add(subscriptionId);
    }
    setSelectedSubscriptions(next);
  };

  const handleSendToSelected = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast.error('Please fill in title and message');
      return;
    }

    if (selectedSubscriptions.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    const resolvedAdminId = adminUserId || localStorage.getItem('admin_user_id');
    if (!resolvedAdminId) {
      toast.error('Admin session expired. Please login again.');
      return;
    }

      const selectedUserIds = allSubscribedUsers
        .filter(u => selectedSubscriptions.has(getSubscriptionKey(u)))
        .map(u => u.userId)
        .filter(Boolean);

      const uniqueUserIds = Array.from(new Set(selectedUserIds));
      const subscriptionIds = Array.from(selectedSubscriptions);

      try {
        setIsSending(true);
        const response = await fetch(`${API_ENDPOINTS.pushNotification.sendToSelected}?user_id=${resolvedAdminId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': resolvedAdminId
          },
            body: JSON.stringify({
              ...notificationData,
              ...richNotificationData,
              sound: NOTIFICATION_SOUNDS.find(s => s.id === selectedSound)?.file || '',
              soundId: selectedSound,
              userIds: uniqueUserIds,
              subscriptionIds,
              adminId: resolvedAdminId,
              user_id: resolvedAdminId
            })
        });


      const data = await response.json();

      if (data.success) {
        toast.success(
          `Notification sent successfully!`,
          {
            description: `Sent to ${uniqueUserIds.length} selected user(s)`,
            duration: 5000,
          }
        );

        console.log('📧 Push Notification Sent to Selected Users:');
        console.log(`   Title: ${notificationData.title}`);
        console.log(`   Total Recipients: ${uniqueUserIds.length}`);

        // Reset form and selections
        setNotificationData({
          title: '',
          body: '',
          url: '/'
        });
        setRichNotificationData({
          icon: '/icons/icon-192x192.png',
          image: '',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          actions: []
        });
        setSelectedSubscriptions(new Set());

        fetchSubscriptionStats();
      } else {
        toast.error(data.message || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
      toast.error('Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToAll = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast.error('Please fill in title and message');
      return;
    }

    const resolvedAdminId = adminUserId || localStorage.getItem('admin_user_id');
    if (!resolvedAdminId) {
      toast.error('Admin session expired. Please login again.');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(`${API_ENDPOINTS.pushNotification.sendToAll}?user_id=${resolvedAdminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': resolvedAdminId
        },
          body: JSON.stringify({
            ...notificationData,
            ...richNotificationData,
            sound: NOTIFICATION_SOUNDS.find(s => s.id === selectedSound)?.file || '',
            soundId: selectedSound,
            adminId: resolvedAdminId,
            user_id: resolvedAdminId
          })
      });

      const data = await response.json();

      if (data.success) {
        // Show detailed success message with user information
        toast.success(
          `Notification sent successfully!`,
          {
            description: data.recipients && data.recipients.length > 0 ? 
              `Sent to: ${data.recipients.map((r: any) => r.username).join(', ')}` : 
              `Sent to ${data.successfulSends} subscribed users`,
            duration: 8000,
          }
        );

        // Log detailed recipient information
        console.log('📧 Push Notification Sent Successfully:');
        console.log(`   Title: ${notificationData.title}`);
        console.log(`   Total Recipients: ${data.successfulSends || 0}`);
        if (data.recipients && data.recipients.length > 0) {
          console.log('   Recipients:');
          data.recipients.forEach((recipient: any, index: number) => {
            console.log(`   ${index + 1}. ${recipient.username} (${recipient.email}) - ${recipient.deviceType}`);
          });
        }

        // Reset form
        setNotificationData({
          title: '',
          body: '',
          url: '/'
        });
        setRichNotificationData({
          icon: '/icons/icon-192x192.png',
          image: '',
          badge: '/icons/icon-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: false,
          actions: []
        });

        // Refresh subscription stats to show updated data
        fetchSubscriptionStats();
      } else {
        toast.error(data.message || 'Failed to send notifications');
      }
    } catch (error) {
      console.error('Error sending push notifications:', error);
      toast.error('Failed to send notifications');
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveSubscription = async (subscriptionId: string) => {
    if (!adminId) {
      toast.error('Admin session expired');
      return;
    }

    const confirmed = window.confirm('Remove this subscription from push notifications?');
    if (!confirmed) return;

    try {
      setRemovingId(subscriptionId);
      const response = await fetch(`${API_BASE_URL}/admin/push-subscriptions/${subscriptionId}?user_id=${adminId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast.success('Subscription removed');
        setSelectedSubscriptions((prev) => {
          const next = new Set(prev);
          next.delete(subscriptionId);
          return next;
        });
        setAllSubscribedUsers((prev) => prev.filter((user) => user.subscriptionId !== subscriptionId));
        setStats((prev) => {
          if (!prev) return prev;
          const isPwa = prev.pwaUsers.some((u) => u.subscriptionId === subscriptionId);
          const updatedPwa = prev.pwaUsers.filter((u) => u.subscriptionId !== subscriptionId);
          const updatedWeb = prev.webUsers.filter((u) => u.subscriptionId !== subscriptionId);
          return {
            ...prev,
            summary: {
              ...prev.summary,
              totalActive: Math.max(0, prev.summary.totalActive - 1),
              pwaCount: isPwa ? Math.max(0, prev.summary.pwaCount - 1) : prev.summary.pwaCount,
              webCount: !isPwa ? Math.max(0, prev.summary.webCount - 1) : prev.summary.webCount,
            },
            pwaUsers: updatedPwa,
            webUsers: updatedWeb,
          };
        });
      } else {
        toast.error(data.message || 'Failed to remove subscription');
      }
    } catch (error) {
      console.error('Error removing subscription', error);
      toast.error('Failed to remove subscription');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-6 h-6 text-purple-700" />
          <h2 className="text-xl font-bold text-purple-900">Push Notifications</h2>
        </div>
        <p className="text-sm text-purple-600">
          Send push notifications to all subscribed users
        </p>
      </div>

      {/* Subscription Statistics */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-purple-900">Select Recipients</h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedSubscriptions.size === allSubscriptionKeys.length && allSubscriptionKeys.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-purple-700 rounded border-purple-300 focus:ring-purple-500"
              />
              <label htmlFor="selectAll" className="text-sm font-semibold text-purple-900 cursor-pointer">
                Select All ({selectedSubscriptions.size}/{allSubscriptionKeys.length})
              </label>
            </div>
          </div>

        
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-700" />
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <p className="text-sm text-purple-600 font-semibold">Total Active</p>
                <p className="text-2xl font-bold text-purple-900">{stats.summary.totalActive}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <p className="text-sm text-green-600 font-semibold">PWA Users</p>
                <p className="text-2xl font-bold text-green-900">{stats.summary.pwaCount}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-sm text-blue-600 font-semibold">Web Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats.summary.webCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                <p className="text-sm text-gray-600 font-semibold">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{stats.summary.totalInactive}</p>
              </div>
            </div>

            {/* Two Column Layout - PWA vs Web */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PWA Users Column */}
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-green-700" />
                  <h4 className="font-bold text-green-900">PWA Users ({stats.summary.pwaCount})</h4>
                </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.pwaUsers.length === 0 ? (
                      <p className="text-sm text-green-600 text-center py-4">No PWA subscriptions yet</p>
                      ) : (
                        stats.pwaUsers.map((user) => {
                          const subscriptionKey = getSubscriptionKey(user);
                          const isSelected = selectedSubscriptions.has(subscriptionKey);
                          return (
                            <div 
                              key={subscriptionKey} 
                              onClick={() => handleToggleSubscription(subscriptionKey)}
                              className={`bg-white rounded-lg p-3 border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                                  : 'border-green-200 hover:bg-green-50'
                              }`}
                            >
                            <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Prevent double-toggle from div onClick
                                  }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSubscription(subscriptionKey);
                                    }}
                                  className="mt-1 w-4 h-4 text-green-700 rounded border-green-300 focus:ring-green-500"
                                />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{user.username || 'Unknown'}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Code: {user.userCode}</p>
                                <p className="text-xs text-green-600 mt-1">
                                  Last used: {new Date(user.lastUsed).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                    handleRemoveSubscription(subscriptionKey);
                                }}
                                disabled={removingId === subscriptionKey}
                                className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-md flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

              </div>

              {/* Web Users Column */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-blue-900">Web Users ({stats.summary.webCount})</h4>
                </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.webUsers.length === 0 ? (
                      <p className="text-sm text-blue-600 text-center py-4">No web subscriptions yet</p>
                      ) : (
                        stats.webUsers.map((user) => {
                          const subscriptionKey = getSubscriptionKey(user);
                          const isSelected = selectedSubscriptions.has(subscriptionKey);
                          return (
                            <div 
                              key={subscriptionKey} 
                              onClick={() => handleToggleSubscription(subscriptionKey)}
                              className={`bg-white rounded-lg p-3 border cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' 
                                  : 'border-blue-200 hover:bg-blue-50'
                              }`}
                            >
                            <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    // Prevent double-toggle from div onClick
                                  }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSubscription(subscriptionKey);
                                    }}
                                  className="mt-1 w-4 h-4 text-blue-700 rounded border-blue-300 focus:ring-blue-500"
                                />
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{user.username || 'Unknown'}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Code: {user.userCode}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Last used: {new Date(user.lastUsed).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                    handleRemoveSubscription(subscriptionKey);
                                }}
                                disabled={removingId === subscriptionKey}
                                className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-md flex items-center gap-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 text-center py-4">Failed to load statistics</p>
        )}
      </div>

      {/* Users with Bid Alerts Enabled */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
        <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Users Opted-In for Bid Alerts ({usersWithBidAlerts.length})
        </h3>
        <p className="text-sm text-orange-600 mb-4">
          These users have enabled "Bid Alerts" in their preferences and will receive notifications when they have an active device subscription.
        </p>
        
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-700" />
          </div>
        ) : usersWithBidAlerts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {usersWithBidAlerts.map((user) => (
              <div key={user.user_id} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="font-semibold text-sm text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Mobile: {user.mobile}</p>
                <p className="text-xs text-orange-700 mt-1 font-semibold">✓ Bid Alerts Enabled</p>
                <p className="text-xs text-gray-500">Code: {user.userCode}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-orange-600 text-center py-4">No users have enabled bid alerts yet</p>
        )}
      </div>

      {/* Notification Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              value={notificationData.title}
              onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
              placeholder="e.g., New Auction Starting!"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
            <p className="text-xs text-purple-500 mt-1">{notificationData.title.length}/50 characters</p>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              Notification Message *
            </label>
            <textarea
              value={notificationData.body}
              onChange={(e) => setNotificationData({ ...notificationData, body: e.target.value })}
              placeholder="e.g., Join now to win amazing prizes! Auction starts in 15 minutes."
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-purple-500 mt-1">{notificationData.body.length}/200 characters</p>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              Target URL (optional)
            </label>
            <input
              type="text"
              value={notificationData.url}
              onChange={(e) => setNotificationData({ ...notificationData, url: e.target.value })}
              placeholder="/"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-purple-500 mt-1">URL to open when user clicks the notification</p>
          </div>

          {/* Rich Notification Banner Image URL */}
          <div>
            <label className="block text-sm font-semibold text-purple-900 mb-2">
              Banner Image URL (optional) - Rich Notification
            </label>
            <input
              type="text"
              value={richNotificationData.image}
              onChange={(e) => setRichNotificationData({ ...richNotificationData, image: e.target.value })}
              placeholder="https://example.com/banner.jpg"
              className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-purple-500 mt-1">
              Add a banner image to create a Rich Notification. Image will be displayed prominently in the notification.
            </p>
                {richNotificationData.image && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-purple-700">IMAGE PREVIEW</p>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-gray-100 rounded-md border border-purple-200 overflow-hidden flex-shrink-0">
                        <img
                          src={richNotificationData.image}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif"%3EInvalid%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <p className="text-xs text-purple-600">Banner image preview</p>
                    </div>
                  </div>
                )}

          </div>

          {/* Preview */}
          {(notificationData.title || notificationData.body) && (
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <p className="text-xs font-semibold text-purple-700 mb-2">NOTIFICATION PREVIEW</p>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {notificationData.title || 'Notification Title'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notificationData.body || 'Notification message'}
                    </p>
                        {richNotificationData.image && (
                          <div className="mt-3">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-md overflow-hidden border border-purple-200">
                              <img
                                src={richNotificationData.image}
                                alt="Rich notification banner"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <p className="text-xs text-purple-600 mt-2 font-semibold">✨ Rich Notification with Banner Image</p>
                          </div>
                        )}

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSendToSelected}
                disabled={isSending || !notificationData.title || !notificationData.body || selectedSubscriptions.size === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-800 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-orange-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send to Selected ({selectedSubscriptions.size})
                  </>
                )}
              </button>

            <button
              onClick={handleSendToAll}
              disabled={isSending || !notificationData.title || !notificationData.body}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg font-semibold hover:from-purple-800 hover:to-purple-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to All Users
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4">Quick Messages</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => setNotificationData({
              title: 'Auction Starting Soon!',
              body: 'Join the next auction in 15 minutes. Don\'t miss your chance to win!',
              url: '/'
            })}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-purple-900">Auction Reminder</p>
            <p className="text-xs text-purple-600 mt-1">15-minute reminder</p>
          </button>
          
          <button
            onClick={() => setNotificationData({
              title: 'New Round Starting!',
              body: 'A new bidding round is about to begin. Place your bids now!',
              url: '/'
            })}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-purple-900">Round Alert</p>
            <p className="text-xs text-purple-600 mt-1">New round notification</p>
          </button>
          
          <button
            onClick={() => setNotificationData({
              title: 'Winners Announced!',
              body: 'Check the results now to see if you\'ve won the latest auction!',
              url: '/'
            })}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-purple-900">Winners Alert</p>
            <p className="text-xs text-purple-600 mt-1">Winner announcement</p>
          </button>
          
          <button
            onClick={() => setNotificationData({
              title: 'Special Offer!',
              body: 'Join today\'s premium auction with exclusive prizes!',
              url: '/'
            })}
            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-purple-900">Special Offer</p>
            <p className="text-xs text-purple-600 mt-1">Promotional message</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: 'Last Chance!',
              body: 'Only 5 minutes left to join! Don\'t miss this amazing opportunity!',
              url: '/'
            })}
            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-orange-900">Last Chance</p>
            <p className="text-xs text-orange-600 mt-1">Final 5 minutes alert</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '🏆 High Value Prize Alert!',
              body: 'Premium auction with exclusive high-value prizes is now live!',
              url: '/'
            })}
            className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-yellow-900">High Prize Alert</p>
            <p className="text-xs text-yellow-600 mt-1">Premium auction</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '🎉 Congratulations!',
              body: 'Check out today\'s winners and see their amazing prizes!',
              url: '/'
            })}
            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-green-900">Daily Winner</p>
            <p className="text-xs text-green-600 mt-1">Celebrate winners</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '💡 Pro Tip',
              body: 'Strategic bidding increases your chances! Join now and apply smart tactics.',
              url: '/'
            })}
            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-blue-900">Bidding Tips</p>
            <p className="text-xs text-blue-600 mt-1">Strategy reminder</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '✨ Lucky Draw Alert!',
              body: 'Special lucky draw event happening now! Everyone who joins has a chance to win bonus prizes!',
              url: '/'
            })}
            className="p-4 border-2 border-pink-200 rounded-lg hover:bg-pink-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-pink-900">Lucky Draw</p>
            <p className="text-xs text-pink-600 mt-1">Special event</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '⚡ Flash Sale!',
              body: 'Limited time offer! Reduced entry fees for the next auction only!',
              url: '/'
            })}
            className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-red-900">Flash Sale</p>
            <p className="text-xs text-red-600 mt-1">Time-limited offer</p>
          </button>

          <button
            onClick={() => setNotificationData({
              title: '🎁 New Prize Added!',
              body: 'Exciting new prize just added to today\'s auction lineup! Check it out now!',
              url: '/'
            })}
            className="p-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-left"
          >
            <p className="font-semibold text-sm text-indigo-900">New Prize</p>
            <p className="text-xs text-indigo-600 mt-1">Showcase new items</p>
          </button>
        </div>
      </div>

      {/* Rich Notification Templates */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg p-6 border-2 border-purple-300">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-purple-700" />
          <h3 className="text-lg font-bold text-purple-900">Rich Notification Templates</h3>
        </div>
        <p className="text-sm text-purple-600 mb-4">
          Pre-configured templates with banner images for professional notifications
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template 1: Auction Starting */}
          <button
            onClick={() => {
              setNotificationData({
                title: '🎯 Auction Starting in 15 Minutes!',
                body: 'Get ready to place your bids! The next auction round is about to begin. Join now and win amazing prizes!',
                url: '/'
              });
              setRichNotificationData({
                ...richNotificationData,
                image: 'https://images.unsplash.com/photo-1556742400-b5b7c6a5d9e0?w=800&h=400&fit=crop&q=80'
              });
            }}
            className="group relative bg-white rounded-xl overflow-hidden border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-lg"
          >
            <div className="aspect-video max-h-40 bg-gradient-to-br from-purple-400 to-violet-600 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1556742400-b5b7c6a5d9e0?w=800&h=400&fit=crop&q=80"
                alt="Auction starting"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-bold text-sm">🎯 Auction Starting Soon</p>
                <p className="text-white/90 text-xs mt-1">15-minute countdown notification</p>
              </div>
            </div>
          </button>

          {/* Template 2: Winner Announcement */}
          <button
            onClick={() => {
              setNotificationData({
                title: '🏆 Winner Announced!',
                body: 'The auction has ended! Check if you won the grand prize. View the results now!',
                url: '/history'
              });
              setRichNotificationData({
                ...richNotificationData,
                image: 'https://images.unsplash.com/photo-1533158628620-7e35717d36e8?w=800&h=400&fit=crop&q=80'
              });
            }}
            className="group relative bg-white rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg"
          >
            <div className="aspect-video max-h-40 bg-gradient-to-br from-amber-400 to-orange-600 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1533158628620-7e35717d36e8?w=800&h=400&fit=crop&q=80"
                alt="Winner announcement"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-bold text-sm">🏆 Winner Announcement</p>
                <p className="text-white/90 text-xs mt-1">Celebrate the winners</p>
              </div>
            </div>
          </button>

          {/* Template 3: New Round Alert */}
          <button
            onClick={() => {
              setNotificationData({
                title: '⚡ New Round Started!',
                body: 'Round 2 is now live! Place your bids quickly before time runs out. Higher bids win bigger prizes!',
                url: '/'
              });
              setRichNotificationData({
                ...richNotificationData,
                image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=400&fit=crop&q=80'
              });
            }}
            className="group relative bg-white rounded-xl overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg"
          >
            <div className="aspect-video max-h-40 bg-gradient-to-br from-blue-400 to-indigo-600 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=400&fit=crop&q=80"
                alt="New round"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-bold text-sm">⚡ New Round Alert</p>
                <p className="text-white/90 text-xs mt-1">Notify users of new round</p>
              </div>
            </div>
          </button>

          {/* Template 4: Bid Update */}
          <button
            onClick={() => {
              setNotificationData({
                title: '📈 Your Bid is Leading!',
                body: 'Congratulations! Your bid is currently in the lead. Keep an eye on the auction to maintain your position!',
                url: '/'
              });
              setRichNotificationData({
                ...richNotificationData,
                image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&q=80'
              });
            }}
            className="group relative bg-white rounded-xl overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-lg"
          >
            <div className="aspect-video max-h-40 bg-gradient-to-br from-green-400 to-emerald-600 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&q=80"
                alt="Bid update"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-bold text-sm">📈 Bid Status Update</p>
                <p className="text-white/90 text-xs mt-1">Inform users about their bid position</p>
              </div>
            </div>
          </button>

          {/* Template 5: Last Chance */}
          <button
            onClick={() => {
              setNotificationData({
                title: '⏰ Last 5 Minutes!',
                body: 'The auction is ending soon! Place your final bids now before it\'s too late. Don\'t miss out!',
                url: '/'
              });
              setRichNotificationData({
                ...richNotificationData,
                image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&h=400&fit=crop&q=80'
              });
            }}
            className="group relative bg-white rounded-xl overflow-hidden border-2 border-red-200 hover:border-red-400 transition-all hover:shadow-lg"
          >
            <div className="aspect-video max-h-40 bg-gradient-to-br from-red-400 to-rose-600 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&h=400&fit=crop&q=80"
                alt="Last chance"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white font-bold text-sm">⏰ Last Chance Alert</p>
                <p className="text-white/90 text-xs mt-1">Urgency notification for ending soon</p>
              </div>
            </div>
          </button>

            {/* Template 6: Special Offer */}
            <button
              onClick={() => {
                setNotificationData({
                  title: '🎁 Special Offer: Double Prize!',
                  body: 'This round has a special double prize pool! Join now for your chance to win 2x the rewards!',
                  url: '/'
                });
                setRichNotificationData({
                  ...richNotificationData,
                  image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=400&fit=crop&q=80'
                });
              }}
              className="group relative bg-white rounded-xl overflow-hidden border-2 border-pink-200 hover:border-pink-400 transition-all hover:shadow-lg"
            >
              <div className="aspect-video max-h-40 bg-gradient-to-br from-pink-400 to-purple-600 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=400&fit=crop&q=80"
                  alt="Special offer"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-bold text-sm">🎁 Special Promotion</p>
                  <p className="text-white/90 text-xs mt-1">Highlight special offers and events</p>
                </div>
              </div>
            </button>

            {/* Template 7: Dream60 Festival Wishes */}
            <button
              onClick={() => {
                setNotificationData({
                  title: '🎊 Dream60 Festival Wishes!',
                  body: 'Team Dream60 wishes you a joyful festival! Join us for special drops, gifts, and dazzling auctions today.',
                  url: '/'
                });
                setRichNotificationData({
                  ...richNotificationData,
                  image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=500&fit=crop&q=80'
                });
              }}
              className="group relative bg-white rounded-xl overflow-hidden border-2 border-amber-200 hover:border-amber-400 transition-all hover:shadow-lg"
            >
              <div className="aspect-video max-h-40 bg-gradient-to-br from-amber-400 to-rose-500 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=500&fit=crop&q=80"
                  alt="Festival wishes"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white font-bold text-sm">🎉 Dream60 Festival Wishes</p>
                  <p className="text-white/90 text-xs mt-1">Bright, festive, and brand-forward</p>
                </div>
              </div>
            </button>
          </div>
        </div>


      {/* Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Users className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">About Push Notifications</p>
            <p className="text-sm text-blue-700 mt-1">
              Notifications are sent to all users who have subscribed to push notifications on their devices.
              Users must grant permission and be logged in to receive notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}