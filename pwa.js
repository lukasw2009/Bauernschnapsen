(function(){
  const offline=document.getElementById('offlineBadge');
  const sync=()=>offline?.classList.toggle('hidden',navigator.onLine);
  addEventListener('online',sync);addEventListener('offline',sync);sync();
  if(!('serviceWorker' in navigator))return;
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});
  addEventListener('load',async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js');
      const toast=document.getElementById('updateToast'),apply=document.getElementById('applyUpdate');
      const offer=worker=>{if(!worker||!toast||!apply)return;toast.classList.remove('hidden');apply.onclick=()=>worker.postMessage({type:'SKIP_WAITING'})};
      if(reg.waiting)offer(reg.waiting);
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)offer(w)})});
      setTimeout(()=>reg.update().catch(()=>{}),1500);
      setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
    }catch(e){console.warn('Service Worker:',e)}
  });
})();
