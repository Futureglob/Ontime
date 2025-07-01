
        import { useAuth } from "@/contexts/AuthContext";
        import DashboardLayout from "@/components/layout/DashboardLayout";
        import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
        import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";

        export default function SuperAdminPage() {
          const { user, loading, profile } = useAuth();

          if (loading) {
            return (
              <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
              </div>
            );
          }

          if (!user || profile?.role !== "super_admin") {
            return <SuperAdminLogin />;
          }

          return (
            <DashboardLayout>
              <SuperAdminDashboard />
            </DashboardLayout>
          );
        }
      