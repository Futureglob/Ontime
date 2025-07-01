import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  CheckSquare,
  MessageSquare,
  BarChart3,
  MapPin,
  Settings,
  Building2,
  LogOut
} from "lucide-react";
import type { Profile } from "@/types/database";

interface SidebarProps {
  profile: Profile;
  onLogout: () => void;
}

export default function Sidebar({ profile, onLogout }: SidebarProps) {
  const menuItems = [
    { icon: Home, label: "Dashboard", href: "/" },
    { icon: CheckSquare, label: "Tasks", href: "/tasks" },
    { icon: MapPin, label: "Field Work", href: "/field" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Users, label: "Employees", href: "/employees" },
    { icon: Building2, label: "Clients", href: "/clients" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">OnTime</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{profile.full_name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{profile.role}</p>
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-64 p-6">
        <Button 
          onClick={onLogout}
          variant="outline" 
          className="w-full flex items-center justify-center"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
