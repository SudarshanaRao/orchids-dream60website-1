const VERSION = '1.0.4';
const CACHE_NAME = `dream60-v${VERSION}`;
const STATIC_CACHE = `dream60-static-v${VERSION}`;
const DYNAMIC_CACHE = `dream60-dynamic-v${VERSION}`;
const IMAGE_CACHE = `dream60-images-v${VERSION}`;
// API_CACHE removed - API responses must never be cached to prevent stale data

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/offline.html'
];

const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000,
  images: 7 * 24 * 60 * 60 * 1000,
  static: 30 * 24 * 60 * 60 * 1000
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/offline.html'));
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.log('[SW] Static cache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete all old versioned caches AND any API caches (API must never be cached)
              return (name.startsWith('dream60-') && 
                     ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(name)) ||
                     name.includes('-api-');
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

const isApiRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('dev-api.dream60.com') ||
         url.includes('prod-api.dream60.com') ||
         url.includes('dream60.com/api') ||
         url.includes('dream60.com/scheduler') ||
         url.includes('/scheduler/') ||
         url.includes('/admin/') ||
         url.includes('/auth/') ||
         url.includes('/user/') ||
         url.includes('supabase.co');
};

const isImageRequest = (request) => {
  const url = request.url;
  return request.destination === 'image' ||
         /\.(png|jpg|jpeg|gif|webp|svg|ico)(\?.*)?$/i.test(url);
};

const isStaticAsset = (url) => {
  return /\.(js|css|woff|woff2|ttf|eot)(\?.*)?$/i.test(url);
};

const staleWhileRevalidate = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || fetchPromise;
};

const networkFirst = async (request, cacheName, timeout = 3000) => {
  const cache = await caches.open(cacheName);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const networkResponse = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

const cacheFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return null;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  if (url.pathname.includes('chrome-extension') || 
      url.pathname.includes('hot-update') ||
      url.hostname === 'localhost' && url.pathname.includes('__vite')) {
    return;
  }

  // Skip service worker for Vite HMR and dev server requests
  if ((url.hostname === 'test.dream60.com' || url.hostname === 'localhost') && 
      url.pathname.includes('__vite')) {
    return fetch(event.request);
  }

  if (isApiRequest(request.url)) {
    // NEVER cache API responses - always fetch fresh data from network
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'Please check your connection' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(
      cacheFirst(request, IMAGE_CACHE)
        .then((response) => {
          if (response) return response;
          return fetch(request);
        })
        .catch(() => {
          return new Response('', { status: 404 });
        })
    );
    return;
  }

  if (isStaticAsset(request.url)) {
    event.respondWith(
      staleWhileRevalidate(request, STATIC_CACHE)
        .then((response) => {
          if (response) return response;
          return fetch(request);
        })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE, 3000)
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          const offlinePage = await cache.match('/offline.html');
          if (offlinePage) return offlinePage;
          
          const indexPage = await cache.match('/');
          if (indexPage) return indexPage;
          
          return new Response(
            '<html><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  event.respondWith(
    staleWhileRevalidate(request, DYNAMIC_CACHE)
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

/**
 * Push Event Handler
 * Handles incoming push notifications with professional design
 * Compatible with Android, Desktop, and iOS Safari (16.4+)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.warn('[SW] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);
    
      // Professional notification options with brand styling
      const options = {
        // Core content
        body: data.body || 'New notification from Dream60',
        
        // Visual branding
        icon: data.icon || '/icons/icon-192x192.png',           // App icon (Square)
        badge: '/icons/icon-72x72.png',            // Monochrome badge icon (Android)
        
        // iOS Safari 16.4+ does not support rich images in notifications
        // Only include image for Android/Desktop Chrome/Edge
        ...(data.image && !/(iPhone|iPad|iPod)/.test(navigator.userAgent) ? { image: data.image } : {}),
        
        // Interaction settings
      vibrate: [200, 100, 200, 100, 200],        // Vibration pattern
      tag: data.tag || 'dream60-notification',   // Notification grouping
      requireInteraction: data.requireInteraction || false, // Keep notification visible
      renotify: true,                             // Alert on replace
      silent: data.silent || false,               // Sound on/off
      
      // Data payload for click handling
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
        notificationId: data.notificationId || `notif-${Date.now()}`,
        clickAction: data.clickAction || 'open_app',
        ...data.customData
      },
      
      // Action buttons (Android, Desktop - not iOS)
      actions: data.actions || [
        {
          action: 'open',
          title: '🎯 Open',
          icon: '/icons/icon-96x96.png'
        },
        {
          action: 'close',
          title: '❌ Dismiss',
          icon: '/icons/icon-72x72.png'
        }
      ],
      
      // Localization
      dir: data.dir || 'ltr',
      lang: data.lang || 'en-US',
      
      // Timestamp (for sorting)
      timestamp: data.timestamp || Date.now()
    };
    
    // Show notification
    event.waitUntil(
      self.registration.showNotification(
        data.title || '🎁 Dream60 Auction',
        options
      ).then(() => {
        console.log('[SW] Notification displayed successfully');
      }).catch((error) => {
        console.error('[SW] Failed to show notification:', error);
      })
    );
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

/**
 * Notification Click Handler
 * Handles notification and action button clicks with deep linking
 * Opens app in existing window or creates new window
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  console.log('[SW] Action:', event.action);
  console.log('[SW] Notification data:', event.notification.data);
  
  // Close the notification
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  const clickAction = notificationData.clickAction || 'open_app';
  
  // Handle "Dismiss" action - just close
  if (action === 'close' || action === 'dismiss') {
    console.log('[SW] Notification dismissed');
    return;
  }
  
  // Handle "Open" action or notification body click
  event.waitUntil(
    (async () => {
      try {
        // Get all window clients
        const clientList = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        console.log('[SW] Found', clientList.length, 'open windows');
        
        // Try to find existing client with matching URL
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          const targetUrlObj = new URL(targetUrl, self.location.origin);
          
          // Check if client is on the same domain
          if (clientUrl.origin === targetUrlObj.origin) {
            console.log('[SW] Found existing window, focusing and navigating...');
            
            // Focus the existing window
            await client.focus();
            
            // Navigate to the target URL
            if (client.url !== targetUrlObj.href) {
              await client.navigate(targetUrlObj.href);
            }
            
            // Send message to client about the notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notificationData
            });
            
            return;
          }
        }
        
        // No existing window found, open new window
        console.log('[SW] No existing window found, opening new window...');
        
        if (clients.openWindow) {
          const fullUrl = new URL(targetUrl, self.location.origin).href;
          const newClient = await clients.openWindow(fullUrl);
          
          console.log('[SW] New window opened:', fullUrl);
          
          // Send message to new client (after a short delay to ensure it's ready)
          if (newClient) {
            setTimeout(() => {
              newClient.postMessage({
                type: 'NOTIFICATION_CLICKED',
                data: notificationData
              });
            }, 1000);
          }
        }
      } catch (error) {
        console.error('[SW] Error handling notification click:', error);
        
        // Fallback: try to open window anyway
        try {
          const fullUrl = new URL(targetUrl, self.location.origin).href;
          await clients.openWindow(fullUrl);
        } catch (fallbackError) {
          console.error('[SW] Fallback window open failed:', fallbackError);
        }
      }
    })()
  );
});

/**
 * Notification Close Handler (Optional)
 * Track when users dismiss notifications without clicking
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed without action');
  console.log('[SW] Notification data:', event.notification.data);
  
  // Optional: Send analytics or tracking event
  // This can be useful for understanding engagement
});