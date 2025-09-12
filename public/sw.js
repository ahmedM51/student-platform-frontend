// Service Worker for Smart Study Platform
const CACHE_NAME = 'smart-study-v2'; // Updated version to force refresh
const urlsToCache = [
  '/',
  '/index.html',
  '/ai-assistant.html',
  '/auth.html',
  '/js/app.js',
  '/js/ai.js',
  '/js/firebase-config.js'
];

// External resources to cache separately
const externalResources = [
  'https://cdn.tailwindcss.com/3.3.0',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        
        // Cache local resources first
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('Local resources cached successfully');
            
            // Cache external resources with error handling
            return Promise.allSettled(
              externalResources.map(url => 
                cache.add(url).catch(error => {
                  console.warn(`Failed to cache external resource: ${url}`, error);
                  return null;
                })
              )
            );
          });
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Only cache GET requests with successful responses
          if (event.request.method === 'GET') {
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        });
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
