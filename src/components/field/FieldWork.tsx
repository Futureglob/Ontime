import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { Task } from "@/services/taskService";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Map } from "lucide-react";
import FieldTaskCard from "./FieldTaskCard";
import PhotoCapture from "./PhotoCapture";

type EnrichedTask = Task & {
  assignee_name?: string;
  client_name?: string;
};

export default function FieldWork() {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [isPhotoCaptureOpen, setIsPhotoCaptureOpen] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!currentProfile) return;
    setLoading(true);
    try {
      const fetchedTasks = await taskService.getTasksForUser();
      setTasks(fetchedTasks.filter(t => t.task_type === 'field_work'));
    } catch (error) {
      console.error("Failed to load field tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTakePhoto = (task: EnrichedTask) => {
    setSelectedTask(task);
    setIsPhotoCaptureOpen(true);
  };

  const handlePhotoSuccess = () => {
    setIsPhotoCaptureOpen(false);
    setSelectedTask(null);
    loadTasks(); // Refresh tasks to show updated status or photos
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isPhotoCaptureOpen && selectedTask) {
    return (
      <PhotoCapture
        task={selectedTask}
        onSuccess={handlePhotoSuccess}
        onCancel={() => setIsPhotoCaptureOpen(false)}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Field Work</h1>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search field tasks..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <FieldTaskCard 
                key={task.id} 
                task={task} 
                onTakePhoto={() => handleTakePhoto(task)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No field work tasks assigned to you.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
