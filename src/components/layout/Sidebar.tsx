import { useState, useEffect, useCallback } from "react";
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
  ShieldCheck // Added for Super Admin
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Profile } from "@/types/database"; // Removed unused UserRole import
import { superAdminService } from "@/services/superAdminService"; // Import superAdminService
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
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [navigation, setNavigation] = useState(baseNavigation);

  const loadUserProfile = useCallback(async () => {
    if (user) {
      try {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
        const superAdminStatus = await superAdminService.isSuperAdmin(user.id);
        setIsSuperAdmin(superAdminStatus);
      } catch (error) {
        console.error("Error loading user profile or super admin status:", error);
        setUserProfile(null);
        setIsSuperAdmin(false);
      }
    }
  }, [user]);

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


  // Show all navigation items for now - role-based filtering can be added later
  const filteredNavigation = navigation; // Use the dynamic navigation state

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
        <div className="flex items-center gap-3">
          <Image
            src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
            alt="OnTime Logo"
            width={58}
            height={32}
            className="bg-transparent mix-blend-multiply"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => {
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
                {item.name === "Tasks" && (
                  <Badge variant="secondary" className="ml-auto">
                    5
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>
      </div>

      {userProfile && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile.full_name || "User"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile.role || "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
