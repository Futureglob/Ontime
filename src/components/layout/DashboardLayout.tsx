import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import { messageService } from "@/services/messageService";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id]);

  const loadUnreadCount = async () => {
    try {
      const count = await messageService.getUnreadMessageCount(user?.id || "");
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
      setUnreadCount(0);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          <Sidebar />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <Sidebar />
                  </SheetContent>
                </Sheet>

                <div className="hidden lg:block">
                  <h1 className="text-xl font-semibold text-gray-900">OnTime</h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="relative" onClick={() => router.push("/chat")}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
