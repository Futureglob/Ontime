
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  CheckSquare, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut 
} from "lucide-react";
import authService from "@/services/authService";

export default function Sidebar() {
  const { currentProfile, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: Users, label: "Employees", path: "/employees" },
    { icon: MessageSquare, label: "Chat", path: "/chat" },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">OnTime</h2>
        {currentProfile && (
          <p className="text-sm text-gray-600 mt-2">{currentProfile.full_name}</p>
        )}
      </div>
      
      <nav className="mt-6">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-100 ${
              router.pathname === item.path ? "bg-blue-50 border-r-2 border-blue-500" : ""
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-64 p-6">
        <Button
          onClick={handleLogout}
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
