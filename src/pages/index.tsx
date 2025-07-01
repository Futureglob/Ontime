import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">OnTime</h2>
            <p className="mt-2 text-gray-600">Sign in to your account</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to OnTime</h1>
          <p className="text-gray-600">Your task management dashboard is loading...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
