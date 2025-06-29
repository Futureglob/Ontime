import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import EmployeeManagement from "@/components/employees/EmployeeManagement";
import LoginForm from "@/components/auth/LoginForm";

export default function EmployeesPage() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show loading when auth is loading and component is mounted
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show login form if no user
  if (!user) {
    return <LoginForm />;
  }

  // User is authenticated, show employee management
  return (
    <DashboardLayout>
      <EmployeeManagement />
    </DashboardLayout>
  );
}
