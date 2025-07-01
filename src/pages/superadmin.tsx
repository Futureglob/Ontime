import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";

// Override the default layout for super admin page
SuperAdminPage.getLayout = function getLayout(page: React.ReactElement) {
  return <div className="min-h-screen bg-background">{page}</div>;
};

export default function SuperAdminPage() {
  const { user, loading, currentProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-super-admin users to home
    if (!loading && user && currentProfile && currentProfile.role !== "super_admin") {
      router.replace("/");
    }
  }, [user, loading, currentProfile, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If no user, show login
  if (!user) {
    return <SuperAdminLogin onSuccess={() => router.reload()} />;
  }

  // If user exists but profile indicates they're not super admin, deny access
  if (currentProfile && currentProfile.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2">Super Admin privileges required.</p>
        </div>
      </div>
    );
  }

  // Show dashboard for authenticated super admins
  return <SuperAdminDashboard />;
}
