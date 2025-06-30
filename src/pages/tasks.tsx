
import { useAuth } from "@/contexts/SimpleAuthContext";
import RoleBasedSidebar from "@/components/layout/RoleBasedSidebar";
import TaskManagement from "@/components/tasks/TaskManagement";

export default function TasksPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please log in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <RoleBasedSidebar />
      <div className="flex-1">
        <TaskManagement />
      </div>
    </div>
  );
}
