
import { supabase } from "@/integrations/supabase/client";
import { Message, Task } from "@/types/database";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface MessageWithSender extends Message {
  sender?: {
    full_name: string;
    designation: string;
    avatar_url?: string;
  };
}

export const messageService = {
  async sendMessage(taskId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        task_id: taskId,
        sender_id: senderId,
        receiver_id: senderId,
        content,
        is_read: false,
      }])
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, designation)
      `)
      .single();

    if (error) throw error;
    return data as MessageWithSender;
  },

  async getTaskMessages(taskId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, designation)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as MessageWithSender[];
  },

  async markMessagesAsRead(taskId: string, userId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    if (error) throw error;
  },

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      // First get tasks where user is involved
      const { data: userTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

      if (tasksError) throw tasksError;

      if (!userTasks || userTasks.length === 0) {
        return 0;
      }

      const taskIds = userTasks.map(task => task.id);

      // Then count unread messages for those tasks
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", userId)
        .in("task_id", taskIds);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      return 0;
    }
  },

  async getTaskConversations(userId: string) {
    try {
      // First get tasks where user is involved
      const { data: userTasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          assigned_to,
          assigned_by,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, designation),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, designation)
        `)
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

      if (tasksError) throw tasksError;

      if (!userTasks || userTasks.length === 0) {
        return [];
      }

      const taskIds = userTasks.map(task => task.id);

      // Get latest message for each task
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("task_id, created_at")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Group by task_id and get latest message for each task
      const conversations = new Map();
      messages?.forEach(msg => {
        if (!conversations.has(msg.task_id)) {
          const task = userTasks.find(t => t.id === msg.task_id);
          if (task) {
            conversations.set(msg.task_id, {
              task_id: msg.task_id,
              tasks: task
            });
          }
        }
      });

      return Array.from(conversations.values());
    } catch (error) {
      console.error("Error loading conversations:", error);
      return [];
    }
  },

  subscribeToTaskMessages(taskId: string, callback: (payload: RealtimePostgresChangesPayload<Message>) => void) {
    return supabase
      .channel(`messages:task_id=eq.${taskId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `task_id=eq.${taskId}`
      }, callback)
      .subscribe();
  },

  subscribeToUserMessages(userId: string, callback: (payload: RealtimePostgresChangesPayload<Message>) => void) {
    return supabase
      .channel(`user-messages:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages"
      }, callback)
      .subscribe();
  },

  generateTaskUpdateMessage(task: Task): string {
    return `Task Update: ${task.title}
Status: ${task.status}
Location: ${task.location || "Not specified"}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}`;
  },

  generateWhatsAppLink(phoneNumber: string | undefined, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    if (phoneNumber) {
      return `https://wa.me/${phoneNumber.replace(/\D/g, "")}?text=${encodedMessage}`;
    }
    return `https://wa.me/?text=${encodedMessage}`;
  },

  async createMessage(message: {
    task_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          task_id: message.task_id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as MessageWithSender;
  },
};

export default messageService;
