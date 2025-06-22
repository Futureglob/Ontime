// Define these interfaces at the top
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface AppStateChangeEvent {
  type: "visibility" | "online" | "offline";
  hidden?: boolean;
  online?: boolean;
}

// Add SyncManager interface declaration if not globally available
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
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
  async registerBackgroundSync(tag: string = 'sync-ontime') {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('Background sync not available in server environment');
      return false;
    }

    // Check for service worker and sync support
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Check if registration has sync capability
      if (!registration || !('sync' in registration)) {
        console.warn('Service worker registration does not support sync');
        return false;
      }

      // Register background sync with shorter tag
      await (registration as ServiceWorkerRegistrationWithSync).sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  },

  // Check if app is installed
  isInstalled() {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return false;
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as NavigatorWithStandalone).standalone === true;
    return isStandalone || isInWebAppiOS;
  },

  // Get app info
  getAppInfo() {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      return {
        isInstalled: false,
        isOnline: false,
        hasServiceWorker: false,
        hasNotifications: false,
        hasPushManager: false,
        hasBackgroundSync: false
      };
    }

    return {
      isInstalled: this.isInstalled(),
      isOnline: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasNotifications: 'Notification' in window,
      hasPushManager: 'PushManager' in window,
      hasBackgroundSync: 'sync' in window.ServiceWorkerRegistration.prototype
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
