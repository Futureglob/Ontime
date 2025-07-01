import type { AppProps } from "next/app";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import "@/styles/globals.css";
import { useEffect } from "react";

function AppContent({ Component, pageProps, router }: AppProps) {
  const { user, loading, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // Only redirect if user is super admin and NOT already on superadmin page
    if (user && isSuperAdmin && router.pathname !== '/superadmin') {
      window.location.replace("/superadmin");
      return;
    }
  }, [user, loading, isSuperAdmin, router.pathname]);

  // Don't show loading screen for super admin redirects - let the page render normally
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return <Component {...pageProps} />;
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <AppContent {...props} />
    </AuthProvider>
  );
}
