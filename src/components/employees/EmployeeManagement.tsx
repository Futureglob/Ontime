
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  User,
  Phone,
  Calendar,
  Edit,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import EmployeeForm from "./EmployeeForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];


export default function EmployeeManagement() {
  const { currentProfile: userProfile, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);

  const loadEmployees = useCallback(async () => {
    if (!userProfile?.organization_id) {
      setEmployeesLoading(false);
      return;
    }

    setEmployeesLoading(true);
    setError(null);
    
    try {
      const employeesData = await profileService.getOrganizationProfiles(
        userProfile.organization_id
      );
      setEmployees(employeesData || []);
    } catch (err) {
      setError("Failed to load employees");
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!authLoading && userProfile?.organization_id) {
      loadEmployees();
    }
  }, [authLoading, userProfile, loadEmployees]);

  const handleEmployeeCreated = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    loadEmployees();
  };

  const handleEditEmployee = (employee: Profile) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = async (employee: Profile) => {
    try {
      await profileService.deleteProfile(employee.id);
      loadEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  const handleResetPin = async (employee: Profile) => {
    try {
      await profileService.updateProfile(employee.id, {
        pin_hash: null,
        pin_created_at: null,
        pin_expires_at: null,
        failed_pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_requested_at: new Date().toISOString(),
      });

      alert(
        `PIN reset successfully for ${employee.full_name}. They can set a new PIN on next login.`
      );
      loadEmployees();
    } catch (error) {
      console.error("Error resetting PIN:", error);
      alert("Failed to reset PIN. Please try again.");
    }
  };

  const canDeleteEmployee = (employee: Profile) => {
    if (!userProfile) return false;
    if (userProfile.role === "org_admin") {
      return employee.role !== "org_admin";
    }
    if (userProfile.role === "task_manager") {
      return employee.role === "employee";
    }
    return false;
  };

  const canResetPin = (employee: Profile) => {
    if (!userProfile) return false;
    const currentUserRole = userProfile.role;
    const targetUserRole = employee.role;
    if (currentUserRole === "org_admin") {
      return (
        targetUserRole === "task_manager" || targetUserRole === "employee"
      );
    }
    if (currentUserRole === "task_manager") {
      return targetUserRole === "employee";
    }
    return false;
  };

  const filteredEmployees = employees.filter((employee) => {
    const nameMatch = employee.full_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const idMatch = employee.employee_id
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const designationMatch = employee.designation
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || designationMatch;
  });

  const getEmployeeStats = () => {
    const total = employees.length;
    const active = employees.filter((e) => e.role === "employee").length;
    const managers = employees.filter(
      (e) => e.role === "task_manager"
    ).length;
    return { total, active, managers };
  };

  const stats = getEmployeeStats();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!userProfile?.organization_id) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            You are not part of an organization. Please contact your
            administrator.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage your organization's workforce and team members
          </p>
        </div>
        <Button
          onClick={() => setShowEmployeeForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Employees
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Workers
                </p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Managers
                </p>
                <p className="text-2xl font-bold">{stats.managers}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {employeesLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Loading employee data...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {employee.full_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_id}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      employee.role === "task_manager"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {employee.role?.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {employee.designation && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium">
                      {employee.designation}
                    </span>
                  </div>
                )}

                {employee.mobile_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">
                      {employee.mobile_number}
                    </span>
                  </div>
                )}

                {employee.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">
                      {new Date(employee.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>

                  {canResetPin(employee) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => handleResetPin(employee)}
                      title="Reset PIN"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}

                  {canDeleteEmployee(employee) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="px-3">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            {employee.full_name}? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteEmployee(employee)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!employeesLoading && filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm
                ? "No employees match your search criteria"
                : "No employees found. Add your first employee to get started."}
            </div>
          </CardContent>
        </Card>
      )}

      {showEmployeeForm && (
        <EmployeeForm
          employee={editingEmployee}
          organizationId={userProfile?.organization_id || ""}
          onClose={() => {
            setShowEmployeeForm(false);
            setEditingEmployee(null);
          }}
          onEmployeeCreated={handleEmployeeCreated}
        />
      )}
    </div>
  );
}
