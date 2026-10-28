/* عامل الخدمة: يحفظ ملفات التطبيق ليعمل دون إنترنت، ويحدّثها في الخلفية عند توفر الاتصال.
   بيانات الطلبة لا تمر من هنا؛ تبقى في localStorage على الجهاز. */
const VERSION = '20261028-230900';
const CACHE = 'grader-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('grader-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// من الذاكرة أولاً (فتح فوري ودون إنترنت)، مع تحديث النسخة المحفوظة من الشبكة إن أمكن
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    const fresh = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => undefined);
    if (cached) { e.waitUntil(fresh); return cached; }
    return (await fresh) || new Response('التطبيق غير متاح دون إنترنت قبل فتحه مرة واحدة على الأقل.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
