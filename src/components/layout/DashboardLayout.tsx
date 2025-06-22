
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import TaskManagement from "@/components/tasks/TaskManagement";
import EmployeeManagement from "@/components/employees/EmployeeManagement";
import FieldWork from "@/components/field/FieldWork";
import ChatInterface from "@/components/chat/ChatInterface";
import Analytics from "@/components/analytics/Analytics";
import OrganizationSettings from "@/components/organization/OrganizationSettings";
import ProfileSettings from "@/components/profile/ProfileSettings";
import Settings from "@/components/settings/Settings";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardOverview />;
      case "tasks":
        return <TaskManagement />;
      case "employees":
        return <EmployeeManagement />;
      case "field-work":
        return <FieldWork />;
      case "chat":
        return <ChatInterface />;
      case "analytics":
        return <Analytics />;
      case "organization":
        return <OrganizationSettings />;
      case "profile":
        return <ProfileSettings />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[2000px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
