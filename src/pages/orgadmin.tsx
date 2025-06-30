import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import OrgAdminDashboard from "@/components/orgadmin/OrgAdminDashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrgAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <OrgAdminDashboard />
    </DashboardLayout>
  );
}
