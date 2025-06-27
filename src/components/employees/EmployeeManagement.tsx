import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Removed Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
// Removed Select, SelectContent, SelectItem, SelectTrigger, SelectValue
import { Plus, Search, User, Phone, Calendar, Edit, Trash2 } from "lucide-react"; // Removed MapPin
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
// Removed authService
import { Profile, UserRole } from "@/types/database";
import EmployeeForm from "./EmployeeForm";

export default function EmployeeManagement() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (user) {
      try {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
      }
    }
  }, [user]);

  const loadEmployees = useCallback(async () => {
    if (user && userProfile && userProfile.organization_id) {
      try {
        setLoading(true);
        const employeesData = await profileService.getOrganizationProfiles(userProfile.organization_id);
        setEmployees(employeesData as Profile[]);
      } catch (error) {
        console.error("Error loading employees:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile) {
      loadEmployees();
    }
  }, [userProfile, loadEmployees]);

  const handleEmployeeCreated = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(null);
    loadEmployees();
  };

  const handleEditEmployee = (employee: Profile) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const nameMatch = employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const designationMatch = employee.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || designationMatch;
  });

  const getEmployeeStats = () => {
    const total = employees.length;
    const active = employees.filter(e => e.role === UserRole.EMPLOYEE).length;
    const managers = employees.filter(e => e.role === UserRole.MANAGER).length;
    
    return { total, active, managers };
  };

  const stats = getEmployeeStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
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
        <Button onClick={() => setShowEmployeeForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Workers</p>
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
                <p className="text-sm font-medium text-muted-foreground">Managers</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{employee.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
                  </div>
                </div>
                <Badge variant={employee.role === UserRole.MANAGER ? "default" : "secondary"}>
                  {employee.role?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {employee.designation && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{employee.designation}</span>
                </div>
              )}

              {employee.mobile_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{employee.mobile_number}</span>
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
                <Button variant="ghost" size="sm" className="px-3">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
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
