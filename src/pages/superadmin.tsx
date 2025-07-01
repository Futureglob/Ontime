
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";

export default function SuperAdminPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // If not logged in and not on the superadmin page, do nothing (allow access to login)
      return;
    }
    if (!isSuperAdmin) {
      router.replace("/");
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <SuperAdminLogin onSuccess={() => router.reload()} />;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
          <p className="mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <SuperAdminDashboard />;
}

// Override the default layout for super admin page - MOVED AFTER COMPONENT
SuperAdminPage.getLayout = function getLayout(page: React.ReactElement) {
  return <div className="min-h-screen bg-background">{page}</div>;
};
