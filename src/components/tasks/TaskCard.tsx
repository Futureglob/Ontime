import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { EnrichedTask } from "@/types";
import { Edit, Trash2, User, Calendar } from "lucide-react";

interface TaskCardProps {
  task: EnrichedTask;
  onEdit: (task: EnrichedTask) => void;
  onDelete: (task: EnrichedTask) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { currentProfile } = useAuth();

  const canModify =
    currentProfile?.role === "org_admin" ||
    currentProfile?.role === "super_admin" ||
    (currentProfile?.role === "task_manager" && task.created_by === currentProfile.id);

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold pr-2">{task.title}</CardTitle>
          <Badge className={getStatusColor(task.status)}>{task.status.replace('_', ' ')}</Badge>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline" className={getPriorityColor(task.priority)}>
            {task.priority || 'No Priority'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
        
        <div className="mt-4 space-y-2 text-sm">
          {task.assigned_to_profile && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Assigned to: {task.assigned_to_profile.full_name}</span>
            </div>
          )}
          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      {canModify && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(task)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
