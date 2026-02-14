const CACHE_NAME = 'mmw1984-cache-v2';
const ASSETS = [
	'/',
	'/index.html',
	'/manifest.json',
	'/translations.js',
	'/android-chrome-192x192.png',
	'/android-chrome-512x512.png',
	'/favicon-16x16.png',
	'/favicon-32x32.png',
	'/favicon.ico',
	'/notion-avatar-1736580317649.png',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return; // Only cache GET

	event.respondWith(
		caches.match(req).then((cached) => {
			const fetchPromise = fetch(req)
				.then((networkRes) => {
					// Only cache successful same-origin responses. Avoid caching 404s or opaque failures.
					if (networkRes && networkRes.ok && networkRes.type !== 'opaque') {
						const copy = networkRes.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
					}
					return networkRes;
				})
				.catch(() => cached);
			return cached || fetchPromise;
		})
	);
});

// Allow the page to tell the SW to skipWaiting during deploys
self.addEventListener('message', (event) => {
	if (event.data === 'skipWaiting') {
		self.skipWaiting();
	}
});

