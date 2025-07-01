
        import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
        import DashboardLayout from "@/components/layout/DashboardLayout";
        import { useAuth } from "@/contexts/AuthContext";
        import LoginForm from "@/components/auth/LoginForm";

        export default function AnalyticsPage() {
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
              <AnalyticsDashboard />
            </DashboardLayout>
          );
        }
      