import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/SimpleAuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Settings from "@/components/settings/Settings";

export default function SettingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and application settings</p>
        </div>
        <Settings />
      </div>
    </DashboardLayout>
  );
}
