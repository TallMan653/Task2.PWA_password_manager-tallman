// Отвечает за офлайн-работу приложения, кеширование ресурсов и будущие фоновые функции
const CACHE_NAME = 'password-manager-v1';
const urlsToCache = [
  '/',                  // Главная страница
  '/index.html',        // Основной HTML
  '/styles.css',        // Стили
  '/app.js',            // Логика приложения
  '/manifest.json',     // PWA-манифест
  '/img/icon-192.png',      // Иконка для мобильных устройств
  '/img/icon-512.png'       // Иконка высокого разрешения
];

// Установка ивента для Service Worker 
self.addEventListener('install', event => {
  // Добавляем все ресурсы в кеш при установке
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache); // Кешируем все указанные файлы
      })
      .catch(err => {
        console.log('Cache addAll error:', err); // Логируем ошибку, если не удалось добавить
      })
  );

  // Принудительно активируем новый SW, не дожидаясь старого
  self.skipWaiting();
});

// Активация нового ивента
self.addEventListener('activate', event => {
  // Удаляем старые кеши, если их имя не совпадает с текущим CACHE_NAME
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Активируем новый Service Worker сразу для всех клиентов
  self.clients.claim();
});

// Фетчим события (Попытался в использовать стратегию: "Сеть - приоритет, а кеш как запасной вариант")
self.addEventListener('fetch', event => {
  // Пропускаем все запросы, кроме GET (POST, PUT и т.д. не кешируются)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Клонируем ответ, так как его можно прочитать только один раз
        const responseClone = response.clone();
        
        // Кешируем только успешные ответы (код 200)
        if (response.status === 200) {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        
        // Возвращаем сетевой ответ пользователю
        return response;
      })
      .catch(() => {
        // Если нет и в кеше — возвращаем простое офлайн-сообщение
        return caches.match(event.request)
          .then(response => {
            return response || new Response('Offline - resource not found', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
