
import DashboardLayout from "@/components/layout/DashboardLayout";
import SuperAdminManagement from "@/components/superadmin/SuperAdminManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { superAdminService } from "@/services/superAdminService";
import { useRouter } from "next/router";

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      superAdminService.isSuperAdmin(user.id).then(status => {
        setIsSuperAdmin(status);
        setCheckingStatus(false);
        if (!status) {
          router.push("/"); // Redirect if not super admin
        }
      });
    } else if (!authLoading && !user) {
      router.push("/auth/login"); // Redirect if not logged in
      setCheckingStatus(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || checkingStatus) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
     return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Access Denied. You are not a Super Admin.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SuperAdminManagement />
    </DashboardLayout>
  );
}
