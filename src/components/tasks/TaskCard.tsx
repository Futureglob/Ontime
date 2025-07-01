import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EnrichedTask } from "@/types/database";
import { format } from "date-fns";

interface TaskCardProps {
  task: EnrichedTask;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "overdue": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const isOverdue = !task.completed_at && task.due_date && new Date(task.due_date) < new Date();

  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-tight pr-4">{task.title}</CardTitle>
          <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
            {task.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{task.client?.name}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
        <div className="flex justify-between items-center text-sm">
          <div>
            <p className="font-semibold">Due Date</p>
            <p className={isOverdue ? "text-destructive font-bold" : ""}>
              {task.due_date ? format(new Date(task.due_date), "PPP") : "Not set"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Assigned To</p>
            <div className="flex items-center justify-end gap-2">
              <span>{task.assigned_to_profile?.full_name || "Unassigned"}</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assigned_to_profile?.avatar_url || ""} />
                <AvatarFallback>{task.assigned_to_profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(task.status || 'pending')} text-white`}>{task.status}</Badge>
          <p className="text-xs text-muted-foreground">
            Created by: {task.created_by_profile?.full_name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
