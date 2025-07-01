
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;
  }

  return <DashboardOverview />;
}

// Conditionally apply layout based on user type
DashboardPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ConditionalLayout>
      {page}
    </ConditionalLayout>
  );
};

function ConditionalLayout({ children }: { children: ReactElement }) {
  const { isSuperAdmin, loading } = useAuth();
  
  // Don't apply dashboard layout for super admin or while loading
  if (loading || isSuperAdmin) {
    return children;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}
