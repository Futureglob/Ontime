
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import superAdminService from "@/services/superAdminService";
import type { Organization } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MoreHorizontal, 
  PlusCircle, 
  Edit, 
  Eye, 
  BarChart3, 
  Settings, 
  User, 
  Users, 
  MessageSquare, 
  MapPin, 
  UserCheck,
  Building2,
  Power,
  PowerOff
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddOrganizationModal from "./AddOrganizationModal";
import EditOrganizationModal from "./EditOrganizationModal";
import OrganizationDetailsModal from "./OrganizationDetailsModal";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/router";

interface SystemStats {
  total_organizations: number;
  total_users: number;
  total_tasks: number;
  active_users: number;
}

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Modal states
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [orgToToggle, setOrgToToggle] = useState<Organization | null>(null);

  // Organization data states
  const [orgEmployees, setOrgEmployees] = useState<any[]>([]);
  const [orgTasks, setOrgTasks] = useState<any[]>([]);
  const [orgClients, setOrgClients] = useState<any[]>([]);
  const [orgAnalytics, setOrgAnalytics] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const orgs = await superAdminService.getOrganizations();
      setOrganizations(orgs);
      
      // Mock stats for now
      const mockStats: SystemStats = {
        total_organizations: orgs.length,
        total_users: orgs.length * 5,
        total_tasks: orgs.length * 20,
        active_users: orgs.length * 3
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Failed to fetch super admin data:", error);
      toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationData = async (orgId: string) => {
    try {
      // Mock data for now - replace with actual service calls
      setOrgEmployees([
        { id: "1", full_name: "John Doe", role: "manager", status: "active" },
        { id: "2", full_name: "Jane Smith", role: "employee", status: "active" }
      ]);
      setOrgTasks([
        { id: "1", title: "Sample Task 1", status: "pending", assigned_to: "John Doe" },
        { id: "2", title: "Sample Task 2", status: "completed", assigned_to: "Jane Smith" }
      ]);
      setOrgClients([
        { id: "1", name: "Client A", contact_person: "Alice Johnson" },
        { id: "2", name: "Client B", contact_person: "Bob Wilson" }
      ]);
      setOrgAnalytics({
        totalTasks: 25,
        completedTasks: 18,
        activeEmployees: 12,
        totalClients: 8
      });
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
      toast({ title: "Error", description: "Could not fetch organization data.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      const org = organizations.find(o => o.id === selectedOrgId);
      setSelectedOrg(org || null);
      fetchOrganizationData(selectedOrgId);
    } else {
      setSelectedOrg(null);
      setOrgEmployees([]);
      setOrgTasks([]);
      setOrgClients([]);
      setOrgAnalytics(null);
    }
  }, [selectedOrgId, organizations]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  const handleToggleOrganization = async () => {
    if (!orgToToggle) return;
    try {
      const newStatus = !orgToToggle.is_active;
      await superAdminService.updateOrganization(orgToToggle.id, { is_active: newStatus });
      toast({ 
        title: "Success", 
        description: `Organization ${newStatus ? 'enabled' : 'disabled'}.` 
      });
      setOrgToToggle(null);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleAddSuccess = () => {
    setAddModalOpen(false);
    fetchData();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedOrg(null);
    fetchData();
  };

  if (loading) return <div className="p-6">Loading Super Admin Dashboard...</div>;
  if (!user) return <div className="p-6">Access Denied.</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>

      {/* Quick Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Quick Functions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => setAddModalOpen(true)}
              className="h-20 flex flex-col gap-2"
            >
              <PlusCircle className="h-6 w-6" />
              Create Organization
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/analytics")}
              className="h-20 flex flex-col gap-2"
            >
              <BarChart3 className="h-6 w-6" />
              Analytics
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/profile")}
              className="h-20 flex flex-col gap-2"
            >
              <User className="h-6 w-6" />
              Profile
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push("/settings")}
              className="h-20 flex flex-col gap-2"
            >
              <Settings className="h-6 w-6" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Organizations</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_organizations || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_users || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.total_tasks || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{stats?.active_users || 0}</p></CardContent>
        </Card>
      </div>

      {/* Organization Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Organization for Read-Only View</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an organization to view details..." />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name} - {org.is_active ? "Active" : "Inactive"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Organization Read-Only Views */}
      {selectedOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Organization: {selectedOrg.name}</CardTitle>
            <Badge variant={selectedOrg.is_active ? "default" : "secondary"}>
              {selectedOrg.is_active ? "Active" : "Inactive"}
            </Badge>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Employees</span>
                      </div>
                      <p className="text-2xl font-bold">{orgAnalytics?.activeEmployees || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span className="text-sm">Tasks</span>
                      </div>
                      <p className="text-2xl font-bold">{orgAnalytics?.totalTasks || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <p className="text-2xl font-bold">{orgAnalytics?.completedTasks || 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">Clients</span>
                      </div>
                      <p className="text-2xl font-bold">{orgAnalytics?.totalClients || 0}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="employees">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.full_name}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>
                          <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="tasks">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.title}</TableCell>
                        <TableCell>
                          <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.assigned_to}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="chat">
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Chat messages will be displayed here (Read-only)</p>
                </div>
              </TabsContent>

              <TabsContent value="clients">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.contact_person}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Organizations Management */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setDetailsModalOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedOrg(org); setEditModalOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setOrgToToggle(org)}
                          className={org.is_active ? "text-red-500" : "text-green-500"}
                        >
                          {org.is_active ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" /> Disable
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" /> Enable
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
      
      {selectedOrg && (
        <EditOrganizationModal
          isOpen={isEditModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedOrg(null); }}
          onSuccess={handleEditSuccess}
          organization={selectedOrg}
        />
      )}
      
      <OrganizationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => { setDetailsModalOpen(false); setSelectedOrg(null); }}
        organization={selectedOrg}
      />

      {/* Enable/Disable Confirmation */}
      <AlertDialog open={!!orgToToggle} onOpenChange={() => setOrgToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {orgToToggle?.is_active ? "Disable" : "Enable"} Organization
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {orgToToggle?.is_active ? "disable" : "enable"} "{orgToToggle?.name}"? 
              {orgToToggle?.is_active && " This will prevent all users from accessing the organization."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleOrganization}>
              {orgToToggle?.is_active ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
