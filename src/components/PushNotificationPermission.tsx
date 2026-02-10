import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '@/lib/api-config';

interface PushNotificationPermissionProps {
  userId?: string;
}

export function PushNotificationPermission({ userId }: PushNotificationPermissionProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (!('Notification' in window)) return;

    const hasSubscribed = localStorage.getItem('push-subscribed');
    const permission = Notification.permission;

    // Always show the banner if not subscribed and permission is not denied
    if (!hasSubscribed && permission !== 'denied') {
      setTimeout(() => setShowBanner(true), 2000);
    }
  }, [userId]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

    const handleAcceptAll = async () => {
      if (!userId) {
        toast.error('Please login to enable notifications');
        return;
      }

      setIsSubscribing(true);
      
      try {
        // Check if service worker is supported and registered
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          toast.error('Push notifications are not supported in this browser.');
          setShowBanner(false);
          setIsSubscribing(false);
          return;
        }

        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          toast.error('Notification permission denied. Please enable it in browser settings.');
          setShowBanner(false);
          setIsSubscribing(false);
          return;
        }

        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          // Already subscribed at browser level, just register with backend
          const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;

          const subscribeResponse = await fetch(`${API_ENDPOINTS.pushNotification.subscribe}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              subscription: existingSub.toJSON(),
              deviceType: isPWA ? 'PWA' : 'Web'
            })
          });

          const subscribeData = await subscribeResponse.json();
          if (subscribeData.success) {
            toast.success('Notifications enabled!');
            localStorage.setItem('push-subscribed', 'true');
            setShowBanner(false);
          }
          return;
        }

        // Get VAPID public key
        const response = await fetch(`${API_ENDPOINTS.pushNotification.vapidPublicKey}`);
        if (!response.ok) {
          throw new Error(`VAPID key request failed: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.success || !data.publicKey) {
          throw new Error('Failed to get VAPID public key');
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey)
        });

        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;

        const subscribeResponse = await fetch(`${API_ENDPOINTS.pushNotification.subscribe}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            subscription: subscription.toJSON(),
            deviceType: isPWA ? 'PWA' : 'Web'
          })
        });

        const subscribeData = await subscribeResponse.json();

        if (subscribeData.success) {
          toast.success('Notifications enabled! You\'ll receive updates on auctions, wins, and more.');
          localStorage.setItem('push-subscribed', 'true');
          setShowBanner(false);
        } else {
          throw new Error(subscribeData.message || 'Backend subscription failed');
        }
      } catch (error: any) {
        console.error('Error enabling notifications:', error);
        const msg = error?.message || '';
        if (msg.includes('VAPID')) {
          toast.error('Notification setup failed. Server configuration issue.');
        } else if (msg.includes('push service')) {
          toast.error('Push service unavailable. Please try again later.');
        } else {
          toast.error('Failed to enable notifications. Please try again.');
        }
      } finally {
        setIsSubscribing(false);
      }
    };

  const handleDismiss = () => {
    // Only dismiss for this session - will show again on next visit
    setShowBanner(false);
  };

  if (!showBanner || !userId) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl shadow-2xl border-2 border-purple-300/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />
        
        <div className="relative z-10 p-5">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                Stay Updated with Dream60!
              </h3>
              <p className="text-white/90 text-sm mb-4">
                Get instant notifications for auction starts, wins, prize claims, and special offers. Never miss an opportunity!
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptAll}
                  disabled={isSubscribing}
                  className="flex-1 bg-white text-purple-700 hover:bg-white/90 font-semibold shadow-lg"
                >
                  {isSubscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-purple-700/30 border-t-purple-700 rounded-full animate-spin mr-2" />
                      Enabling...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Accept All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}