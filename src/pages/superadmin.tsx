import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

export default function SuperAdminPage() {
  const { currentProfile, loading, logout } = useAuth();

  const handleLogin = async (password: string) => {
    const email = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
    if (!email) {
      console.error("Super admin email not configured");
      return;
    }
    try {
      const { error } = await authService.login(email, password);
      if (error) throw error;
    } catch (error) {
      console.error("Super admin login failed", error);
      alert("Login failed. Please check credentials.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentProfile || currentProfile.role !== "super_admin") {
    return <SuperAdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Super Admin Dashboard
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <SuperAdminDashboard />
        </div>
      </main>
    </div>
  );
}
