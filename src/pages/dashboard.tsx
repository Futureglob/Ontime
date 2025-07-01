import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import type { ReactElement } from "react";

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
    return Loading...;
  }

  if (!user || isSuperAdmin) {
    return Redirecting...;
  }

  return ;
}

// Only apply layout for non-super admin users
DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return {page};
};