import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Only run PWA service registration on the client side after mount
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Delay PWA registration to avoid build issues
      setTimeout(async () => {
        try {
          const { pwaService } = await import("@/services/pwaService");
          await pwaService.registerServiceWorker();
          console.log("Service Worker registered successfully");
          
          // Only attempt background sync if supported
          if ("sync" in window.ServiceWorkerRegistration.prototype) {
            pwaService.registerBackgroundSync();
          }
        } catch (error) {
          console.error("PWA service registration failed:", error);
        }
      }, 1000);
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
