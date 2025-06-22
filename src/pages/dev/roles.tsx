import DashboardLayout from "@/components/layout/DashboardLayout";
import RoleSwitcher from "@/components/dev/RoleSwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { profileService } from "@/services/profileService";
import { UserRole } from "@/types/database";

export default function RolesTestPage() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const loadCurrentRole = useCallback(async () => {
    if (!user) return;
    
    try {
      const profile = await profileService.getProfile(user.id);
      setCurrentRole(profile.role as UserRole);
    } catch (error) {
      console.error("Error loading current role:", error);
    }
  }, [user]); // Added user to dependency array

  useEffect(() => {
    if (user) {
      loadCurrentRole();
    }
  }, [user, loadCurrentRole]); // Added loadCurrentRole to dependency array

  const roleFeatures = {
    [UserRole.ADMIN]: [
      "Full system access",
      "Manage organizations", 
      "Super admin capabilities",
      "System settings",
      "User management",
      "All analytics and reports"
    ],
    [UserRole.MANAGER]: [
      "Create and assign tasks",
      "Manage employees",
      "View task analytics", 
      "Organization settings",
      "Chat with field workers",
      "Download reports"
    ],
    [UserRole.EMPLOYEE]: [
      "View assigned tasks",
      "Update task status",
      "Upload photos",
      "Chat with managers",
      "Field work interface",
      "Offline capabilities"
    ]
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Role Testing</h1>
          <p className="text-muted-foreground">
            Switch between different user roles to test the application features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RoleSwitcher />
          
          <Card>
            <CardHeader>
              <CardTitle>Available Features by Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(roleFeatures).map(([role, features]) => (
                <div key={role} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={currentRole === role ? "default" : "secondary"}
                      className="font-medium"
                    >
                      {role.toUpperCase()}
                    </Badge>
                    {currentRole === role && (
                      <span className="text-xs text-green-600 font-medium">Current</span>
                    )}
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-green-600 mb-2">1. Admin Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Switch to Admin role to test organization management, user administration, 
                  and super admin features.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-blue-600 mb-2">2. Manager Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Switch to Manager role to test task creation, employee management, 
                  and task assignment workflows.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-orange-600 mb-2">3. Employee Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Switch to Employee role to test field work interface, task updates, 
                  and mobile-first features.
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Each role switch will refresh the page and update your profile. 
                The sidebar navigation and available features will change based on your current role.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
