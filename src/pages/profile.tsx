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
        router.replace("/superadmin");
      }
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <ProfileSettings />;
}

ProfilePage.getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
