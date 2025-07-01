import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Briefcase,
  MapPin,
  Users,
  Users2,
  MessageSquare,
  BarChart2,
  Building,
  User,
  Settings,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/taskService";
import { notificationService } from "@/services/notificationService";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import RoleSwitcher from "@/components/dev/RoleSwitcher";

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Tasks", href: "/tasks", icon: Briefcase },
  { name: "Field Work", href: "/field", icon: MapPin },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Clients", href: "/clients", icon: Users2 },
  { name: "Messages", href: "/chat", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Organization", href: "/organization", icon: Building },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

const superAdminNav = { name: "Super Admin", href: "/superadmin", icon: ShieldCheck };

export default function Sidebar() {
  const { currentProfile, logout } = useAuth();
  const router = useRouter();

  const navigationItems = useMemo(() => {
    if (!currentProfile) return [];

    let nav = [...baseNavigation];

    switch (currentProfile.role) {
      case "employee":
        nav = nav.filter((item) =>
          ["Dashboard", "Tasks", "Field Work", "Messages", "Profile"].includes(item.name)
        );
        break;
      case "task_manager":
        nav = nav.filter((item) => 
          !["Organization", "Super Admin"].includes(item.name)
        );
        break;
      case "org_admin":
        nav = nav.filter((item) => item.name !== "Super Admin");
        break;
      case "super_admin":
        if (!nav.find((item) => item.name === "Super Admin")) {
          nav.push(superAdminNav);
        }
        break;
      default:
        nav = nav.filter((item) => ["Dashboard", "Tasks", "Profile"].includes(item.name));
        break;
    }
    
    return nav;
  }, [currentProfile]);

  const [taskCount, setTaskCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentProfile) {
      setTaskCount(0);
      setNotificationCount(0);
      return;
    }

    try {
      const [tasks, notifications] = await Promise.all([
        taskService.getTasksForUser(currentProfile.user_id),
        notificationService.getUnreadNotifications(),
      ]);
      const pendingCount = tasks.filter(task => 
        task.assigned_to === currentProfile.user_id && 
        ['assigned', 'pending'].includes(task.status)
      ).length;
      setTaskCount(pendingCount);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error("Error loading sidebar data:", error);
      setTaskCount(0);
      setNotificationCount(0);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
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
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                router.pathname === item.href && "bg-muted text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
              {item.name === "Messages" && taskCount > 0 && (
                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  {taskCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {currentProfile && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentProfile.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentProfile.role?.replace("_", " ") || "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          className="w-full justify-center gap-3 h-10"
          onClick={handleLogout}
        >
          <User className="h-4 w-4" />
          Logout
        </Button>
      </div>
      <div className="mt-auto p-4">
        <RoleSwitcher />
      </div>
    </div>
  );
}
