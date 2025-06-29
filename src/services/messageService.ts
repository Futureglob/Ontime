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
      // Simplified query to avoid complex JOINs
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (error) {
        console.error("Error fetching unread message count:", error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      return 0;
    }
  },

  async getTaskConversations(userId: string) {
    try {
      // 1. Get user's tasks with profiles
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          assigned_to,
          assigned_by,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, role),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, role)
        `)
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      const conversations = await Promise.all(
        tasks.map(async (task) => {
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("task_id", task.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount, error: countError } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("task_id", task.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          if (countError) {
            console.error(`Error getting unread count for task ${task.id}`, countError);
          }

          return {
            task_id: task.id,
            task: task,
            lastMessage: lastMessage || undefined,
            unreadCount: unreadCount || 0,
          };
        })
      );

      return conversations;
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
