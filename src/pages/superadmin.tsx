import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import { useAuth } from "@/contexts/SimpleAuthContext";
import RoleBasedSidebar from "@/components/layout/RoleBasedSidebar";

export default function SuperAdminPage() {
  const { user } = useAuth();

  if (!user || user.role !== "super_admin") {
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
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Management</h2>
            <p className="text-gray-600">Manage all organizations and system settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
