import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EnrichedTask } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

interface TaskCardProps {
  task: EnrichedTask;
  onEdit: (task: EnrichedTask) => void;
  onDelete: (task: EnrichedTask) => void;
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { currentProfile } = useAuth();

  if (!currentProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{task.title}</CardTitle>
            <CardDescription>Client: {task.clients?.name || "N/A"}</CardDescription>
          </div>
          <Badge variant={task.status === "completed" ? "default" : "secondary"}>
            {task.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{task.description}</p>
        <div className="mt-4">
          <p className="text-sm font-medium">Assigned to: {task.profiles?.full_name || "Unassigned"}</p>
          <p className="text-sm text-muted-foreground">Due: {new Date(task.due_date).toLocaleDateString()}</p>
        </div>
      </CardContent>
      {currentProfile.role === "admin" && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(task)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(task)}>Delete</Button>
        </CardFooter>
      )}
    </Card>
  );
}
