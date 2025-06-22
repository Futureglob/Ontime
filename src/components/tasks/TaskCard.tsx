import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, User, Calendar, MessageSquare, Camera, Navigation } from "lucide-react"; // Removed Clock
import { taskService } from "@/services/taskService";
import { TaskStatus, UserRole, Profile, Task } from "@/types/database";

// Define a more specific type for the task prop
interface EnrichedTask extends Task {
  assigned_to_profile?: { full_name: string; employee_id?: string | null };
  assigned_by_profile?: { full_name: string };
}
interface TaskCardProps {
  task: EnrichedTask;
  onTaskUpdated: () => void;
  userRole?: UserRole;
  employees?: Profile[];
}

export default function TaskCard({ task, onTaskUpdated, userRole, employees }: TaskCardProps) {
  const [updating, setUpdating] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState<TaskStatus>(task.status as TaskStatus); // Ensure task.status is treated as TaskStatus
  const [notes, setNotes] = useState("");

  const getStatusColor = (status: string | null | undefined) => { // Allow status to be string | null | undefined
    switch (status) {
      case TaskStatus.ASSIGNED: return "bg-blue-100 text-blue-800";
      case TaskStatus.ACCEPTED: return "bg-green-100 text-green-800";
      case TaskStatus.IN_PROGRESS: return "bg-yellow-100 text-yellow-800";
      case TaskStatus.ON_HOLD: return "bg-orange-100 text-orange-800";
      case TaskStatus.COMPLETED: return "bg-emerald-100 text-emerald-800";
      case TaskStatus.RETURNED: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      await taskService.updateTaskStatus(task.id, { status: newStatus, notes }, task.assigned_to || task.assigned_by);
      setShowStatusUpdate(false);
      setNotes("");
      onTaskUpdated();
    } catch (error) {
      console.error("Error updating task status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTask = async (employeeId: string) => {
    try {
      await taskService.assignTask(task.id, employeeId);
      onTaskUpdated();
    } catch (error) {
      console.error("Error assigning task:", error);
    }
  };

  const openInMaps = () => {
    if (task.location_lat && task.location_lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${task.location_lat},${task.location_lng}`;
      window.open(url, "_blank");
    } else if (task.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.location)}`;
      window.open(url, "_blank");
    }
  };

  const canUpdateStatus = userRole === UserRole.EMPLOYEE && task.assigned_to;
  const canAssign = userRole !== UserRole.EMPLOYEE && !task.assigned_to;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">{task.title}</CardTitle>
          <Badge className={getStatusColor(task.status)}>
            {task.status?.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{task.task_type}</span>
          </div>

          {task.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium line-clamp-1 flex-1">{task.location}</span>
              {(task.location_lat || task.location) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openInMaps}
                  className="h-6 w-6 p-0"
                >
                  <Navigation className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Deadline:</span>
              <span className="font-medium">
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            </div>
          )}

          {task.assigned_to_profile && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned to:</span>
              <span className="font-medium">{task.assigned_to_profile.full_name}</span>
            </div>
          )}

          {task.assigned_by_profile && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned by:</span>
              <span className="font-medium">{task.assigned_by_profile.full_name}</span>
            </div>
          )}

          {task.client_info && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{task.client_info}</span>
            </div>
          )}

          {(task.travel_distance || task.travel_duration || task.working_hours) && (
            <div className="pt-2 border-t">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {task.travel_distance && (
                  <div className="text-center">
                    <div className="text-muted-foreground">Distance</div>
                    <div className="font-medium">{task.travel_distance}km</div>
                  </div>
                )}
                {task.travel_duration && (
                  <div className="text-center">
                    <div className="text-muted-foreground">Travel</div>
                    <div className="font-medium">{task.travel_duration}min</div>
                  </div>
                )}
                {task.working_hours && (
                  <div className="text-center">
                    <div className="text-muted-foreground">Work</div>
                    <div className="font-medium">{task.working_hours}h</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          {canUpdateStatus && (
            <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Task Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">New Status</label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as TaskStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskStatus.ACCEPTED}>Accept</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.ON_HOLD}>On Hold</SelectItem>
                        <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={TaskStatus.RETURNED}>Return</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this status update..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleStatusUpdate} disabled={updating} className="flex-1">
                      {updating ? "Updating..." : "Update Status"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canAssign && employees && (
            <Select onValueChange={handleAssignTask}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name} ({employee.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="ghost" size="sm" className="px-3">
            <MessageSquare className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" className="px-3">
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
