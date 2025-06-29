
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmployeeManagement from "@/components/employees/EmployeeManagement";
import TaskManagement from "@/components/tasks/TaskManagement";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import OrganizationSettings from "@/components/organization/OrganizationSettings";
import RealTimeMessaging from "@/components/messaging/RealTimeMessaging";
import Sidebar from "@/components/layout/Sidebar";

export default function OrgAdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  if (!profile) {
    return <div className="flex justify-center items-center h-screen"><p>Unable to load organization data. Please log in again.</p></div>;
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", component: <AnalyticsDashboard /> },
    { id: "employees", label: "Employees", component: <EmployeeManagement /> },
    { id: "tasks", label: "Tasks", component: <TaskManagement /> },
    { id: "settings", label: "Settings", component: <OrganizationSettings /> },
    { id: "messaging", label: "Messaging", component: <RealTimeMessaging /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {profile.organization?.name || "Organization"} Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              Welcome, {profile.full_name} ({profile.organization?.name})
            </span>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </header>
        <main className="p-8">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
