import { useState, useEffect, useCallback } from "react";
import taskService from "@/services/taskService";
import clientService from "@/services/clientService";
import organizationManagementService from "@/services/organizationManagementService";
import type { EnrichedTask, Client, Profile } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TaskForm from "./TaskForm";
import TaskCard from "./TaskCard";
import { useToast } from "@/hooks/use-toast";

export default function TaskManagement() {
  const { currentProfile } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | undefined>(undefined);

  const fetchTasks = useCallback(async () => {
    if (currentProfile) {
      try {
        const fetchedTasks = await taskService.getTasksForOrganization(currentProfile.organization_id);
        setTasks(fetchedTasks);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        toast({ title: "Error", description: `Failed to fetch tasks: ${message}`, variant: "destructive" });
      }
    }
  }, [currentProfile, toast]);

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

  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
  }, [fetchTasks, fetchDropdownData]);

  const handleFormSubmit = async (values: any) => {
    if (!currentProfile) return;
    setIsSubmitting(true);
    try {
      const taskData = {
        ...values,
        organization_id: currentProfile.organization_id,
        created_by: currentProfile.id,
      };

      if (selectedTask) {
        await taskService.updateTask(selectedTask.id, taskData);
        toast({ title: "Success", description: "Task updated successfully." });
      } else {
        await taskService.createTask(taskData);
        toast({ title: "Success", description: "Task created successfully." });
      }
      setIsFormOpen(false);
      setSelectedTask(undefined);
      fetchTasks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = (task: EnrichedTask) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedTask(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Add New Task</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={selectedTask}
              clients={clients}
              employees={employees}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => handleCardClick(task)} />
          ))}
        </div>
      )}
    </div>
  );
}
