const CACHE = 'craie-v2';
const CORE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=> k !== CACHE).map(k=> caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  // On ne met en cache que les ressources du site lui-meme.
  // Les appels externes (Supabase, polices) passent en direct : le JS de l'app gere deja son propre repli hors-ligne.
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(res=>{
      if(res && res.ok){
        const copy = res.clone();
        caches.open(CACHE).then(c=> c.put(e.request, copy));
      }
      return res;
    }).catch(async ()=>{
      const cached = await caches.match(e.request);
      if(cached) return cached;
      if(e.request.mode === 'navigate'){
        const shell = await caches.match('/index.html');
        if(shell) return shell;
      }
      return Response.error();
    })
  );
});
