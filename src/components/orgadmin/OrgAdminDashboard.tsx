import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Settings, 
  BarChart3, 
  Building2, 
  Plus,
  Eye,
  Edit,
  Trash2,
  LogOut,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { profileService } from "@/services/profileService";
import EmployeeForm from "@/components/employees/EmployeeForm";
import { Profile as EmployeeProfile } from "@/types/database"; // Use Profile type

interface OrgStats {
  total_employees: number;
  total_tasks: number;
  active_employees: number;
  pending_tasks: number;
}

export default function OrgAdminDashboard() {
  const { logout, profile } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [stats, setStats] = useState<OrgStats>({
    total_employees: 0,
    total_tasks: 0,
    active_employees: 0,
    pending_tasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      if (profile?.organizationId) {
        const employeesData = await profileService.getOrganizationProfiles(profile.organizationId);
        setEmployees(employeesData || []); 
        
        const activeEmployees = (employeesData || []).filter(emp => emp.is_active === true).length;
        setStats({
          total_employees: (employeesData || []).length,
          total_tasks: 0, 
          active_employees: activeEmployees,
          pending_tasks: 0 
        });
      }
    } catch (error) {
      console.error("Error loading dashboard ", error);
      setEmployees([]); // Ensure employees is an array on error
      setStats({ // Reset stats on error
        total_employees: 0,
        total_tasks: 0,
        active_employees: 0,
        pending_tasks: 0
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.organizationId]); // Add profile.organizationId as a dependency

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee: EmployeeProfile) => { // Use EmployeeProfile
    setSelectedEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    if (confirm(`Are you sure you want to delete "${employeeName}"? This action cannot be undone.`)) {
      try {
        await profileService.deleteProfile(employeeId);
        loadDashboardData(); // Refresh data
      } catch (error) {
        alert("Failed to delete employee: " + (error as Error).message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading Organization Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Organization Dashboard</h1>
                <p className="text-gray-600">Welcome back, {profile?.name || "Admin"}!</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_employees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_employees}</p>
                </div>
                <UserPlus className="h-8 w-8 text-green-600" />
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
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending_tasks}</p>
                </div>
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="employees">Employee Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Overview</TabsTrigger>
            <TabsTrigger value="settings">Organization Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Employee Management</CardTitle>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleAddEmployee}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No employees found. Add your first employee to get started.
                    </div>
                  ) : (
                    employees.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{employee.full_name}</h3>
                            <p className="text-sm text-gray-500">
                              {employee.designation || employee.role} • {employee.employee_id}
                            </p>
                            <p className="text-xs text-gray-400">{employee.email || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={employee.is_active === true ? "default" : "destructive"}>
                            {employee.is_active === true ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            {(employee.role as string || "N/A").replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit Employee"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            title="Delete Employee"
                            onClick={() => handleDeleteEmployee(employee.id, employee.full_name)}
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

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Task Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Task management features will be available soon.
                  <br />
                  You can create task managers and employees who will handle tasks.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Organization Info</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Organization Name</span>
                          <span className="text-sm text-gray-600">Your Organization</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Admin</span>
                          <span className="text-sm text-gray-600">{profile?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Employee ID</span>
                          <span className="text-sm text-gray-600">{profile?.employeeId}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button 
                          className="w-full justify-start"
                          onClick={handleAddEmployee}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add New Employee
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Settings className="h-4 w-4 mr-2" />
                          Organization Settings
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Reports
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm
          employee={selectedEmployee}
          organizationId={profile?.organizationId || ""}
          onClose={() => setShowEmployeeForm(false)}
          onEmployeeCreated={() => {
            setShowEmployeeForm(false);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}
