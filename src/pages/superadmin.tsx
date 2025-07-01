import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";

export default function SuperAdminPage() {
  const { user, loading, currentProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we have a user, profile is loaded, and they're not super admin
    if (!loading && user && currentProfile && currentProfile.role !== "super_admin") {
      console.log("Redirecting non-super-admin user:", currentProfile.role);
      router.push("/");
    }
  }, [user, loading, currentProfile, router]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // If no user, show login
  if (!user) {
    return <SuperAdminLogin onSuccess={() => {}} />;
  }

  // If user exists but profile indicates they're not super admin, deny access
  if (currentProfile && currentProfile.role !== "super_admin") {
    return <div className="p-6">Access Denied. Super Admin privileges required.</div>;
  }

  // If user is authenticated, allow access to super admin dashboard
  // (This handles cases where super admin doesn't have a profile yet)
  return <SuperAdminDashboard />;
}
