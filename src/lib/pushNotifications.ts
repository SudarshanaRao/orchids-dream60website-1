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

const supportsPush = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export function getStoredUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const localId = localStorage.getItem('user_id') || localStorage.getItem('userId');
    const sessionId = (typeof sessionStorage !== 'undefined')
      ? (sessionStorage.getItem('user_id') || sessionStorage.getItem('userId'))
      : null;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)(user_id|userId)=([^;]+)/);
    const cookieId = cookieMatch ? decodeURIComponent(cookieMatch[2]) : null;
    return localId || sessionId || cookieId || null;
  } catch (error) {
    console.warn('Unable to read stored user id for push subscription', error);
    return null;
  }
}

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

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    registration = await navigator.serviceWorker.register('/service-worker.js');
  }

  // Wait until the SW is active/ready
  await navigator.serviceWorker.ready;
  return registration;
}

function detectDeviceType(): 'PWA' | 'Web' {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  return isStandalone ? 'PWA' : 'Web';
}

async function createOrRefreshSubscription(registration: ServiceWorkerRegistration) {
  const existing = await registration.pushManager.getSubscription();

  // If existing is close to expiring, refresh
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
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    if (!userId) return false;
    if (!supportsPush()) return false;

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) return false;

    const subscription = await createOrRefreshSubscription(registration);
    const deviceType = detectDeviceType();

    await persistSubscription(userId, subscription, deviceType);
    localStorage.setItem('push-subscribed', 'true');
    localStorage.setItem('push-permission-asked', 'true');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
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
    if (!registration) return false;

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
