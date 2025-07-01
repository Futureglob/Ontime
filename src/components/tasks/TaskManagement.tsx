import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { taskService } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Search } from "lucide-react";
import TaskCard from "./TaskCard";
import TaskForm from "./TaskForm";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Database } from "@/integrations/supabase/types";
import { EnrichedTask, Task } from "@/types";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function TaskManagement() {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const canCreateTasks = useMemo(() => 
    currentProfile?.role && ['task_manager', 'org_admin', 'super_admin'].includes(currentProfile.role),
    [currentProfile]
  );

  const loadTasks = useCallback(async () => {
    if (!currentProfile?.organization_id) return;
    setLoading(true);
    try {
      const tasksData = await taskService.getTasks(currentProfile.organization_id);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  const fetchUsers = useCallback(async () => {
    if (!currentProfile?.organization_id) return;
    try {
      const orgUsers = await profileService.getProfilesByOrganization(currentProfile.organization_id);
      setUsers(orgUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
  }, [currentProfile?.organization_id]);

  useEffect(() => {
    loadTasks();
    fetchUsers();
  }, [loadTasks, fetchUsers]);

  const handleEditTask = (task: EnrichedTask) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { assigned_to_profile, created_by_profile, client, photos, ...rest } = task;
    setSelectedTask(rest);
    setShowForm(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(`Are you sure you want to delete this task?`)) return;
    try {
      await taskService.deleteTask(taskId);
      loadTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, statusFilter]);

  const handleSuccess = () => {
    setSelectedTask(null);
    setShowForm(false);
    loadTasks();
  };

  const handleFormSubmit = async (values: Partial<EnrichedTask>) => {
    try {
        if (selectedTask) {
            await taskService.updateTask(selectedTask.id, values);
        } else {
            if(currentProfile?.organization_id && currentProfile?.user_id) {
                const taskData = {
                    ...values,
                    organization_id: currentProfile.organization_id,
                    created_by: currentProfile.user_id,
                }
                await taskService.createTask(taskData);
            }
        }
        handleSuccess();
    } catch (error) {
        console.error("Failed to submit task:", error);
    }
  };

  const employees = useMemo(() => {
    return users.filter(user => user.role === "employee");
  }, [users]);

  const clients = useMemo(() => {
    return users.filter(user => user.role === "client");
  }, [users]);

  const isFormOpen = useMemo(() => {
    return showForm && (selectedTask || employees.length > 0 && clients.length > 0);
  }, [showForm, selectedTask, employees, clients]);

  if (isFormOpen) {
    return (
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleSuccess()}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>
                {selectedTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
            </DialogHeader>
            <TaskForm
                task={selectedTask || undefined}
                employees={employees}
                clients={clients}
                onSubmit={handleFormSubmit}
                onCancel={handleSuccess}
            />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Management</h1>
        {canCreateTasks && (
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks..." 
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
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No tasks found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
