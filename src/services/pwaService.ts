// Define these interfaces at the top
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface AppStateChangeEvent {
  type: "visibility" | "online" | "offline";
  hidden?: boolean;
  online?: boolean;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager; // SyncManager is a built-in type for Background Sync API
}

export const pwaService = {
  // Register service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.showUpdateAvailable();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    } else {
      throw new Error('Service Workers not supported');
    }
  },

  // Show update available notification
  showUpdateAvailable() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('App Update Available', {
        body: 'A new version of OnTime is available. Refresh to update.',
        icon: '/icons/icon-192x192.svg',
        tag: 'app-update'
      });
    }
  },

  // Update service worker
  async updateServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        
        // Skip waiting and reload
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      }
    }
  },

  // Register for background sync
  async registerBackgroundSync(tag: string = 'background-sync-ontime') {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready as ServiceWorkerRegistrationWithSync;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  },

  // Check if app is installed
  isInstalled() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as NavigatorWithStandalone).standalone === true;
    return isStandalone || isInWebAppiOS;
  },

  // Get app info
  getAppInfo() {
    return {
      isInstalled: this.isInstalled(),
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      hasPushManager: 'PushManager' in window,
      hasBackgroundSync: 'sync' in (ServiceWorkerRegistration.prototype as ServiceWorkerRegistrationWithSync)
    };
  },

  // Listen for app state changes
  onAppStateChange(callback: (state: AppStateChangeEvent) => void) {
    const handleVisibilityChange = () => {
      callback({
        type: 'visibility',
        hidden: document.hidden
      });
    };

    const handleOnline = () => {
      callback({
        type: 'online',
        online: true
      });
    };

    const handleOffline = () => {
      callback({
        type: 'offline',
        online: false
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

export default pwaService;
