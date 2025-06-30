import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import LoginForm from "@/components/auth/LoginForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { session, loading, currentProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session && !currentProfile) {
      // If session exists but profile is not loaded yet, maybe wait or show loading
      // If profile is fetched and is null, maybe redirect to profile creation
    }
  }, [session, loading, currentProfile, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginForm />;
  }

  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  );
}
