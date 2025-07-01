
        import { useAuth } from "@/contexts/AuthContext";
        import DashboardLayout from "@/components/layout/DashboardLayout";
        import TaskManagement from "@/components/tasks/TaskManagement";
        import LoginForm from "@/components/auth/LoginForm";

        export default function TasksPage() {
          const { user, loading } = useAuth();

          if (loading) {
            return (
              <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
              </div>
            );
          }

          if (!user) {
            return <LoginForm />;
          }

          return (
            <DashboardLayout>
              <TaskManagement />
            </DashboardLayout>
          );
        }
      