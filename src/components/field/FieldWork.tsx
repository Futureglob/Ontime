import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Wifi, WifiOff, Bell, BellOff } from "lucide-react";
import { taskService } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { realtimeService } from "@/services/realtimeService";
import { notificationService } from "@/services/notificationService";
import { offlineService } from "@/services/offlineService";
import { useAuth } from "@/contexts/AuthContext";
import { TaskStatus, UserRole, Profile, Task as TaskType } from "@/types/database";
import FieldTaskCard from "./FieldTaskCard";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
// import { useToast } from "@/hooks/use-toast"; // Removed unused useToast

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

interface EnrichedTask extends TaskType {
  assigned_by_profile?: { full_name: string };
}

export default function FieldWork() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  // const { toast } = useToast(); // Removed toast initialization

  // Real-time subscription and offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync offline data when back online
      offlineService.syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check notification permission status
  useEffect(() => {
    setNotificationsEnabled(Notification.permission === 'granted');
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.warn("Could not get location:", error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
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
    if (user && userProfile && userProfile.role === UserRole.EMPLOYEE) {
      try {
        setLoading(true);
        const tasksData = await taskService.getTasksByEmployee(user.id);
        const enrichedTasks = (tasksData as EnrichedTask[]) || [];
        setTasks(enrichedTasks);
        
        // Cache tasks for offline access
        if (isOnline) {
          offlineService.cacheTaskData(enrichedTasks);
        }
      } catch (error) {
        console.error("Error loading tasks:", error);
        
        // Load cached data if offline
        if (!isOnline) {
          const cachedTasks = offlineService.getCachedTaskData();
          if (cachedTasks) {
            setTasks(cachedTasks);
          }
        }
      } finally {
        setLoading(false);
      }
    }
  }, [user, userProfile, isOnline]);

  // Set up real-time subscriptions for employee tasks
  useEffect(() => {
    if (!user || userProfile?.role !== UserRole.EMPLOYEE || !isOnline) return;

    const subscription = realtimeService.subscribeToTable<TaskRow>( // Specify TaskRow for T
      "tasks",
      `assigned_to=eq.${user.id}`,
      (payload: RealtimePostgresChangesPayload<TaskRow>) => { // Explicitly type payload
        console.log("Real-time task update:", payload);
        
        if (payload.eventType === 'INSERT' && payload.new) {
          // payload.new is TaskRow, which doesn't have assigned_by_profile directly.
          // Use a generic name or fetch profile if critical. For notification, generic is fine.
          const assignerName = "Task Manager"; // Simplified to avoid any cast
          notificationService.showTaskAssignedNotification(payload.new.title || 'New Task', assignerName);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          notificationService.showTaskStatusNotification(
            payload.new.title || 'Task', 
            payload.new.status || 'Updated',
            userProfile?.full_name || "System" // Assuming update is triggered by current user or system
          );
        }
        
        loadTasks();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user, userProfile?.role, userProfile?.full_name, loadTasks, isOnline]); // Added userProfile?.full_name

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (userProfile) {
      loadTasks();
    }
  }, [userProfile, loadTasks]);

  const handleTaskUpdated = () => {
    loadTasks();
  };

  const toggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        // Can't programmatically disable, just update state
        setNotificationsEnabled(false);
      } else {
        const permission = await notificationService.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const titleMatch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = task.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || descriptionMatch || locationMatch;
    
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = [TaskStatus.ASSIGNED, TaskStatus.ACCEPTED, TaskStatus.IN_PROGRESS].includes(task.status as TaskStatus);
    } else if (statusFilter === "completed") {
      matchesStatus = task.status === TaskStatus.COMPLETED;
    } else if (statusFilter !== "all") {
      matchesStatus = task.status === statusFilter;
    }
    
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
      const hoursDiff = timeDiff / (1000 * 3600);
      return hoursDiff <= 24 && t.status !== TaskStatus.COMPLETED;
    }).length;
    
    return { total, assigned, inProgress, completed, urgent };
  };

  const stats = getTaskStats();

  // useEffect(() => {
  //   const fetchTasks = async () => {
  //     if (user) {
  //       try {
  //         setLoading(true);
  //         const tasksData = await taskService.getUserTasks(user.id);
  //         setTasks(tasksData);
  //       } catch (err) {
  //         setError("Failed to fetch tasks.");
  //       } finally {
  //         setLoading(false);
  //       }
  //     }
  //   };

  //   fetchTasks();
  // }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your tasks...</div>
      </div>
    );
  }

  // Removed unused handleUpdateTaskStatus as FieldTaskCard likely handles its own updates

  return (
    <div className="space-y-4 px-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Field Work</h1>
              {!isOnline ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  <Wifi className="w-3 h-3" />
                  Online
                </div>
              )}
              <button
                onClick={toggleNotifications}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  notificationsEnabled 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {notificationsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
              </button>
            </div>
            <p className="text-muted-foreground text-sm">
              Manage your assigned tasks and field activities
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-blue-600">{stats.assigned}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-lg font-bold text-orange-600">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Done</p>
                <p className="text-lg font-bold text-green-600">{stats.completed}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className="text-lg font-bold text-red-600">{stats.urgent}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value={TaskStatus.ASSIGNED}>Assigned</SelectItem>
              <SelectItem value={TaskStatus.ACCEPTED}>Accepted</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
              <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
              <SelectItem value={TaskStatus.ON_HOLD}>On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <FieldTaskCard
            key={task.id}
            task={task}
            onTaskUpdated={handleTaskUpdated}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {searchTerm || statusFilter !== "active" 
                ? "No tasks match your search criteria" 
                : "No active tasks assigned to you"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location indicator */}
      {currentLocation && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-3 py-2 rounded-full text-xs flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Location Active
        </div>
      )}
    </div>
  );
}
