import type { AppProps } from "next/app";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";

function AppContent({ Component, pageProps, router }: AppProps) {
  const { user, loading, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (!loading && user && isSuperAdmin) {
      // Force immediate redirect for super admin if not on superadmin page
      if (!router.pathname.includes('/superadmin')) {
        window.location.replace("/superadmin");
        return;
      }
    }
  }, [user, loading, isSuperAdmin, router.pathname]);

  // Prevent any non-superadmin UI from rendering for super admins
  if (!loading && user && isSuperAdmin && !router.pathname.includes('/superadmin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Redirecting to Super Admin Dashboard...</p>
        </div>
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
