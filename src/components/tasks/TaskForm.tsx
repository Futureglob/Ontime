import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, Profile } from "@/types";
import { taskService } from "@/services/taskService";
import { Textarea } from "@/components/ui/textarea";


interface TaskFormProps {
  task?: Task | null;
  users: Profile[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, users, onSuccess, onCancel }: TaskFormProps) {
  const { currentProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    dueDate: task?.due_date || "",
    assigneeId: task?.assignee_id || "",
    location: task?.location || "",
    clientId: task?.client_id || "",
    taskType: task?.task_type || "maintenance"
  });

  const [clients, setClients] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        dueDate: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
        assigneeId: task.assignee_id || "",
        location: task.location || "",
        clientId: task.client_id || "",
        taskType: task.task_type || "maintenance"
      });
    }
  }, [task]);

  useEffect(() => {
    // In a real app, you'd fetch this from a service
    setClients([
      { id: "1", name: "ABC Construction" },
      { id: "2", name: "XYZ Trading" },
      { id: "3", name: "Tech Solutions LLC" }
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    try {
      const taskData = {
        ...formData,
        due_date: formData.dueDate || null,
        assignee_id: formData.assigneeId || null,
        client_id: formData.clientId || null,
      };

      if (task) {
        await taskService.updateTask(task.id, taskData);
      } else {
        await taskService.createTask({
          ...taskData,
          organization_id: currentProfile.organization_id,
          created_by: currentProfile.id,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{task ? "Edit Task" : "Create New Task"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="assigneeId">Assign To</Label>
              <Select value={formData.assigneeId} onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="clientId">Client</Label>
              <Select value={formData.clientId} onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Task location"
              />
            </div>
            
            <div>
              <Label htmlFor="taskType">Task Type</Label>
              <Select value={formData.taskType} onValueChange={(value) => setFormData(prev => ({ ...prev, taskType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="w-full p-2 border rounded-md"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Task description..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {task ? "Update Task" : "Create Task"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
