import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardTitle
// Removed Badge import
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Clock, User } from "lucide-react"; // Removed MapPin
import { taskService } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { useAuth } from "@/contexts/AuthContext";
import { TaskStatus, UserRole, Profile, Task as TaskType } from "@/types/database"; // Renamed Task to TaskType to avoid conflict
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";

// Define a more specific type for the task that includes profile data
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
    if (user && userProfile) { // Ensure userProfile is loaded before fetching tasks based on role
      try {
        setLoading(true);
        let tasksData;
        if (userProfile.role === UserRole.EMPLOYEE) {
          tasksData = await taskService.getTasksByEmployee(user.id);
        } else if (userProfile.organization_id) {
          tasksData = await taskService.getTasksByOrganization(userProfile.organization_id);
        }
        setTasks((tasksData as EnrichedTask[]) || []);
      } catch (error) {
        console.error("Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    } else if (user && !userProfile) {
      // If userProfile is not yet loaded but user exists, it might be the initial load.
      // loadUserProfile will trigger a re-render, and then loadTasks will run with userProfile.
      // Alternatively, you could chain them or ensure profile is fetched first.
      // For now, this handles the case where userProfile might not be immediately available.
      setLoading(true); // Keep loading true until profile and tasks are fetched
    }
  }, [user, userProfile]);

  const loadEmployees = useCallback(async () => {
    if (user && userProfile && userProfile.organization_id && userProfile.role !== UserRole.EMPLOYEE) {
      try {
        const employeesData = await profileService.getOrganizationEmployees(userProfile.organization_id);
        setEmployees(employeesData || []);
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile) { // Load tasks and employees once userProfile is available
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

  // getStatusColor function is removed as it's not used here (it's in TaskCard)

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
    
    return { total, assigned, inProgress, completed };
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            {userProfile?.role === UserRole.EMPLOYEE 
              ? "View and manage your assigned tasks" 
              : "Create, assign, and monitor tasks"}
          </p>
        </div>
        {userProfile?.role !== UserRole.EMPLOYEE && (
          <Button onClick={() => setShowTaskForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold">{stats.assigned}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdated={handleTaskUpdated}
            userRole={userProfile?.role}
            employees={employees}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
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
