import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/SimpleAuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import FieldWork from "@/components/field/FieldWork";

export default function FieldPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Field Work</h1>
          <p className="text-gray-600">Manage field tasks and location-based work</p>
        </div>
        <FieldWork />
      </div>
    </DashboardLayout>
  );
}
