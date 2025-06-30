import { useAuth } from "@/contexts/SimpleAuthContext";
import RoleBasedSidebar from "@/components/layout/RoleBasedSidebar";
import EmployeeManagement from "@/components/employees/EmployeeManagement";

export default function EmployeesPage() {
  const { user } = useAuth();

  if (!user || !["super_admin", "org_admin", "task_manager"].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <RoleBasedSidebar />
      <div className="flex-1">
        <EmployeeManagement />
      </div>
    </div>
  );
}
