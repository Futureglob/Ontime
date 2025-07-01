import { useState, useEffect } from "react";
import messageService from "@/services/messageService";
import realtimeService from "@/services/realtimeService";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  onSelectTask: (taskId: string) => void;
}

interface TaskWithMessage {
  id: string;
  title: string;
  lastMessage: {
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  } | null;
}

export default function ChatList({ onSelectTask }: ChatListProps) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskWithMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!profile?.organization_id) return;
    try {
      setLoading(true);
      const fetchedTasks = await messageService.getTasksWithMessages(profile.organization_id);
      setTasks(fetchedTasks as any); // Cast needed due to complex return type
    } catch (error) {
      console.error("Error fetching tasks with messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [profile]);

  useEffect(() => {
    if (!profile?.organization_id) return;

    const subscription = realtimeService.subscribeToTaskUpdates(
      profile.organization_id,
      (payload) => {
        // Refetch when any task in the org is updated
        fetchTasks();
      }
    );

    // This is a simplified approach. A more robust solution would be to also
    // subscribe to all message updates and update the list accordingly.
    // For now, we rely on task updates to refresh the chat list.

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.organization_id]);

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    onSelectTask(taskId);
  };

  if (loading) {
    return <div>Loading chats...</div>;
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
            onClick={() => handleSelectTask(task.id)}
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
