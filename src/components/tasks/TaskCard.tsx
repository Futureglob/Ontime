
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, User, Calendar, Phone, Mail } from "lucide-react";
import { Task } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "on_hold": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "returned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isOverdue = new Date(task.deadline) < new Date() && task.status !== "completed";
  const canAcceptTask = user?.role === "employee" && task.status === "assigned" && task.assignedTo === user.id;

  return (
    <Card className={`${isOverdue ? "border-red-200 bg-red-50" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <Badge className={`${getPriorityColor(task.priority)} text-xs`} variant="outline">
            {task.priority.toUpperCase()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(task.status)}>
            {task.status.replace("_", " ").toUpperCase()}
          </Badge>
          <Badge variant="outline">{task.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{task.clientInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600 truncate">{task.location.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className={`${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
              Due: {formatDate(task.deadline)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              Est. {Math.floor(task.estimatedDuration / 60)}h {task.estimatedDuration % 60}m
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{task.clientInfo.contact}</span>
        </div>

        {task.clientInfo.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{task.clientInfo.email}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          {canAcceptTask && (
            <Button size="sm" className="flex-1">
              Accept Task
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
