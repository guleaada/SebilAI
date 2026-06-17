// ================================================================
// SEBILAI — Service Worker v5 + Push Notifications
// ================================================================
const CACHE_NAME = 'sebilai-v5';
const PUSH_ICON  = '/icons/icon-192.png';

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll([
      '/', '/index.html', '/privacy.html'
    ]).catch(() => {}))
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
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
    tag:     'sebilai-disease-alert',
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
