
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Toaster />
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}
