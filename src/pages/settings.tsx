
        import { useAuth } from "@/contexts/AuthContext";
        import DashboardLayout from "@/components/layout/DashboardLayout";
        import Settings from "@/components/settings/Settings";
        import LoginForm from "@/components/auth/LoginForm";

        export default function SettingsPage() {
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
              <Settings />
            </DashboardLayout>
          );
        }
      