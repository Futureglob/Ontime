import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield, 
  Plus,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { superAdminService, SuperAdmin, OrganizationForSuperAdminView, SystemStats } from "@/services/superAdminService";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import AddOrganizationModal from "./AddOrganizationModal";
import EditOrganizationModal from "./EditOrganizationModal";
import SystemSettingsModal from "./SystemSettingsModal";
import OrganizationDetailsModal from "./OrganizationDetailsModal";
import { toast } from "sonner";
import AnalyticsDashboard from "../analytics/AnalyticsDashboard";
import { Organization } from "@/types";

interface DashboardDisplayStats extends SystemStats {
  activeSuperAdmins: number;
}

export default function SuperAdminDashboard() {
  const { currentProfile, logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [stats, setStats] = useState<DashboardDisplayStats>({
    total_organizations: 0,
    total_users: 0,
    total_tasks: 0,
    activeSuperAdmins: 0
  });
  
  // Modal states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationForSuperAdminView | null>(null);
  const [selectedOrgIdForDetails, setSelectedOrgIdForDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const orgsData = await superAdminService.getOrganizations(); 
      const adminsData = await superAdminService.getSuperAdmins();
      const systemStatsData = await superAdminService.getSystemStats(); 
      
      setOrganizations(orgsData);
      setSuperAdmins(adminsData);
      setStats({
        ...systemStatsData, 
        activeSuperAdmins: adminsData.length 
      });
    } catch (error) {
      console.error("Error loading dashboard: ", error);
      toast.error("Failed to load dashboard data.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleViewDetails = (orgId: string) => {
    setSelectedOrgIdForDetails(orgId);
    setShowDetailsModal(true);
  };

  const handleEditOrganization = (org: OrganizationForSuperAdminView) => {
    setSelectedOrganization(org);
    setShowEditOrgModal(true);
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (confirm(`Are you sure you want to delete "${orgName}"? This action cannot be undone.`)) {
      try {
        await superAdminService.deleteOrganization(orgId);
        loadDashboardData(); // Refresh data
      } catch (error) {
        alert("Failed to delete organization: " + (error as Error).message);
      }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_organizations}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Super Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeSuperAdmins}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case "organizations":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Organizations Management</CardTitle>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddOrgModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No organizations found. Create your first organization to get started.
                  </div>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center relative">
                          {org.logo_url ? (
                            <Image src={org.logo_url} alt={org.name} width={32} height={32} className="object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-500">
                            {org.user_count || 0} users • {org.task_count || 0} tasks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={org.is_active ? "default" : "destructive"}>
                          {org.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="ghost" size="sm" title="View Details" onClick={() => handleViewDetails(org.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit Organization"
                          onClick={() => handleEditOrganization(org)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          title="Delete Organization"
                          onClick={() => handleDeleteOrganization(org.id, org.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "admins":
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Super Administrators</CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Super Admin
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {superAdmins.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No super administrators found.
                  </div>
                ) : (
                  superAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{admin.user_name || `Admin (${admin.user_id})`}</h3>
                          <p className="text-sm text-gray-500">{admin.user_email || "Email not available"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        );
      case "analytics":
        return (
          <AnalyticsDashboard />
        );
      default:
        return null;
    }
  };

  if (!currentProfile) {
    return null; // or a spinner
  }

  const navTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "organizations", label: "Organizations" },
    { id: "admins", label: "Admins" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
                alt="OnTime Logo"
                width={72}
                height={40}
                className="bg-transparent mix-blend-multiply"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-gray-600">System-wide management and oversight</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium">Welcome, {currentProfile.full_name}</span>
              <Button onClick={() => setShowSettingsModal(true)}>
                System Settings
              </Button>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <main className="py-8">{renderContent()}</main>
      </div>

      {/* Modals */}
      <AddOrganizationModal
        isOpen={showAddOrgModal}
        onClose={() => setShowAddOrgModal(false)}
        onOrganizationAdded={loadDashboardData}
      />

      <EditOrganizationModal
        isOpen={showEditOrgModal}
        onClose={() => setShowEditOrgModal(false)}
        onOrganizationUpdated={loadDashboardData}
        organization={selectedOrganization}
      />

      <SystemSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <OrganizationDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        organizationId={selectedOrgIdForDetails}
      />
    </div>
  );
}
