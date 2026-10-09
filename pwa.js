(function () {
  const offline = document.getElementById('offlineBadge');
  const syncConnection = () => {
    offline?.classList.toggle('hidden', navigator.onLine);
    offline?.setAttribute('aria-label', 'Offline · Spielstände werden weiterhin auf diesem Gerät gespeichert');
  };
  addEventListener('online', syncConnection);
  addEventListener('offline', syncConnection);
  syncConnection();
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

  let updateRequested = false;
  let reloading = false;
  let hadController = !!navigator.serviceWorker.controller;
  let registration;
  let offeredWorker;
  const toast = document.getElementById('updateToast');
  const apply = document.getElementById('applyUpdate');
  toast?.setAttribute('role', 'status');
  toast?.setAttribute('aria-live', 'polite');

  const reload = () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  };
  const offerUpdate = worker => {
    if (!toast || !apply) return;
    offeredWorker = worker;
    toast.classList.remove('hidden');
    apply.disabled = false;
    apply.textContent = 'Aktualisieren';
  };

  apply?.addEventListener('click', () => {
    // The app can defer updates while a form contains unsaved changes.
    if (!document.dispatchEvent(new CustomEvent('beforeappupdate', { cancelable: true }))) return;
    if (typeof window.save === 'function' && window.save() === false) return;
    updateRequested = true;
    apply.disabled = true;
    apply.textContent = 'Wird aktualisiert …';
    if (offeredWorker?.state === 'installed') {
      offeredWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      reload();
    }
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const replacingController = hadController;
    hadController = true;
    if (updateRequested) reload();
    // First installation and an update in another tab must not interrupt play.
    else if (replacingController) offerUpdate(null);
  });

  const register = async () => {
    try {
      const alreadyControlled = !!navigator.serviceWorker.controller;
      registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
      if (registration.waiting) offerUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && (alreadyControlled || navigator.serviceWorker.controller)) {
            offerUpdate(worker);
          }
        });
      });
      const checkForUpdate = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      addEventListener('online', checkForUpdate);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      setInterval(checkForUpdate, 60 * 60 * 1000);
    } catch (error) {
      console.warn('Offline-Funktion konnte nicht gestartet werden:', error);
    }
  };
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
})();
