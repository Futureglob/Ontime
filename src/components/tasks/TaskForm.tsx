
import { useState, useEffect, useCallback } from "react";
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
import { taskService, Task, TaskInsert, TaskUpdate } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  assigned_to: z.string().optional(),
  deadline: z.date().optional(),
});

interface TaskFormProps {
  task?: Task | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "pending",
      assigned_to: task?.assigned_to || "",
      deadline: task?.deadline ? new Date(task.deadline) : undefined,
    },
  });

  const loadUsers = useCallback(async () => {
    if (profile?.organization_id) {
      try {
        const orgUsers = await profileService.getOrganizationProfiles(profile.organization_id);
        setUsers(orgUsers || []);
      } catch (error) {
        console.error("Failed to load users:", error);
        setUsers([]);
      }
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    if (!profile) return;
    setLoading(true);

    try {
      const data = {
        ...values,
        deadline: values.deadline ? values.deadline.toISOString() : null,
      };

      if (task) {
        await taskService.updateTask(task.id, data as TaskUpdate);
      } else {
        const insertData: TaskInsert = {
          ...data,
          created_by: profile.id,
          organization_id: profile.organization_id,
        };
        await taskService.createTask(insertData);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save task:", error);
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
                name="assigned_to"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
              <label>Deadline</label>
              <Controller
                name="deadline"
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
