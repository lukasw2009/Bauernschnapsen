(function(){
  // Kleine Feature-Module können hier nachgeladen werden, ohne die Hauptseite jedes Mal umzubauen.
  if(!document.querySelector('script[data-dealer-v7]')){
    const s=document.createElement('script');
    s.src='./dealer-v7.js';s.dataset.dealerV7='1';
    s.onerror=()=>console.warn('Geber-Modul konnte nicht geladen werden');
    document.body.appendChild(s);
  }

  function makeToast(){
    if(document.getElementById('updateToast'))return document.getElementById('updateToast');
    const t=document.createElement('div');t.id='updateToast';t.className='updateToast hidden';
    t.innerHTML='<div><strong>Neue Version verfügbar</strong><span>Die App kann jetzt aktualisiert werden.</span></div><button id="applyUpdate" class="btn good">Aktualisieren</button>';
    document.body.appendChild(t);return t;
  }
  function showOffline(){
    let b=document.getElementById('offlineBadge');
    if(!b){b=document.createElement('div');b.id='offlineBadge';b.className='offlineBadge hidden';b.textContent='Offline';document.body.appendChild(b)}
    b.classList.toggle('hidden',navigator.onLine);
  }
  window.addEventListener('online',showOffline);window.addEventListener('offline',showOffline);showOffline();
  if(!('serviceWorker' in navigator))return;
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
  window.addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      const toast=makeToast();
      const offer=worker=>{toast.classList.remove('hidden');toast.querySelector('#applyUpdate').onclick=()=>worker.postMessage({type:'SKIP_WAITING'})};
      if(reg.waiting)offer(reg.waiting);
      reg.addEventListener('updatefound',()=>{
        const worker=reg.installing;if(!worker)return;
        worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offer(worker)});
      });
      setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
    }catch(e){console.warn('Service Worker konnte nicht registriert werden',e)}
  });
})();
