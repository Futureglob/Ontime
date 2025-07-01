
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export default function DashboardPage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
    if (!loading && user && isSuperAdmin) {
      window.location.replace("/superadmin");
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  // Apply layout directly in the component for non-super admin users
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
