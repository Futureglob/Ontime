import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileSettings from "@/components/profile/ProfileSettings";

export default function ProfilePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
      } else if (isSuperAdmin) {
        // Force immediate redirect for super admin - use window.location for immediate redirect
        window.location.replace("/superadmin");
        return;
      }
    }
  }, [user, loading, isSuperAdmin, router]);

  // Prevent any rendering for super admin
  if (isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to Super Admin...</div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <ProfileSettings />;
}

ProfilePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
