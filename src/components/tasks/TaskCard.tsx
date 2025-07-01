import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EnrichedTask } from "@/types";

interface TaskCardProps {
  task: EnrichedTask;
}

export default function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <Badge className={getStatusColor(task.status)}>
            {task.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
        {task.client && (
          <p className="text-sm text-gray-500">Client: {task.client.name}</p>
        )}
        {task.assigned_to_profile && (
          <p className="text-sm text-gray-500">
            Assigned to: {task.assigned_to_profile.full_name}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Created: {new Date(task.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
