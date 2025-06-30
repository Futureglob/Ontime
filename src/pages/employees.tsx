
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EmployeeManagement from "@/components/employees/EmployeeManagement";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function EmployeesPage() {
  const { currentProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentProfile) {
      router.push("/");
    }
  }, [loading, currentProfile, router]);

  if (loading || !currentProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (currentProfile.role !== "org_admin" && currentProfile.role !== "task_manager") {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <EmployeeManagement />
      </div>
    </DashboardLayout>
  );
}
