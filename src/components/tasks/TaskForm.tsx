import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { taskService } from "@/services/taskService";
import { profileService } from "@/services/profileService";
import { useAuth } from "@/contexts/AuthContext";
import { CreateTaskRequest, Profile } from "@/types/database";

interface TaskFormProps {
  onClose: () => void;
  onTaskCreated: () => void;
  employees: Profile[];
}

export default function TaskForm({ onClose, onTaskCreated, employees }: TaskFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deadline, setDeadline] = useState<Date>();
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    task_type: "",
    location: "",
    location_lat: undefined,
    location_lng: undefined,
    client_info: "",
    deadline: undefined,
    assigned_to: undefined
  });

  const taskTypes = [
    "Installation",
    "Maintenance",
    "Repair",
    "Inspection",
    "Delivery",
    "Survey",
    "Consultation",
    "Training",
    "Other"
  ];

  const handleInputChange = (field: keyof CreateTaskRequest, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationSearch = async () => {
    if (!formData.location) return;
    
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(formData.location)}&key=YOUR_API_KEY&limit=1`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setFormData(prev => ({
          ...prev,
          location_lat: result.geometry.lat,
          location_lng: result.geometry.lng
        }));
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.task_type) {
      alert("Please fill in required fields");
      return;
    }

    try {
      setLoading(true);
      const profile = await profileService.getProfile(user!.id);
      
      const taskData: CreateTaskRequest = {
        ...formData,
        deadline: deadline ? deadline.toISOString() : undefined
      };

      await taskService.createTask(taskData, user!.id, profile.organization_id!);
      onTaskCreated();
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task for your team.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Task Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the task details..."
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Task Type *</label>
              <Select value={formData.task_type} onValueChange={(value) => handleInputChange("task_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Assign to Employee</label>
              <Select value={formData.assigned_to || "unassigned"} onValueChange={(value) => handleInputChange("assigned_to", value === "unassigned" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Location</label>
              <div className="flex gap-2">
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter location address"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocationSearch}
                  className="px-3"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              {formData.location_lat && formData.location_lng && (
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {formData.location_lat.toFixed(6)}, {formData.location_lng.toFixed(6)}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Client Information</label>
              <Input
                value={formData.client_info}
                onChange={(e) => handleInputChange("client_info", e.target.value)}
                placeholder="Client name or details"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Deadline</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Select deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Task"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
