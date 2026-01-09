const CACHE_NAME = 'dream60-v1';
const STATIC_CACHE = 'dream60-static-v1';
const DYNAMIC_CACHE = 'dream60-dynamic-v1';
const IMAGE_CACHE = 'dream60-images-v1';
const API_CACHE = 'dream60-api-v1';

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
              return name.startsWith('dream60-') && 
                     ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(name);
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

  if (isApiRequest(request.url)) {
    event.respondWith(
      networkFirst(request, API_CACHE, 5000)
        .catch(() => {
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

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Dream60',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dream60', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data?.url || '/';
        
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
