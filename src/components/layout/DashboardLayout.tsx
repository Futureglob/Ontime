import { useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { currentProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !currentProfile) {
      router.push('/');
    }
  }, [currentProfile, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!currentProfile) {
    return <div className="flex h-screen items-center justify-center">Please log in to continue.</div>;
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
