
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  ClipboardList, 
  Settings, 
  Download, 
  RefreshCw, 
  Shield, 
  Phone, 
  Calendar,
  MoreVertical,
  UserX,
  UserCheck,
  Key,
  Trash2,
  RefreshCcw
} from "lucide-react";
import { organizationManagementService, OrganizationDetails, OrganizationUser, TaskSummary } from "@/services/organizationManagementService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string | null;
}

export default function OrganizationDetailsModal({ isOpen, onClose, organizationId }: OrganizationDetailsModalProps) {
  const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrganizationData = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const [details, taskList] = await Promise.all([
        organizationManagementService.getOrganizationDetails(organizationId),
        organizationManagementService.getOrganizationTasks(organizationId)
      ]);
      
      setOrgDetails(details);
      setTasks(taskList);
    } catch (error) {
      console.error("Error loading organization ", error);
      // Display a message to the user in the modal
      setOrgDetails(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (isOpen && organizationId) {
      loadOrganizationData();
    }
  }, [isOpen, organizationId, loadOrganizationData]);

  const handlePasswordReset = async (user: OrganizationUser) => {
    if (!user.email || user.email === "no-email@system.com") {
        alert(`Cannot send password reset. User ${user.full_name} has no valid email address.`);
        return;
    }
    try {
      await organizationManagementService.sendPasswordResetEmail(user.email);
      alert(`Password reset email sent to ${user.full_name} (${user.email})`);
    } catch (error) {
      alert("Failed to send password reset email: " + (error as Error).message);
    }
  };

  const handleResetPin = async (user: OrganizationUser) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
        alert("You must be logged in to perform this action.");
        return;
    }

    if (confirm(`Are you sure you want to reset the PIN for ${user.full_name}? A new PIN will be generated.`)) {
      try {
        const newPin = await organizationManagementService.resetUserPin(user.id, session.user.id);
        alert(`PIN for ${user.full_name} has been reset. New PIN: ${newPin}. Please share this securely.`);
        loadOrganizationData();
      } catch (error) {
        alert("Failed to reset PIN: " + (error as Error).message);
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await organizationManagementService.toggleUserStatus(userId, !currentStatus);
      loadOrganizationData(); // Refresh data
    } catch (error) {
      alert("Failed to update user status: " + (error as Error).message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await organizationManagementService.updateUserRole(userId, newRole);
      loadOrganizationData(); // Refresh data
    } catch (error) {
      alert("Failed to update user role: " + (error as Error).message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await organizationManagementService.deleteUser(userId);
        loadOrganizationData(); // Refresh data
      } catch (error) {
        alert("Failed to delete user: " + (error as Error).message);
      }
    }
  };

  const handleExportData = async () => {
    if (!organizationId) return;
    
    try {
      const exportData = await organizationManagementService.exportOrganizationData(organizationId);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orgDetails?.name || "organization"}_data_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to export  " + (error as Error).message);
    }
  };

  const filteredUsers = orgDetails?.users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.is_active) ||
                         (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {orgDetails?.name || "Organization Details"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading organization details...
          </div>
        ) : orgDetails ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users ({orgDetails.user_count})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({orgDetails.task_count})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Name</Label>
                      <p className="text-lg font-semibold">{orgDetails.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Person</Label>
                      <p>{orgDetails.contact_person || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Email</Label>
                      <p>{orgDetails.contact_email || "Not specified"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={orgDetails.is_active ? "default" : "destructive"}>
                        {orgDetails.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created</Label>
                      <p>{new Date(orgDetails.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>Total Users</span>
                      </div>
                      <span className="font-semibold">{orgDetails.user_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-green-600" />
                        <span>Total Tasks</span>
                      </div>
                      <span className="font-semibold">{orgDetails.task_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-600" />
                        <span>Active Users</span>
                      </div>
                      <span className="font-semibold">
                        {orgDetails.users.filter(u => u.is_active).length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleExportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button onClick={loadOrganizationData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="org_admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.full_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{user.designation || "No designation"}</span>
                              <span>ID: {user.employee_id || "N/A"}</span>
                              {user.mobile_number && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.mobile_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select value={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="org_admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                          <Badge variant={user.is_active ? "default" : "destructive"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePasswordReset(user)}>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPin(user)}>
                                <RefreshCcw className="h-4 w-4 mr-2" />
                                Reset PIN
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              >
                                {user.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tasks found for this organization.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{task.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Assigned to: {task.assigned_user_name}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              task.status === "completed" ? "default" :
                              task.status === "in_progress" ? "secondary" : "outline"
                            }>
                              {task.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load organization details.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
