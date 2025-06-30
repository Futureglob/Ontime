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
  Bell // Added for notifications
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Profile } from "@/types/database";
import { superAdminService } from "@/services/superAdminService";
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

export default function Sidebar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Memoize the current profile
  const currentProfile = useMemo(() => profile || user?.user_metadata, [profile, user]);

  // Memoize loadUserProfile to prevent unnecessary recreations
  const loadUserProfile = useCallback(async () => {
    const currentUserId = user?.id || profile?.id;
    
    if (!currentUserId) {
      setIsSuperAdmin(false);
      setTaskCount(0);
      setNotificationCount(0);
      return;
    }

    try {
      const [superAdminStatus, tasks, notifications] = await Promise.all([
        superAdminService.isSuperAdmin(currentUserId),
        taskService.getTasksForUser(currentUserId),
        notificationService.getUnreadNotifications()
      ]);

      setIsSuperAdmin(superAdminStatus);
      setTaskCount(tasks.length);
      setNotificationCount(notifications.length);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsSuperAdmin(false);
      setTaskCount(0);
      setNotificationCount(0);
    }
  }, [user?.id, profile?.id]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    if (isSuperAdmin) {
      const adminNav = { name: "Super Admin", href: "/superadmin", icon: ShieldCheck };
      // Add Super Admin link if not already present
      if (!baseNavigation.find(item => item.name === "Super Admin")) {
        setNavigation([...baseNavigation, adminNav]);
      } else {
        // Ensure it's there if baseNavigation somehow got modified elsewhere (defensive)
        const currentNav = [...baseNavigation];
        const existingIndex = currentNav.findIndex(item => item.name === "Super Admin");
        if (existingIndex === -1) {
            currentNav.push(adminNav);
        }
        setNavigation(currentNav);
      }
    } else {
      // Remove Super Admin link if present and user is not super admin
      setNavigation(baseNavigation.filter(item => item.name !== "Super Admin"));
    }
  }, [isSuperAdmin]);

  // Memoize navigation items
  const navigationItems = useMemo(() => {
    if (!currentProfile) return baseNavigation;
    
    return baseNavigation.filter(item => {
      const userRole = currentProfile.role;
      
      switch (userRole) {
        case 'employee':
          return ['Dashboard', 'Tasks', 'Field Work', 'Messages', 'Profile'].includes(item.name);
        case 'task_manager':
          return !['Organization', 'Super Admin'].includes(item.name);
        case 'org_admin':
          return item.name !== 'Super Admin';
        case 'super_admin':
          return true;
        default:
          return true;
      }
    });
  }, [currentProfile]);

  const handleNavigation = (href: string) => {
    if (href === "/") {
      router.push("/");
    } else {
      router.push(href);
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
        
        {/* Notification Bell */}
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

      {(userProfile || profile) && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(userProfile || profile)?.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {(userProfile || profile)?.role?.replace('_', ' ') || "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
