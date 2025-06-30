import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskManagement from "@/components/tasks/TaskManagement";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function TasksPage() {
  const { currentProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentProfile) {
      router.push("/");
    }
  }, [loading, currentProfile, router]);

  if (loading || !currentProfile) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <TaskManagement />
      </div>
    </DashboardLayout>
  );
}
