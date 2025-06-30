import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/SimpleAuthContext";
import RoleBasedSidebar from "@/components/layout/RoleBasedSidebar";

export default function OrgAdminPage() {
  const { user } = useAuth();

  if (!user || !["super_admin", "org_admin"].includes(user.role)) {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Organization Admin</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Organization Management</h2>
            <p className="text-gray-600">Manage your organization settings and employees.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
