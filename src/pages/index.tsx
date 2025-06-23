import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Redirect users based on their role
    if (mounted && !loading && user && profile) {
      if (profile.role === "super_admin") {
        router.push("/superadmin");
      } else if (profile.role === "org_admin") {
        router.push("/orgadmin");
      }
      // Other roles stay on the main dashboard
    }
  }, [mounted, loading, user, profile, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // If super admin, show loading while redirecting
  if (profile?.role === "super_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to Super Admin Dashboard...</div>
      </div>
    );
  }

  // If org admin, show loading while redirecting
  if (profile?.role === "org_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to Organization Dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
