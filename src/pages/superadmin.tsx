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

  // If user exists but no profile yet, show loading
  if (!currentProfile) {
    return <div className="p-6">Loading profile...</div>;
  }

  // If user exists but not super admin, show access denied
  if (currentProfile.role !== "super_admin") {
    return <div className="p-6">Access Denied. Super Admin privileges required.</div>;
  }

  // User is super admin, show dashboard
  return <SuperAdminDashboard />;
}
