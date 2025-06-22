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
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Profile, UserRole } from "@/types/database";

const navigation = [
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

  const loadUserProfile = useCallback(async () => {
    if (user) {
      try {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setUserProfile(null);
      }
    }
  }, [user]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Show all navigation items for now - role-based filtering can be added later
  const filteredNavigation = navigation;

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
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">OnTime</span>
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
