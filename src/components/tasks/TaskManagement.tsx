import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import taskService from "@/services/taskService";
import clientService from "@/services/clientService";
import organizationManagementService from "@/services/organizationManagementService";
import type { EnrichedTask, Client, Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";

export default function TaskManagement() {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentProfile?.organization_id) {
      fetchTasks();
    }
  }, [currentProfile]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const organizationTasks = await taskService.getTasks(currentProfile!.organization_id);
      setTasks(organizationTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = useCallback(async () => {
    if (currentProfile) {
      try {
        const [fetchedClients, fetchedEmployees] = await Promise.all([
          clientService.getClients(currentProfile.organization_id),
          organizationManagementService.getEmployees(currentProfile.organization_id),
        ]);
        setClients(fetchedClients);
        setEmployees(fetchedEmployees);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        toast({ title: "Error", description: `Failed to fetch  ${message}`, variant: "destructive" });
      }
    }
  }, [currentProfile, toast]);

  const handleCreateTask = async (values: Record<string, unknown>) => {
    try {
      setSubmitting(true);
      await taskService.createTask({
        ...values,
        organization_id: currentProfile!.organization_id,
        created_by: currentProfile!.user_id
      } as any);
      await fetchTasks();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (values: Record<string, unknown>) => {
    if (!selectedTask) return;
    
    try {
      setSubmitting(true);
      await taskService.updateTask(selectedTask.id, values as any);
      await fetchTasks();
      setIsEditModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskClick = (task: EnrichedTask) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>Create Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              clients={clients}
              employees={employees}
              onSubmit={handleCreateTask}
              onCancel={() => setIsCreateModalOpen(false)}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => handleTaskClick(task)} className="cursor-pointer">
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={selectedTask}
              clients={clients}
              employees={employees}
              onSubmit={handleEditTask}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedTask(null);
              }}
              submitting={submitting}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
