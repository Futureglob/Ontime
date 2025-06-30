import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Component {...pageProps} />
        <Toaster />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default MyApp;
