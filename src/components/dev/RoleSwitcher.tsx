
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Users, Shield, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { UserRole } from "@/types/database";

interface TestUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  description: string;
}

const TEST_USERS: TestUser[] = [
  {
    id: "admin-test-user",
    email: "admin@ontime.com",
    full_name: "Admin User",
    role: UserRole.ADMIN,
    description: "Full system access, can manage organizations and users"
  },
  {
    id: "manager-test-user", 
    email: "manager@ontime.com",
    full_name: "Task Manager",
    role: UserRole.MANAGER,
    description: "Can create and assign tasks, manage employees"
  },
  {
    id: "employee-test-user",
    email: "employee@ontime.com", 
    full_name: "Field Employee",
    role: UserRole.EMPLOYEE,
    description: "Receives and completes assigned tasks in the field"
  }
];

export default function RoleSwitcher() {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [selectedTestUser, setSelectedTestUser] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentRole();
    }
  }, [user]);

  const loadCurrentRole = async () => {
    if (!user) return;
    
    try {
      const profile = await profileService.getProfile(user.id);
      setCurrentRole(profile.role as UserRole);
    } catch (error) {
      console.error("Error loading current role:", error);
    }
  };

  const switchRole = async () => {
    if (!user || !selectedTestUser) return;
    
    try {
      setLoading(true);
      const testUser = TEST_USERS.find(u => u.id === selectedTestUser);
      if (!testUser) return;

      // Update the current user's profile to match the test role
      await profileService.updateProfile(user.id, {
        role: testUser.role,
        full_name: testUser.full_name
      });

      setCurrentRole(testUser.role);
      
      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error("Error switching role:", error);
      alert("Failed to switch role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="h-4 w-4" />;
      case UserRole.MANAGER:
        return <Briefcase className="h-4 w-4" />;
      case UserRole.EMPLOYEE:
        return <Users className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-100 text-red-800";
      case UserRole.MANAGER:
        return "bg-blue-100 text-blue-800";
      case UserRole.EMPLOYEE:
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Role Testing
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current Role:</span>
          {currentRole && (
            <Badge className={`${getRoleColor(currentRole)} flex items-center gap-1`}>
              {getRoleIcon(currentRole)}
              {currentRole.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Switch to Test Role:</label>
          <Select value={selectedTestUser} onValueChange={setSelectedTestUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test role..." />
            </SelectTrigger>
            <SelectContent>
              {TEST_USERS.map((testUser) => (
                <SelectItem key={testUser.id} value={testUser.id}>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(testUser.role)}
                    <span>{testUser.full_name}</span>
                    <Badge className={`text-xs ${getRoleColor(testUser.role)}`}>
                      {testUser.role}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTestUser && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {TEST_USERS.find(u => u.id === selectedTestUser)?.description}
            </p>
          </div>
        )}

        <Button 
          onClick={switchRole} 
          disabled={!selectedTestUser || loading}
          className="w-full"
        >
          {loading ? "Switching..." : "Switch Role"}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>⚠️ This will update your current profile and refresh the page.</p>
          <p>Use this to test different user experiences.</p>
        </div>
      </CardContent>
    </Card>
  );
}
