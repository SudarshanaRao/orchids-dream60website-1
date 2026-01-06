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

    const hasAskedPermission = localStorage.getItem('push-permission-asked');
    const hasSubscribed = localStorage.getItem('push-subscribed');
    
    if (!hasAskedPermission && !hasSubscribed && 'Notification' in window) {
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
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        localStorage.setItem('push-permission-asked', 'true');
        setShowBanner(false);
        setIsSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const response = await fetch(`${API_ENDPOINTS.pushNotification.vapidPublicKey}`);
      const data = await response.json();
      
      if (!data.success) {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
          deviceType: isPWA ? 'PWA' : 'Web'
        })
      });

      const subscribeData = await subscribeResponse.json();

      if (subscribeData.success) {
        toast.success('🔔 Notifications enabled! You\'ll receive updates on auctions, wins, and more.');
        localStorage.setItem('push-subscribed', 'true');
        localStorage.setItem('push-permission-asked', 'true');
        setShowBanner(false);
      } else {
        throw new Error(subscribeData.message || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-permission-asked', 'true');
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