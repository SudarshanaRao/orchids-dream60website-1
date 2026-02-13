import { API_ENDPOINTS } from './api-config';

// Convert VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const supportsPush = () => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasNotification = 'Notification' in window;
  const hasPushManager = 'PushManager' in window;

  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  // iOS/iPadOS 16.4+ exposes web push for installed PWAs only
  if (isIOS && isSafari && isStandalone && hasServiceWorker && hasNotification) {
    return true;
  }

  // Desktop Safari may only expose PushManager after SW is ready
  if (isSafari && hasServiceWorker && hasNotification) {
    return true;
  }

  return hasServiceWorker && hasNotification && hasPushManager;
};

// Request notification permission (no auto-prompt if already decided)
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!supportsPush()) {
    console.warn('Push/Notifications not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission === 'granted') return 'granted';

  return Notification.requestPermission();
}

// Get VAPID public key from server
async function getVAPIDPublicKey(): Promise<string> {
  const response = await fetch(`${API_ENDPOINTS.pushNotification.vapidPublicKey}`);
  const data = await response.json();
  if (!data.success || !data.publicKey) {
    throw new Error('Failed to get VAPID public key');
  }
  return data.publicKey;
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!supportsPush()) return null;

  try {
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/service-worker.js');
    }

    // Wait until the SW is active/ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[Push] Service worker registration failed:', (err as Error).message);
    return null;
  }
}

function detectDeviceType(): 'PWA' | 'Web' {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  return isStandalone ? 'PWA' : 'Web';
}

async function createOrRefreshSubscription(registration: ServiceWorkerRegistration) {
    if (!registration.pushManager) {
      console.warn('PushManager not available on this registration');
      return null;
    }

    const existing = await registration.pushManager.getSubscription();

    if (existing && existing.expirationTime && existing.expirationTime - Date.now() < 3 * 24 * 60 * 60 * 1000) {
      try {
        await existing.unsubscribe();
      } catch (err) {
        console.warn('Unable to unsubscribe expired push subscription', err);
      }
    } else if (existing) {
      return existing;
    }

    const publicKey = await getVAPIDPublicKey();
    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }


async function persistSubscription(userId: string, subscription: PushSubscription, deviceType: 'PWA' | 'Web') {
  const payload = subscription.toJSON();

  const response = await fetch(`${API_ENDPOINTS.pushNotification.subscribe}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId,
      subscription: {
        endpoint: payload.endpoint,
        keys: payload.keys
      },
      deviceType
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to persist push subscription');
  }
}

  // Subscribe (or refresh) push notifications for a user
  export async function subscribeToPushNotifications(userId?: string): Promise<boolean> {
    try {
      // ✅ If userId not provided, try to get from localStorage/cookies
      let actualUserId = userId;
      if (!actualUserId) {
        actualUserId = localStorage.getItem('user_id') || 
                       getCookie('user_id') || 
                       '';
      }

      if (!actualUserId) {
        console.warn('❌ Cannot subscribe to push notifications: No user_id found');
        return false;
      }

      if (!supportsPush()) {
        console.warn('Push/Notifications not supported in this environment');
        return false;
      }

      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration || !registration.pushManager) {
        console.warn('No PushManager available on this service worker registration');
        return false;
      }

      const subscription = await createOrRefreshSubscription(registration);
      if (!subscription) return false;

      const deviceType = detectDeviceType();

      await persistSubscription(actualUserId, subscription, deviceType);
      localStorage.setItem('push-subscribed', 'true');
      localStorage.setItem('push-permission-asked', 'true');
      localStorage.setItem('push-user-id', actualUserId); // ✅ Store for future reference
      
      console.log('✅ Push notification subscribed successfully for user:', actualUserId);
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }


// ✅ Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    if (!supportsPush()) return false;

    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;

    await subscription.unsubscribe();

    await fetch(`${API_ENDPOINTS.pushNotification.unsubscribe}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, endpoint: subscription.endpoint })
    });

    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if user is subscribed to push notifications
  export async function isSubscribedToPushNotifications(): Promise<boolean> {
    try {
      if (!supportsPush()) return false;

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.pushManager) return false;

      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking push notification subscription:', error);
      return false;
    }
  }


// Helper: high-level support status for UI
export const getPushSupportStatus = () => ({
  supported: supportsPush(),
  permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied'
});
