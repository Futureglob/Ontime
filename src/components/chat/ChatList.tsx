import { useState, useEffect, useCallback } from "react";
import messageService from "@/services/messageService";
import realtimeService from "@/services/realtimeService";
import { useAuth } from "@/contexts/AuthContext";
import taskService from "@/services/taskService";
import type { EnrichedTask } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  onSelectChat: (taskId: string) => void;
}

export default function ChatList({ onSelectChat }: ChatListProps) {
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const { currentProfile } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (currentProfile) {
      try {
        const fetchedTasks = await taskService.getTasksForUser(currentProfile.id);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }
  }, [currentProfile]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (currentProfile) {
      const subscription = realtimeService.subscribeToTaskChanges(currentProfile.organization_id, (_payload) => {
        fetchTasks();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentProfile, fetchTasks]);

  if (!tasks.length) {
    return <div className="p-4 text-center text-gray-500">No active chats.</div>;
  }

  return (
    <div className="border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Chats</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onSelectChat(task.id)}
            className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
              selectedTaskId === task.id ? "bg-muted" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage />
                <AvatarFallback>{task.title.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow overflow-hidden">
                <h3 className="font-semibold truncate">{task.title}</h3>
                {task.lastMessage ? (
                  <p className="text-sm text-muted-foreground truncate">
                    <strong>{task.lastMessage.sender.full_name.split(" ")[0]}:</strong> {task.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No messages yet</p>
                )}
              </div>
              {task.lastMessage && (
                <div className="text-xs text-muted-foreground self-start">
                  {formatDistanceToNow(new Date(task.lastMessage.created_at), { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
