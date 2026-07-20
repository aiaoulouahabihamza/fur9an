const CACHE_NAME = 'mishkat-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css',
  '/variables.css',
  '/manifest.json',
  '/data/images/logo.png',
  '/data/images/6.svg',
  '/data/images/ayah_frame_brown.svg',
  '/data/images/ayah_frame_brown1.svg',
  '/data/images/page_frame_box_brown.svg',
  '/data/images/surah_frame_brown.svg',
  
  '/quran/index.html',
  '/quran/main.js',
  '/quran/style.css',
  '/quran/page.html',
  '/quran/page.js',
  '/quran/page.css',
  
  '/adkar/index.html',
  '/adkar/main.js',
  '/adkar/style.css',
  
  '/sunah/index.html',
  '/sunah/main.js',
  '/sunah/style.css',
  '/sunah/hadiths.css',
  
  '/prayer/index.html',
  '/prayer/main.js',
  '/prayer/style.css'
];

// تثبيت الأصول الثابتة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// استراتيجية جلب ذكية ومتقدمة للتشغيل أوفلاين بالكامل
self.addEventListener('fetch', (event) => {
  // تجنب كاش طلبات غير الـ GET أو الـ Chrome extensions
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);
  const isLocalAsset = url.origin === self.location.origin;

  // التحقق مما إذا كان الملف هو ملف كود محلي (HTML, JS, CSS, JSON) أو طلب خارجي لـ API
  const isNetworkFirstTarget = 
    url.hostname.includes('hadith-api') || 
    url.hostname.includes('aladhan') || 
    url.hostname.includes('bigdatacloud') || 
    url.hostname.includes('api.quran.com') ||
    (isLocalAsset && (
      url.pathname.endsWith('.html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.json') || 
      url.pathname === '/'
    ));

  // 1. استراتيجية شبكية أولاً للكود والـ APIs لضمان التحديث التلقائي الفوري والرجوع للكاش عند انقطاع الشبكة (Network-First)
  if (isNetworkFirstTarget) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // حفظ نسخة من الاستجابة الناجحة في الكاش الديناميكي
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // عند انقطاع الإنترنت بالكامل، حاول استرجاعها من الكاش إن وجدت
          return caches.match(event.request);
        })
    );
  } else {
    // 2. استراتيجية الكاش أولاً للصور والخطوط والوسائط الثابتة لسرعة أداء خرافية (Cache-First)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          // لا تقم بحفظ الاستجابات غير الصالحة
          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});
