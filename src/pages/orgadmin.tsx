import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import OrgAdminDashboard from "@/components/orgadmin/OrgAdminDashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrgAdminPage() {
  const { currentProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentProfile || currentProfile.role !== "org_admin") {
        router.push("/");
      }
    }
  }, [currentProfile, loading, router]);

  if (loading || !currentProfile) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <OrgAdminDashboard />
    </DashboardLayout>
  );
}
