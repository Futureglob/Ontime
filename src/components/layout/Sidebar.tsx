import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  CheckSquare, 
  MessageSquare, 
  BarChart3, 
  Settings,
  MapPin,
  Building2,
  UserCircle,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar() {
  const { currentProfile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: MapPin, label: "Field Work", href: "/field" },
    { icon: Building2, label: "Clients", href: "/clients" },
    { icon: Building2, label: "Organization", href: "/organization" },
    { icon: UserCircle, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">OnTime</h2>
        {currentProfile && (
          <p className="text-sm text-gray-600 mt-1">{currentProfile.full_name}</p>
        )}
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
