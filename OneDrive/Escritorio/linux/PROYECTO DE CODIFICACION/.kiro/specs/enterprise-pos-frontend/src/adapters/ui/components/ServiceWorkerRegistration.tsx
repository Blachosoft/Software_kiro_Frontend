/**
 * ServiceWorkerRegistration Component
 * 
 * Client component that registers the service worker on mount.
 * 
 * **Validates: Requirements 20.4**
 */

'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../utils/serviceWorker';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
