import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import authService from "@/services/authService";
import {
  Home,
  Users,
  CheckSquare,
  MessageSquare,
  BarChart3,
  MapPin,
  Settings,
  Building2,
  UserCircle,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/types/database";

interface SidebarProps {
  profile: Profile;
  onLogout: () => void;
}

export default function Sidebar({ profile, onLogout }: SidebarProps) {
  const router = useRouter();
  const { pathname } = router;

  const getNavLinks = () => {
    switch (profile.role) {
      case "super_admin":
        return [
          { href: "/superadmin", label: "Dashboard", icon: Home },
          { href: "/settings", label: "System Settings", icon: Settings },
        ];
      case "admin":
        return [
          { href: "/tasks", label: "Tasks", icon: CheckSquare },
          { href: "/employees", label: "Employees", icon: Users },
          { href: "/clients", label: "Clients", icon: Users },
          { href: "/chat", label: "Chat", icon: MessageSquare },
          { href: "/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/organization", label: "Organization", icon: Building2 },
        ];
      case "manager":
        return [
            { href: "/tasks", label: "Tasks", icon: CheckSquare },
            { href: "/employees", label: "Employees", icon: Users },
            { href: "/clients", label: "Clients", icon: Users },
            { href: "/chat", label: "Chat", icon: MessageSquare },
            { href: "/analytics", label: "Analytics", icon: BarChart3 },
        ];
      case "employee":
        return [
          { href: "/tasks", label: "My Tasks", icon: CheckSquare },
          { href: "/field", label: "Field Work", icon: MapPin },
          { href: "/chat", label: "Chat", icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-64 bg-background border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">OnTime</h1>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant={pathname.startsWith(href) ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-4 mb-4">
          <Avatar>
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.designation}</p>
          </div>
        </div>
        <Link href="/profile">
          <Button variant="ghost" className="w-full justify-start mb-2">
            <UserCircle className="mr-2 h-4 w-4" />
            Profile Settings
          </Button>
        </Link>
        <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-red-500 hover:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
