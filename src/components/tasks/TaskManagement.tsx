import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Clock, User, MapPin, Zap } from "lucide-react";
import { taskService } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { realtimeService } from "@/services/realtimeService";
import { useAuth } from "@/contexts/AuthContext";
import { TaskStatus, UserRole, Profile, Task as TaskType } from "@/types/database";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

interface EnrichedTask extends TaskType {
  assigned_to_profile?: { full_name: string; employee_id?: string | null };
  assigned_by_profile?: { full_name: string };
}

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Real-time subscription and offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

  const loadTasks = useCallback(async () => {
    if (user && userProfile) {
      try {
        setLoading(true);
        let tasksData;
        if (userProfile.role === UserRole.EMPLOYEE) {
          tasksData = await taskService.getUserTasks(user.id);
        } else if (userProfile.organization_id) {
          tasksData = await taskService.getTasksForOrganization(userProfile.organization_id);
        }
        setTasks((tasksData as EnrichedTask[]) || []);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    } else if (user && !userProfile) {
      setLoading(true);
    }
  }, [user, userProfile]);

  const loadEmployees = useCallback(async () => {
    if (user && userProfile && userProfile.organization_id && userProfile.role !== UserRole.EMPLOYEE) {
      try {
        const employeesData = await profileService.getOrganizationProfiles(userProfile.organization_id);
        setEmployees(employeesData as Profile[]);
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    }
  }, [user, userProfile]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userProfile?.organization_id) return;

    const subscription = realtimeService.subscribeToTable(
      "tasks",
      `organization_id=eq.${userProfile.organization_id}`,
      (payload) => {
        console.log("Real-time task update:", payload);
        loadTasks();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile?.organization_id, loadTasks]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile) {
      loadTasks();
      loadEmployees();
    }
  }, [userProfile, loadTasks, loadEmployees]);

  const handleTaskCreated = () => {
    setShowTaskForm(false);
    loadTasks();
  };

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const filteredTasks = tasks.filter(task => {
    const titleMatch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = task.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || descriptionMatch || locationMatch;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const assigned = tasks.filter(t => t.status === TaskStatus.ASSIGNED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const urgent = tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      const timeDiff = deadline.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      return daysDiff <= 1 && t.status !== TaskStatus.COMPLETED;
    }).length;
    
    return { total, assigned, inProgress, completed, urgent };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">Task Management</h1>
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Offline
              </div>
            )}
            {isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                <Zap className="w-3 h-3" />
                Live
              </div>
            )}
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            {userProfile?.role === UserRole.EMPLOYEE 
              ? "View and manage your assigned tasks" 
              : "Create, assign, and monitor tasks"}
          </p>
        </div>
        {userProfile?.role !== UserRole.EMPLOYEE && (
          <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-6 w-6 md:h-8 md:w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-xl md:text-2xl font-bold">{stats.assigned}</p>
              </div>
              <div className="h-6 w-6 md:h-8 md:w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-xl md:text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="h-6 w-6 md:h-8 md:w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <div className="h-6 w-6 md:h-8 md:w-8 bg-red-100 rounded-full flex items-center justify-center">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={TaskStatus.ASSIGNED}>Assigned</SelectItem>
            <SelectItem value={TaskStatus.ACCEPTED}>Accepted</SelectItem>
            <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.ON_HOLD}>On Hold</SelectItem>
            <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
            <SelectItem value={TaskStatus.RETURNED}>Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdated={handleTaskUpdated}
            userRole={userProfile?.role as UserRole | undefined}
            employees={employees}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 md:p-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "No tasks match your search criteria" 
                : "No tasks found"}
            </div>
          </CardContent>
        </Card>
      )}

      {showTaskForm && (
        <TaskForm
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
          employees={employees}
        />
      )}
    </div>
  );
}
