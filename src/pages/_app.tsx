import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AuthProvider from "@/contexts/AuthContext"; // This was the previous error, ensure AuthContext exports default
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { pwaService } from "@/services/pwaService";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Only run PWA service registration on the client side
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      pwaService.registerServiceWorker()
        .then(() => {
          console.log("Service Worker registered from _app.tsx");
          // Only attempt background sync if the browser supports it
          if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
            pwaService.registerBackgroundSync();
          }
        })
        .catch(error => console.error("Service Worker registration failed in _app.tsx:", error));
    }
  }, []);

  return (
    <AuthProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OnTime" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
      </Head>
      <Component {...pageProps} />
      <Toaster richColors />
      <PWAInstallPrompt />
    </AuthProvider>
  );
}
