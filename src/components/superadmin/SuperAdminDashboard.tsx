import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Plus,
  Eye,
  Edit,
  Trash2,
  LogOut
} from "lucide-react";
import { superAdminService, SuperAdmin, OrganizationForSuperAdminView, SystemStats } from "@/services/superAdminService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Image from "next/image";
import AddOrganizationModal from "./AddOrganizationModal";
import EditOrganizationModal from "./EditOrganizationModal";
import SystemSettingsModal from "./SystemSettingsModal";

interface DashboardDisplayStats extends SystemStats {
  activeSuperAdmins: number;
}

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationForSuperAdminView[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [stats, setStats] = useState<DashboardDisplayStats>({
    total_organizations: 0,
    total_users: 0,
    total_tasks: 0,
    activeSuperAdmins: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationForSuperAdminView | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading Super Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png" 
                alt="OnTime Logo" 
                className="h-10 w-auto bg-transparent mix-blend-multiply"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-gray-600">System-wide management and oversight</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

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

        <Tabs defaultValue="organizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="admins">Super Admins</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
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
                          <Button variant="ghost" size="sm" title="View Details">
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
          </TabsContent>

          <TabsContent value="admins">
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
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>System Settings</CardTitle>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Settings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Application Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Maintenance Mode</span>
                          <Badge variant="secondary">Disabled</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">User Registration</span>
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Email Notifications</span>
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Security Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Two-Factor Auth</span>
                          <Badge className="bg-green-100 text-green-800">Required</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Session Timeout</span>
                          <Badge variant="secondary">24 hours</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Password Policy</span>
                          <Badge className="bg-green-100 text-green-800">Strong</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Update Settings
                    </Button>
                    <Button variant="outline">
                      Export Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
    </div>
  );
}
