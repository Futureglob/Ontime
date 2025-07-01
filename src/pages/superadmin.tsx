import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import { useRouter } from "next/router";

export default function SuperAdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is logged in and is a superadmin, show the dashboard
  if (user && profile?.role === "superadmin") {
    return (
      <DashboardLayout>
        <SuperAdminDashboard />
      </DashboardLayout>
    );
  }

  // If user is logged in but not a superadmin, redirect
  if (user) {
    router.replace("/tasks"); // or to a generic dashboard
    return <div>Redirecting...</div>;
  }

  // If no user, show the login form
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SuperAdminLogin onLogin={() => router.push("/superadmin")} />
    </div>
  );
}
