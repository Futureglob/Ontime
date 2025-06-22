
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  MapPin, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  LogOut,
  Building2,
  UserCheck
} from "lucide-react";
import { useRouter } from "next/router";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["org_admin", "task_manager", "employee"] },
    { id: "tasks", label: "Tasks", icon: ClipboardList, roles: ["org_admin", "task_manager", "employee"] },
    { id: "employees", label: "Employees", icon: Users, roles: ["org_admin", "task_manager"] },
    { id: "field-work", label: "Field Work", icon: MapPin, roles: ["employee"] },
    { id: "chat", label: "Messages", icon: MessageSquare, roles: ["org_admin", "task_manager", "employee"] },
    { id: "analytics", label: "Analytics", icon: BarChart3, roles: ["org_admin", "task_manager"] },
    { id: "organization", label: "Organization", icon: Building2, roles: ["org_admin"] },
    { id: "profile", label: "Profile", icon: UserCheck, roles: ["org_admin", "task_manager", "employee"] },
    { id: "settings", label: "Settings", icon: Settings, roles: ["org_admin"] }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || "employee")
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">OnTime</h1>
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {user?.role?.replace("_", " ").toUpperCase()}
            </Badge>
            {user?.employeeId && (
              <span className="text-xs text-gray-500">{user.employeeId}</span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
