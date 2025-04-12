
// sw.js - خادم العمال للتخزين المؤقت وتحسين الأداء

const CACHE_NAME = 'image-processor-cache-v1';
const RUNTIME_CACHE = 'runtime-cache';

// الموارد التي سيتم تخزينها مسبقًا
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/styles/base.css',
  '/src/styles/optimized.css',
  '/assets/logo.svg',
];

// تثبيت خادم العمال وتخزين الموارد الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تخزين الموارد المسبقة');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// تنظيف ذاكرة التخزين المؤقت القديمة عند التنشيط
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// استراتيجية التخزين المؤقت للمحتوى الثابت
const staticAssetRegex = /\.(js|css|png|jpg|jpeg|svg|ico|json|woff|woff2)$/;

// استراتيجية "الشبكة أولاً، ثم التخزين المؤقت" للمحتوى الديناميكي
self.addEventListener('fetch', event => {
  // تجاهل طلبات CORS الصريحة
  if (event.request.mode === 'cors') {
    return;
  }

  const requestURL = new URL(event.request.url);

  // التعامل مع أصول API بشكل مختلف
  if (requestURL.pathname.startsWith('/api/')) {
    // استخدم استراتيجية الشبكة أولاً للطلبات API
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // عند عدم الاتصال بالشبكة، حاول استخدام التخزين المؤقت
          return caches.match(event.request);
        })
    );
    return;
  }

  // للأصول الثابتة، استخدم استراتيجية التخزين المؤقت أولاً
  if (staticAssetRegex.test(requestURL.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then(response => {
            // تجاهل التخزين المؤقت للاستجابات الفاشلة أو من منشأ مختلف
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // تخزين نسخة من الاستجابة في التخزين المؤقت
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
        })
    );
    return;
  }

  // للمحتوى الديناميكي الآخر، استخدم الشبكة مع الخزين المؤقت كإجراء احتياطي
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// تحسين استخدام البطارية
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

// وظيفة محاكاة للمزامنة
async function syncContent() {
  // تنفيذ عمليات المزامنة في الخلفية
  console.log('تنفيذ المزامنة الدورية في الخلفية');
}

console.log('تم تحميل خادم العمال');
