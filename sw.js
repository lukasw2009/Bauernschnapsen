const CACHE='schnapsen-v8-20260910';
const ASSETS=['./','./index.html','./style.css','./v6.css','./v8.css','./app-core.js','./app-ui.js','./upgrade-ui.js','./upgrade-game-history.js','./upgrade-players-stats.js','./upgrade-rules-backup.js','./upgrade-bind.js','./rules-v6.js','./dealer-v7.js','./layout-v8.js','./pwa.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
