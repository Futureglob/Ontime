import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  MapPin,
  MessageSquare,
  BarChart3,
  Settings,
  Building2,
  User,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/taskService";
import { notificationService } from "@/services/notificationService";
import Image from "next/image";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Field Work", href: "/field", icon: MapPin },
  { name: "Messages", href: "/chat", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Organization", href: "/organization", icon: Building2 },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNav = { name: "Super Admin", href: "/superadmin", icon: ShieldCheck };

export default function Sidebar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [taskCount, setTaskCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentProfile = useMemo(() => profile, [profile]);
  const isSuperAdmin = useMemo(() => currentProfile?.role === "super_admin", [currentProfile]);

  const navigationItems = useMemo(() => {
    let nav = [...baseNavigation];

    if (currentProfile) {
      switch (currentProfile.role) {
        case "employee":
          nav = nav.filter((item) =>
            ["Dashboard", "Tasks", "Field Work", "Messages", "Profile"].includes(item.name)
          );
          break;
        case "task_manager":
          nav = nav.filter((item) => !["Organization", "Super Admin"].includes(item.name));
          break;
        case "org_admin":
          nav = nav.filter((item) => item.name !== "Super Admin");
          break;
        case "super_admin":
          // super_admin sees all base items
          break;
        default:
          nav = nav.filter((item) => ["Dashboard", "Tasks", "Profile"].includes(item.name));
          break;
      }
    } else {
        // Not authenticated, show minimal navigation
        return [];
    }

    if (isSuperAdmin && !nav.find((item) => item.name === "Super Admin")) {
      nav.push(superAdminNav);
    }
    
    return nav;
  }, [currentProfile, isSuperAdmin]);

  const loadData = useCallback(async () => {
    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) {
      setTaskCount(0);
      setNotificationCount(0);
      return;
    }

    try {
      const [tasks, notifications] = await Promise.all([
        taskService.getTasksForUser(currentUserId),
        notificationService.getUnreadNotifications(),
      ]);
      setTaskCount(tasks.length);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error("Error loading sidebar ", error);
      setTaskCount(0);
      setNotificationCount(0);
    }
  }, [user?.id, profile?.id]);

  useEffect(() => {
    if (profile) {
        loadData();
    }
  }, [profile, loadData]);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          <Image
            src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
            alt="OnTime Logo"
            width={58}
            height={32}
            className="bg-transparent mix-blend-multiply"
          />
        </div>
        
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigationItems.map((item) => {
            const isActive = router.pathname === item.href || 
                           (item.href !== "/" && router.pathname.startsWith(item.href));
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 h-10"
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {item.name === "Tasks" && taskCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {taskCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {profile && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile.role?.replace("_", " ") || "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
