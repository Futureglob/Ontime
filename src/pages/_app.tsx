import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { usePWA } from "@/hooks/usePWA";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
