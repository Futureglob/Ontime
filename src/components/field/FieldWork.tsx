import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import taskService from "@/services/taskService";
import FieldTaskCard from "./FieldTaskCard";
import type { EnrichedTask, TaskStatus } from "@/types";

export default function FieldWork() {
  const { currentProfile } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const userTasks = await taskService.getTasksByAssignee(currentProfile!.user_id);
      setTasks(userTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    if (currentProfile?.user_id) {
      fetchTasks();
    }
  }, [currentProfile, fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskService.updateTask(taskId, { status: newStatus as TaskStatus });
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Field Work</h1>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tasks assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <FieldTaskCard
              key={task.id}
              task={task}
              onStatusChange={(status) => handleStatusChange(task.id, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
