import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { taskService, Task } from "@/services/taskService";
import { Database } from "@/integrations/supabase/types";
import { clientService, Client } from "@/services/clientService";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.date().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  client_id: z.string().uuid().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface TaskFormProps {
  task?: Task | null;
  users: Profile[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, users, onSuccess, onCancel }: TaskFormProps) {
  const { currentProfile } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      assignee_id: task?.assignee_id || "",
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      priority: task?.priority || "medium",
      status: task?.status || "pending",
      client_id: task?.client_id || "",
    },
  });

  const { register, control, handleSubmit, formState: { errors } } = form;

  useEffect(() => {
    async function fetchClients() {
      if (currentProfile?.organization_id) {
        try {
          const clientList = await clientService.getClientsByOrg(currentProfile.organization_id);
          setClients(clientList);
        } catch (error) {
          toast({ title: "Error", description: "Could not fetch clients.", variant: "destructive" });
        }
      }
    }
    fetchClients();
  }, [currentProfile?.organization_id, toast]);

  const onSubmit = async (formData: FormData) => {
    if (!currentProfile) return;

    setLoading(true);
    try {
      const values: Partial<Task> = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
        organization_id: currentProfile.organization_id,
        created_by: currentProfile.id,
        assignee_id: formData.assignee_id || currentProfile.id,
      };

      if (task) {
        await taskService.updateTask(task.id, values);
      } else {
        await taskService.createTask({ ...values, created_by: currentProfile.id });
      }
      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Failed to save task:", error);
      // Do not show alert, handle error silently or with a toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{task ? "Edit Task" : "Create New Task"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title">Title</label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label>Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label>Assign To</label>
              <Controller
                name="assignee_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {Array.isArray(users) && users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name || user.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label>Client</label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <label>Due Date</label>
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
