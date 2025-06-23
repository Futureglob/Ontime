import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

export default function SuperAdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if user is already logged in and is a super admin
    if (!authLoading && user && profile) {
      if (profile.role === "super_admin") {
        setIsSuperAdminAuthenticated(true);
      } else {
        // Redirect non-super-admin users to main dashboard
        router.push("/");
      }
    }
  }, [authLoading, user, profile, router]);

  const handleSuperAdminLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);
    try {
      // Use the actual auth service to login
      const result = await authService.signIn(email, password);
      
      // Check if the logged in user is a super admin
      if (result.profile?.role === "super_admin") {
        setIsSuperAdminAuthenticated(true);
        // The auth context will handle the login state
      } else {
        throw new Error("Access denied. You are not a super admin.");
      }
    } catch (err) {
      setError((err as Error).message || "Super admin login failed");
      setIsSuperAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is logged in but not a super admin, redirect
  if (user && profile && profile.role !== "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Access Denied. You are not a Super Admin.</div>
      </div>
    );
  }

  // If user is not logged in or not authenticated as super admin, show login
  if (!user || !isSuperAdminAuthenticated) {
    return (
      <SuperAdminLogin
        onLogin={handleSuperAdminLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return <SuperAdminDashboard />;
}
