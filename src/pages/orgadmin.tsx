import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import OrgAdminDashboard from "@/components/orgadmin/OrgAdminDashboard";
import LoginForm from "@/components/auth/LoginForm";

export default function OrgAdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if user is logged in and is an org admin
    if (!authLoading && user && profile) {
      if (profile.role !== "org_admin") {
        // Redirect non-org-admin users to main dashboard
        router.push("/");
      }
    } else if (!authLoading && !user) {
      // Redirect to login if not authenticated
      router.push("/");
    }
  }, [authLoading, user, profile, router]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // If user is logged in but not an org admin, redirect
  if (profile && profile.role !== "org_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Access Denied. You are not an Organization Admin.</div>
      </div>
    );
  }

  return <OrgAdminDashboard />;
}