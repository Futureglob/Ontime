
    import "@/styles/globals.css";
    import type { AppProps } from "next/app";
    import AuthProvider from "@/contexts/AuthContext";
    import { Toaster } from "@/components/ui/sonner";
    import { useEffect } from "react";

    export default function App({ Component, pageProps }: AppProps) {
      useEffect(() => {
        const cleanup = async () => {
          if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            console.log("Starting service worker and cache cleanup...");
            
            const cleanupFlag = "sw_cleanup_done_v2";
            if (sessionStorage.getItem(cleanupFlag)) {
              console.log("Cleanup has already been performed in this session.");
              return;
            }

            // Unregister all service workers
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              if (registrations.length) {
                console.log("Unregistering existing service workers...");
                for (const registration of registrations) {
                  await registration.unregister();
                  console.log(`Service worker unregistered: ${registration.scope}`);
                }
              } else {
                console.log("No service workers to unregister.");
              }
            } catch (error) {
              console.error("Error during service worker unregistration:", error);
            }

            // Clear all caches
            if ("caches" in window) {
              try {
                const keys = await caches.keys();
                if (keys.length > 0) {
                  console.log("Clearing all caches...");
                  await Promise.all(keys.map(key => caches.delete(key)));
                  console.log("All caches cleared.");
                } else {
                  console.log("No caches to clear.");
                }
              } catch (error) {
                console.error("Error clearing caches:", error);
              }
            }
            
            console.log("Cleanup complete. Reloading the page to apply changes.");
            sessionStorage.setItem(cleanupFlag, "true");
            window.location.reload();
          }
        };

        cleanup();
      }, []);

      return (
        <AuthProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Toaster />
            <Component {...pageProps} />
          </div>
        </AuthProvider>
      );
    }
  