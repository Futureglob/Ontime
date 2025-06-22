
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Clock, 
  Users, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Plus,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { taskService } from "@/services/taskService";
import { UserRole, TaskStatus } from "@/types/database";
import { useRouter } from "next/router";

export default function DashboardOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await profileService.getProfile(user!.id);
      setUserProfile(profile);

      let tasksData;
      if (profile.role === UserRole.EMPLOYEE) {
        tasksData = await taskService.getTasksByEmployee(user!.id);
      } else {
        tasksData = await taskService.getTasksByOrganization(profile.organization_id!);
      }
      
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === TaskStatus.ASSIGNED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    
    return { total, pending, inProgress, completed };
  };

  const getRecentTasks = () => {
    return tasks
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.ASSIGNED: return "bg-blue-100 text-blue-800";
      case TaskStatus.ACCEPTED: return "bg-green-100 text-green-800";
      case TaskStatus.IN_PROGRESS: return "bg-yellow-100 text-yellow-800";
      case TaskStatus.ON_HOLD: return "bg-orange-100 text-orange-800";
      case TaskStatus.COMPLETED: return "bg-emerald-100 text-emerald-800";
      case TaskStatus.RETURNED: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const stats = getTaskStats();
  const recentTasks = getRecentTasks();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.full_name || "User"}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your tasks today.
          </p>
        </div>
        {userProfile?.role !== UserRole.EMPLOYEE && (
          <Button onClick={() => router.push("/tasks")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/tasks")}
              className="flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {task.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            {task.location}
                          </div>
                        )}
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status?.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No tasks found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/tasks")}
              >
                <CheckSquare className="h-6 w-6" />
                View Tasks
              </Button>
              
              {userProfile?.role !== UserRole.EMPLOYEE && (
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => router.push("/employees")}
                >
                  <Users className="h-6 w-6" />
                  Manage Team
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/chat")}
              >
                <Users className="h-6 w-6" />
                Team Chat
              </Button>
              
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => router.push("/analytics")}
              >
                <TrendingUp className="h-6 w-6" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
