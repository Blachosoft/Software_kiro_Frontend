/**
 * Service Worker Registration Utility
 * 
 * Handles service worker registration and lifecycle events.
 * 
 * **Validates: Requirements 20.4**
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      console.log('Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available
            console.log('New service worker available');
            
            // Optionally notify user about update
            if (
              confirm(
                'A new version is available. Reload to update?'
              )
            ) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from Service Worker:', event.data);
        
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          // Dispatch custom event for sync completion
          window.dispatchEvent(
            new CustomEvent('sw-sync-complete', {
              detail: { timestamp: event.data.timestamp },
            })
          );
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker
    .getRegistration()
    .then((registration) => {
      if (registration) {
        return registration.unregister();
      }
      return false;
    })
    .catch((error) => {
      console.error('Service Worker unregistration failed:', error);
      return false;
    });
}
