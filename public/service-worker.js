// ================================================================
// SebilAI — Service Worker v10 + Push Notifications
// v10 bumps the cache key to force existing installs off stale HTML.
// Reason: phones cached an older build whose founder bio/tagline was
// being machine-translated at runtime (gtrans clobbered the clean
// Amharic/Tigrinya into garbage — "ገንዘብ", "ጉሊላት ቃሲዬ"). The fix
// (translateModals now skips the i18n-managed #about-bio/#about-job-title)
// only takes effect once the cached HTML is replaced — hence this bump.
// SKIP_WAITING handler stays so the in-page "New version available —
// tap to refresh" banner can force a waiting SW to activate immediately.
// ================================================================
const CACHE_NAME = 'sebilai-v10';
const PUSH_ICON  = '/icons/icon-192.png';

// v7: crop preview images extracted from index.html base64. Precaching
// them keeps offline mode working — the previous v6 had them inlined,
// so this list re-establishes parity. The fetch handler below ALSO
// dynamically caches every successful GET, so missing entries here are
// not fatal; this list just primes the cache on install.
const CROP_IMAGES = [
  '/icons/crops/enset.jpg',          '/icons/crops/enset-preview.jpg',
  '/icons/crops/teff.jpg',           '/icons/crops/teff-preview.jpg',
  '/icons/crops/noug.jpg',
  '/icons/crops/wheat.jpg',          '/icons/crops/wheat-preview.jpg',
  '/icons/crops/maize.jpg',          '/icons/crops/maize-preview.jpg',
  '/icons/crops/coffee.jpg',         '/icons/crops/coffee-preview.jpg',
  '/icons/crops/potato.jpg',         '/icons/crops/potato-preview.jpg',
  '/icons/crops/tomato.jpg',
  '/icons/crops/onion.jpg',
  '/icons/crops/barley.jpg',         '/icons/crops/barley-preview.jpg',
  '/icons/crops/sorghum.jpg',        '/icons/crops/sorghum-preview.jpg'
];

// ── MESSAGE HANDLER: SKIP_WAITING ────────────────────────────────
// The page sends { type: 'SKIP_WAITING' } when the user taps the
// "tap to refresh" banner; we let the new SW activate without
// waiting for all clients to close.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(
      ['/', '/index.html', '/privacy.html', '/manifest.json', '/local-diseases.js'].concat(CROP_IMAGES)
    ).catch(() => {}))
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
// clients.claim() is inside waitUntil so the new SW takes control of
// open tabs before the event completes — without this, the first
// fetch after activation could still be served by the old SW.
self.addEventListener('activate', e => {
  e.waitUntil(Promise.all([
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ),
    self.clients.claim()
  ]));
});

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.url.includes('/api/')) return; // Don't cache API calls
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request)
      .then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'))
    )
  );
});

// ── PUSH NOTIFICATIONS ───────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: '🌿 SebilAI', body: 'Disease alert for your crops', lang: 'en', crop: '', severity: '' };

  try {
    data = Object.assign(data, e.data.json());
  } catch(err) {
    try { data.body = e.data.text(); } catch(err2) {}
  }

  // Build notification body based on language
  const icon  = PUSH_ICON;
  const badge = PUSH_ICON;
  const vibrate = [200, 100, 200];

  const options = {
    body:    data.body,
    icon:    icon,
    badge:   badge,
    vibrate: vibrate,
    tag:     'rg-disease-alert',
    renotify: true,
    data: { url: '/', crop: data.crop, severity: data.severity },
    actions: [
      { action: 'open',   title: data.lang === 'am' ? 'አሁን ይፈትሹ' : 'Check Now' },
      { action: 'dismiss',title: data.lang === 'am' ? 'ቆይ' : 'Later' }
    ]
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ── NOTIFICATION CLICK ───────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin)) return c.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// ── BACKGROUND SYNC ──────────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-feedback') {
    e.waitUntil(
      fetch('/api/sync-feedback', { method: 'POST' }).catch(() => {})
    );
  }
});
