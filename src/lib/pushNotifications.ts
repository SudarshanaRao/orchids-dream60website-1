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

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// Get VAPID public key from server
async function getVAPIDPublicKey(): Promise<string> {
  try {
    const response = await fetch(`${API_ENDPOINTS.pushNotification.vapidPublicKey}`);
    const data = await response.json();
    
    if (!data.success || !data.publicKey) {
      throw new Error('Failed to get VAPID public key');
    }
    
    return data.publicKey;
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // Register service worker if not already registered
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service worker registered for push notifications');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Get VAPID public key
      const publicKey = await getVAPIDPublicKey();
      
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      
      console.log('Push subscription created:', subscription);
    }

    // Send subscription to server
    const response = await fetch(`${API_ENDPOINTS.pushNotification.subscribe}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys?.p256dh || '',
            auth: subscription.toJSON().keys?.auth || ''
          }
        }
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to subscribe to push notifications');
    }

    console.log('✅ Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return false;
    }

    // Unsubscribe on client side
    await subscription.unsubscribe();

    // Notify server
    await fetch(`${API_ENDPOINTS.pushNotification.unsubscribe}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        endpoint: subscription.endpoint
      })
    });

    console.log('✅ Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

// Check if user is subscribed to push notifications
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push notification subscription:', error);
    return false;
  }
}
