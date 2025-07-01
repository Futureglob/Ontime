import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSuperAdmin } = useAuth();

  // Prevent layout rendering for super admin
  if (isSuperAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting to Super Admin...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
