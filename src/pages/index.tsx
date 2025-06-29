import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  const { isAuthenticated, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only handle redirects after component is mounted and not already redirecting
    if (mounted && !loading && isAuthenticated && profile && !redirecting) {
      setRedirecting(true);
      
      // Redirect based on role
      if (profile.role === "super_admin") {
        router.push("/superadmin").catch(console.error);
      } else if (profile.role === "org_admin") {
        router.push("/orgadmin").catch(console.error);
      } else {
        // For regular employees, stay on main dashboard
        setRedirecting(false);
      }
    }
  }, [mounted, loading, isAuthenticated, profile, router, redirecting]);

  // Show loading while checking authentication
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <div className="text-lg text-sky-700">Loading OnTime...</div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show redirecting message for admin roles
  if (redirecting || (profile?.role === "super_admin" || profile?.role === "org_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <div className="text-lg text-sky-700">
            {profile?.role === "super_admin" 
              ? "Redirecting to Super Admin Dashboard..." 
              : "Redirecting to Organization Dashboard..."}
          </div>
        </div>
      </div>
    );
  }

  // Show main dashboard for regular employees
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}