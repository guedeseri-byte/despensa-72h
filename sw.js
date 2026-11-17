/* Protocolo Vermelho — funciona sem internet */
const V='pv-v4';
const SHELL=['./','index.html','manifest.webmanifest','logo.png','kit.webp','icon-192.png','icon-512.png'];
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js','https://cdn.jsdelivr.net/npm/@zxing/library@0.20.0/umd/index.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(async c=>{await c.addAll(SHELL);await Promise.all(LIBS.map(u=>c.add(u).catch(()=>{})));}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
const put=(req,res)=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(V).then(ca=>ca.put(req,c));}return res;};
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/openfoodfacts/.test(u.hostname))return;
  if(r.mode==='navigate'){
    /* página: tenta a rede (3 s) para pegar atualizações; sem sinal, abre a cópia salva */
    e.respondWith((async()=>{
      const cached=await caches.match('index.html');
      const net=fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(ca=>ca.put('index.html',c));}return res;});
      if(!cached)return net;
      return Promise.race([net.catch(()=>cached),new Promise(ok=>setTimeout(()=>ok(cached),3000))]);
    })());
    return;
  }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>put(r,res))));
});
