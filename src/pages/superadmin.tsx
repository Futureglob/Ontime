import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";

export default function SuperAdminPage() {
  const { user, loading, currentProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && currentProfile?.role !== "super_admin") {
      router.push("/"); // Redirect if not super admin
    }
  }, [user, loading, currentProfile, router]);

  const handleLoginSuccess = () => {
    // The AuthContext will handle the user state change,
    // and the useEffect above will trigger the redirect to the dashboard.
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || currentProfile?.role !== "super_admin") {
    return <SuperAdminLogin onSuccess={handleLoginSuccess} />;
  }

  return <SuperAdminDashboard />;
}
