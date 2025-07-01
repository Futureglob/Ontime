import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfileSettings from "@/components/profile/ProfileSettings";
import type { ReactElement } from "react";

export default function ProfilePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }
    // Redirect super admin to their dashboard immediately
    if (!loading && user && isSuperAdmin) {
      window.location.replace("/superadmin");
      return;
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  // Prevent super admin from seeing profile page
  if (isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to Super Admin...</div>;
  }

  return <ProfileSettings />;
}

// Only apply layout for non-super admin users
ProfilePage.getLayout = function getLayout(page: ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
