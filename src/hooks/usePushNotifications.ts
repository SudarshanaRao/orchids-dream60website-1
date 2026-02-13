import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications,
  getPushSupportStatus,
  requestNotificationPermission
} from '@/lib/pushNotifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const subscribed = await isSubscribedToPushNotifications();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const result = await requestNotificationPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return 'denied';
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      console.warn('Cannot subscribe: userId is required');
      return false;
    }

    try {
      setIsLoading(true);
      const success = await subscribeToPushNotifications(userId);
      
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        
        // Send welcome notification from server (optional)
        // You could call an API endpoint here to send a welcome notification
      }
      
      return success;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) {
      console.warn('Cannot unsubscribe: userId is required');
      return false;
    }

    try {
      setIsLoading(true);
      const success = await unsubscribeFromPushNotifications(userId);
      
      if (success) {
        setIsSubscribed(false);
      }
      
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const initializeNotifications = async () => {
      const status = getPushSupportStatus();
      setIsSupported(status.supported);
      setPermission(status.permission);
      
      if (status.supported && status.permission === 'granted') {
        await checkSubscription();
      } else {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, [checkSubscription]);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      const handlePermissionChange = () => {
        setPermission(Notification.permission);
      };

      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' as PermissionName }).then((permissionStatus) => {
          permissionStatus.onchange = handlePermissionChange;
        });
      }
    }
  }, []);

  // Listen for PLAY_NOTIFICATION_SOUND messages from service worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
        const { sound } = event.data;
        if (sound) {
          try {
            const audio = new Audio(sound);
            audio.volume = 1.0;
            audio.play().catch((err) => {
              console.warn('[Push] Could not play notification sound:', err);
            });
          } catch (err) {
            console.warn('[Push] Error creating audio for notification sound:', err);
          }
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    checkSubscription,
    requestPermission
  };
}
