import { useState } from 'react';
import { Bell, BellOff, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

interface NotificationPermissionCardProps {
  userId?: string;
  compact?: boolean;
  showTitle?: boolean;
}

export function NotificationPermissionCard({ 
  userId, 
  compact = false,
  showTitle = true 
}: NotificationPermissionCardProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnableNotifications = async () => {
    if (!userId) {
      toast.error('Please log in to enable notifications');
      return;
    }

    try {
      setIsProcessing(true);
      const success = await subscribe();
      
      if (success) {
        toast.success('🎉 Notifications enabled!', {
          description: 'You will now receive updates about auctions and winners.',
        });
      } else {
        toast.error('Failed to enable notifications', {
          description: 'Please check your browser settings and try again.',
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Something went wrong', {
        description: 'Unable to enable notifications at this time.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableNotifications = async () => {
    if (!userId) {
      return;
    }

    try {
      setIsProcessing(true);
      const success = await unsubscribe();
      
      if (success) {
        toast.success('Notifications disabled', {
          description: 'You will no longer receive push notifications.',
        });
      } else {
        toast.error('Failed to disable notifications');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

    if (!isSupported) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Enable push notifications
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Use a supported browser on HTTPS. On iPhone/iPad (iOS 16.4+), add Dream60 to your Home Screen and open it from there to allow notifications.
              </p>
            </div>
          </div>
        </div>
      );
    }


  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Notifications blocked
            </p>
            <p className="text-xs text-red-600 mt-1">
              You've blocked notifications for this site. Please enable them in your browser settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={isSubscribed ? handleDisableNotifications : handleEnableNotifications}
        disabled={isLoading || isProcessing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${isSubscribed 
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading || isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Check className="w-4 h-4" />
            <span>Notifications On</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            <span>Enable Notifications</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 shadow-sm">
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Bell className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Push Notifications
          </h3>
        </div>
      )}

      {isSubscribed ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Notifications enabled
              </p>
              <p className="text-xs text-gray-600 mt-1">
                You'll receive updates about new auctions, round starts, and winner announcements.
              </p>
            </div>
          </div>

          <button
            onClick={handleDisableNotifications}
            disabled={isProcessing}
            className="
              w-full flex items-center justify-center gap-2 
              px-4 py-2.5 rounded-lg font-medium text-sm
              bg-white border border-gray-300 text-gray-700
              hover:bg-gray-50 hover:border-gray-400
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Disabling...</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4" />
                <span>Disable Notifications</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Stay updated with real-time notifications about:
          </p>
          
          <ul className="space-y-2 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              <span>New auction rounds starting</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              <span>Winner announcements</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              <span>Important auction updates</span>
            </li>
          </ul>

            <button
              onClick={handleEnableNotifications}
              disabled={isLoading || isProcessing || !userId}
              className="
                w-full flex items-center justify-center gap-2 
                px-4 py-3 rounded-lg font-semibold text-sm
                bg-gradient-to-r from-purple-600 to-indigo-600 text-white
                hover:from-purple-700 hover:to-indigo-700
                transition-all duration-200 shadow-md hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:hover:from-purple-600 disabled:hover:to-indigo-600
              "
              data-tutorial-target="enable-notifications" data-whatsnew-target="enable-notifications"
            >

            {isLoading || isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enabling...</span>
              </>
            ) : (
              <>
                <Bell className="w-5 h-5" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>

          {!userId && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Please log in to enable notifications
            </p>
          )}
        </div>
      )}
    </div>
  );
}
