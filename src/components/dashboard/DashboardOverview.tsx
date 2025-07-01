import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function DashboardOverview() {
  const { currentProfile } = useAuth();

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Badge variant="outline">
          {currentProfile.role.charAt(0).toUpperCase() + currentProfile.role.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No tasks yet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tasks pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to OnTime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Welcome, {currentProfile.full_name}! You are logged in as {currentProfile.role} for {currentProfile.organization_id}.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm"><strong>Employee ID:</strong> {currentProfile.employee_id}</p>
              <p className="text-sm"><strong>Designation:</strong> {currentProfile.designation}</p>
              <p className="text-sm"><strong>Status:</strong> {currentProfile.is_active ? "Active" : "Inactive"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentProfile.role === "admin" && (
                <p className="text-sm text-muted-foreground">• Manage employees and tasks</p>
              )}
              {currentProfile.role === "manager" && (
                <p className="text-sm text-muted-foreground">• Assign and track tasks</p>
              )}
              <p className="text-sm text-muted-foreground">• View your assigned tasks</p>
              <p className="text-sm text-muted-foreground">• Update task progress</p>
              <p className="text-sm text-muted-foreground">• Communicate with team</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
