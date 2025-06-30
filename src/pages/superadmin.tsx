
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

export default function SuperAdminPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!authLoading) {
      if (user && profile) {
        if (profile.role === "super_admin") {
          setIsSuperAdminAuthenticated(true);
        } else {
          // If a non-super-admin is logged in, deny access and sign them out
          setError("Access denied. You are not a super admin.");
          signOut();
          router.push("/");
        }
      } else {
        setIsSuperAdminAuthenticated(false);
      }
    }
  }, [authLoading, user, profile, router, signOut]);

  const handleSuperAdminLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);
    try {
      // The auth context will handle the login state update
      await authService.signIn(email, password);
      // The useEffect will handle the role check and redirection
    } catch (err) {
      setError((err as Error).message || "Super admin login failed");
      setIsSuperAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSuperAdminAuthenticated) {
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
