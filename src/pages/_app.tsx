import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AuthProvider from "@/contexts/AuthContext";
import { useEffect } from "react";
import { notificationService } from "@/services/notificationService";
import { offlineService } from "@/services/offlineService";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Request notification permission
    notificationService.requestPermission()
      .then((permission) => {
        console.log('Notification permission:', permission);
      })
      .catch((error) => {
        console.error('Error requesting notification permission:', error);
      });

    // Sync offline data when coming back online
    const handleOnline = () => {
      console.log('Back online - syncing data');
      offlineService.syncOfflineData();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
