import { useState } from 'react';
import { Bell, Send, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

export function AdminPushNotifications() {
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    url: '/'
  });
  const [isSending, setIsSending] = useState(false);

  const handleSendToAll = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      setIsSending(true);
      const response = await fetch(API_ENDPOINTS.pushNotification.sendToAll, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Notification sent to ${data.successfulSends} users!`);
        // Reset form
        setNotificationData({
          title: '',
          body: '',
          url: '/'
        });
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

          {/* Preview */}
          {(notificationData.title || notificationData.body) && (
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <p className="text-xs font-semibold text-purple-700 mb-2">PREVIEW</p>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <div className="flex gap-3">
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
                  Send to All Subscribers
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4">Quick Messages</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
