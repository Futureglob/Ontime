import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Prevent any cross-origin access attempts
    if (typeof window !== "undefined") {
      try {
        // Remove any existing error handlers that might cause issues
        window.onerror = null;
        window.onunhandledrejection = null;
      } catch (error) {
        // Silently handle any errors
        console.warn("Error handler cleanup failed:", error);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center light-blue-gradient">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-sky-700 font-medium">Loading OnTime...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
