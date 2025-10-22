// Service Worker for Free SMS Sender PWA
const CACHE_NAME = 'free-sms-sender-v1';
const STATIC_CACHE = 'free-sms-static-v1';
const DYNAMIC_CACHE = 'free-sms-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Handle API calls differently
    if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
        // For API calls, try network first, then cache
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE)
                            .then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // Return cached version if network fails
                    return caches.match(event.request);
                })
        );
    } else {
        // For static files, try cache first, then network
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    return fetch(event.request)
                        .then(response => {
                            // Don't cache if not a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // Cache the fetched response
                            const responseToCache = response.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        })
                        .catch(() => {
                            // Return offline fallback for HTML pages
                            if (event.request.headers.get('accept').includes('text/html')) {
                                return caches.match('/index.html');
                            }
                        });
                })
        );
    }
});

// Background sync for SMS sending
self.addEventListener('sync', event => {
    if (event.tag === 'background-sms-sync') {
        event.waitUntil(sendQueuedSMS());
    }
});

// Push notifications (for future SMS delivery confirmations)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Function to send queued SMS when back online
async function sendQueuedSMS() {
    try {
        // Get queued SMS from IndexedDB or local storage
        const queuedSMS = await getQueuedSMS();

        for (const sms of queuedSMS) {
            try {
                // Attempt to send SMS
                const result = await sendSMS(sms);

                if (result.success) {
                    // Remove from queue
                    await removeFromQueue(sms.id);
                }
            } catch (error) {
                console.error('Failed to send queued SMS:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

// Mock functions for queued SMS handling
async function getQueuedSMS() {
    // In a real implementation, this would get SMS from IndexedDB
    return [];
}

async function sendSMS(sms) {
    // In a real implementation, this would send the SMS
    return { success: true };
}

async function removeFromQueue(id) {
    // In a real implementation, this would remove from IndexedDB
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('sms-status-check', {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
    });
}