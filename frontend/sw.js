// Service Worker for Caching and Push Notifications
const CACHE_NAME = 'abi-portfolio-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/login.html',
    '/cms.html',
    '/style.css',
    '/script.js',
    '/Myphoto.jpeg',
    '/icon-192.png',
    '/icon-512.png',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Kita bungkus addAll agar jika satu gagal, SW tetap bisa terpasang
            return cache.addAll(ASSETS).catch(err => console.warn('Gagal cache beberapa aset:', err));
        }).then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event (cache-first fallback to network)
self.addEventListener('fetch', (e) => {
    // Lewatkan request API dan non-GET
    if (!e.request.url.startsWith(self.location.origin) || e.request.method !== 'GET' || e.request.url.includes('/api/')) {
        return;
    }
    
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(e.request).then((networkResponse) => {
                // Cache aset yang baru dimuat secara dinamis jika valid
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback jika offline total dan tidak ada di cache
                if (e.request.mode === 'navigate') {
                    return caches.match('/index.html') || caches.match('/login.html');
                }
            });
        })
    );
});

// Push notification handler
self.addEventListener('push', (e) => {
    let data = { title: 'Notifikasi Baru', body: 'Ada pembaruan di Website Profil Abi.' };
    if (e.data) {
        try {
            data = e.data.json();
        } catch (err) {
            data = { title: 'Notifikasi Baru', body: e.data.text() };
        }
    }
    const options = {
        body: data.body,
        icon: '/Myphoto.jpeg',
        badge: '/Myphoto.jpeg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        }
    };
    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        clients.openWindow('/')
    );
});
