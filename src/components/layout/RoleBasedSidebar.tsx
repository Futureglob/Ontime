
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Building2,
  UserPlus,
  MapPin,
  MessageSquare,
  Shield
} from "lucide-react";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Dashboard",
    href: "/",
    roles: ["super_admin", "org_admin", "task_manager", "field_worker"]
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: "Super Admin",
    href: "/superadmin",
    roles: ["super_admin"]
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    label: "Organization",
    href: "/organization",
    roles: ["super_admin", "org_admin"]
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Employees",
    href: "/employees",
    roles: ["super_admin", "org_admin", "task_manager"]
  },
  {
    icon: <UserPlus className="w-5 h-5" />,
    label: "Clients",
    href: "/clients",
    roles: ["super_admin", "org_admin", "task_manager"]
  },
  {
    icon: <CheckSquare className="w-5 h-5" />,
    label: "Tasks",
    href: "/tasks",
    roles: ["super_admin", "org_admin", "task_manager", "field_worker"]
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "Field Work",
    href: "/field",
    roles: ["field_worker", "task_manager"]
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    label: "Chat",
    href: "/chat",
    roles: ["super_admin", "org_admin", "task_manager", "field_worker"]
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    label: "Analytics",
    href: "/analytics",
    roles: ["super_admin", "org_admin", "task_manager"]
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: "Settings",
    href: "/settings",
    roles: ["super_admin", "org_admin", "task_manager", "field_worker"]
  }
];

export default function RoleBasedSidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const allowedMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">OnTime</h2>
        <p className="text-sm text-gray-600">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {allowedMenuItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <Button 
          onClick={logout}
          variant="outline" 
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
