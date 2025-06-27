
    import { useState, useEffect } from "react";
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { Badge } from "@/components/ui/badge";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { 
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
    } from "@/components/ui/dialog";
    import { 
      Users, 
      Settings, 
      BarChart3, 
      Plus,
      Eye,
      Edit,
      Trash2,
      UserPlus
    } from "lucide-react";
    import { useAuth } from "@/contexts/AuthContext";
    import { useRouter } from "next/router";
    import { profileService } from "@/services/profileService";
    import EmployeeForm from "@/components/employees/EmployeeForm";
    import Sidebar from "@/components/layout/Sidebar";
    import { Task } from "@/types/database";

    interface EmployeeProfile {
      id: string;
      organization_id: string;
      employee_id: string;
      full_name: string;
      designation: string | null;
      mobile_number: string | null;
      role: string;
      created_at: string;
      updated_at: string;
      email?: string;
      is_active?: boolean | null;
    }

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
      const [tasks, setTasks] = useState<Task[]>([]); // Added tasks state
      const [stats, setStats] = useState<OrgStats>({
        total_employees: 0,
        total_tasks: 0,
        active_employees: 0,
        pending_tasks: 0
      });
      const [loading, setLoading] = useState(true);
      const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
      const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);

      const fetchDashboardData = async (organizationId: string) => {
        try {
          setLoading(true);
          const employeesData = await profileService.getOrganizationProfiles(organizationId);
          const typedEmployees = (employeesData || []) as EmployeeProfile[];
          setEmployees(typedEmployees); 
            
          const activeEmployees = typedEmployees.filter(emp => 
            emp.is_active === true || emp.is_active === undefined || emp.is_active === null
          ).length;
            
          // In a real app, you would fetch tasks data as well
          // For now, we'll keep it empty
          setTasks([]); 

          setStats({
            total_employees: typedEmployees.length,
            total_tasks: 0, // Replace with actual task count later
            active_employees: activeEmployees,
            pending_tasks: 0 // Replace with actual pending task count later
          });
        } catch (error) {
          console.error("Error loading dashboard ", error);
          setEmployees([]);
          setStats({
            total_employees: 0,
            total_tasks: 0,
            active_employees: 0,
            pending_tasks: 0
          });
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        if (profile && profile.organization_id) {
          fetchDashboardData(profile.organization_id);
        }
      }, [profile]);

      if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading dashboard...</p></div>;
      }

      if (!profile || !profile.organization_id) {
        return <div className="flex justify-center items-center h-screen"><p>Unable to load organization data. Please log in again.</p></div>;
      }

      const cardData = [
        { title: "Total Employees", value: stats.total_employees, icon: Users },
        { title: "Active Employees", value: stats.active_employees, icon: UserPlus },
        { title: "Total Tasks", value: stats.total_tasks, icon: BarChart3 },
        { title: "Pending Tasks", value: stats.pending_tasks, icon: Settings },
      ];

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
        setIsEmployeeModalOpen(true);
      };

      const handleEditEmployee = (employee: EmployeeProfile) => {
        setSelectedEmployee(employee);
        setIsEmployeeModalOpen(true);
      };

      const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
        if (confirm(`Are you sure you want to delete "${employeeName}"? This action cannot be undone.`)) {
          try {
            await profileService.deleteProfile(employeeId);
            if(profile.organization_id) fetchDashboardData(profile.organization_id);
          } catch (error) {
            alert("Failed to delete employee: " + (error as Error).message);
          }
        }
      };

      const handleSaveEmployee = () => {
        setIsEmployeeModalOpen(false);
        if(profile.organization_id) fetchDashboardData(profile.organization_id);
      };

      return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile.organization?.name || "Organization"} Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-600 dark:text-gray-300">Welcome, {profile.full_name}</span>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cardData.map((card, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                        <card.icon className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                                <Badge variant={
                                  employee.is_active === false ? "destructive" : "default"
                                }>
                                  {employee.is_active === false ? "Inactive" : "Active"}
                                </Badge>
                                <Badge variant="outline">
                                  {(employee.role || "N/A").replace('_', ' ').toUpperCase()}
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
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No tasks found.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Assigned To</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell>{task.id}</TableCell>
                                <TableCell>{task.title}</TableCell>
                                <TableCell>{task.status}</TableCell>
                                <TableCell>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}</TableCell>
                                <TableCell>{"Unassigned"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
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
                                <span className="text-sm text-gray-600">{profile.organization?.name || "N/A"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Admin</span>
                                <span className="text-sm text-gray-600">{profile?.full_name}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Employee ID</span>
                                <span className="text-sm text-gray-600">{profile?.employee_id}</span>
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
            </main>
          </div>
          <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              </DialogHeader>
              {profile.organization_id && (
                <EmployeeForm
                  onClose={handleSaveEmployee}
                  organizationId={profile.organization_id}
                  employee={selectedEmployee}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      );
    }
  
