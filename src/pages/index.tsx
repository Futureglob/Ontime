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
    // Redirect super admin to their dedicated dashboard
    if (mounted && !loading && user && profile?.role === "super_admin") {
      router.push("/superadmin");
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

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
