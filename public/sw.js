
const CACHE_NAME = 'ontime-v3';
const STATIC_CACHE = 'ontime-static-v3';
const DYNAMIC_CACHE = 'ontime-dynamic-v3';

const urlsToCache = [
  '/',
  '/tasks',
  '/employees',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline with network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests and invalid URLs
  if (url.origin !== location.origin) {
    return;
  }

  // Skip requests to non-existent auth routes
  if (url.pathname.includes('/auth/login') || url.pathname.includes('/login')) {
    console.log('Skipping auth route:', url.pathname);
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone))
              .catch(error => console.error('Cache put failed:', error));
          }
          return response;
        })
        .catch((error) => {
          console.log('API fetch failed, trying cache:', error);
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (urlsToCache.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          return response || fetch(request).catch(() => {
            console.log('Static asset fetch failed:', url.pathname);
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Other requests - network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone))
            .catch(error => console.error('Cache put failed:', error));
        }
        return response;
      })
      .catch((error) => {
        console.log('Fetch failed, trying cache for:', url.pathname, error);
        return caches.match(request)
          .then(response => {
            return response || caches.match('/').then(fallback => {
              return fallback || new Response('Offline', { 
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-ontime' || event.tag === 'background-sync-ontime') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'OnTime Task Update',
    body: 'New task update available',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-72x72.svg',
    tag: 'ontime-notification',
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Task',
        icon: '/icons/icon-72x72.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.svg'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/tasks')
    );
  } else if (event.action === 'close') {
    return;
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Background sync function
async function syncOfflineData() {
  try {
    console.log('Starting background sync...');
    
    const offlineActions = getStoredOfflineActions();
    const cachedPhotos = getStoredCachedPhotos();
    
    if (offlineActions.length === 0 && cachedPhotos.length === 0) {
      console.log('No offline data to sync');
      return;
    }

    for (const action of offlineActions) {
      try {
        await syncAction(action);
        removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }

    for (const photo of cachedPhotos) {
      try {
        await syncPhoto(photo);
        removeCachedPhoto(photo.id);
      } catch (error) {
        console.error('Failed to sync photo:', error);
      }
    }

    console.log('Background sync completed');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline data management
function getStoredOfflineActions() {
  return [];
}

function getStoredCachedPhotos() {
  return [];
}

function removeOfflineAction(id) {
  console.log('Removing offline action:', id);
}

function removeCachedPhoto(id) {
  console.log('Removing cached photo:', id);
}

async function syncAction(action) {
  console.log('Syncing action:', action);
}

async function syncPhoto(photo) {
  console.log('Syncing photo:', photo);
}
