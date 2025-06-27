import { supabase } from "@/integrations/supabase/client";
import { Message, Task } from "@/types/database"; // Added Task import
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
        receiver_id: senderId, // Assuming sender is also a receiver for now, adjust as needed
        content,
        is_read: false,
      }])
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role) 
      `) // Removed avatar_url from here if it's causing issues
      .single();

    if (error) throw error;
    return data as MessageWithSender;
  },

  async getTaskMessages(taskId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role)
      `) // Removed avatar_url from here if it's causing issues
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

  // Get unread message count for a user
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .not("sender_id", "eq", userId) // Count messages not sent by the user
        .or(`task_id.in.(SELECT id FROM tasks WHERE assigned_to = '${userId}' OR assigned_by = '${userId}')`); // User is part of the task

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      throw error;
    }
  },

  async getTaskConversations(userId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        task_id,
        tasks!inner(
          id,
          title,
          status,
          assigned_to,
          assigned_by,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, role), 
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, role)
        )
      `) // Removed avatar_url from profile selects
      .or(`sender_id.eq.${userId},tasks.assigned_to.eq.${userId},tasks.assigned_by.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Group by task_id and get latest message for each task
    const conversations = new Map();
    data?.forEach(msg => {
      if (!conversations.has(msg.task_id)) {
        conversations.set(msg.task_id, msg);
      }
    });

    return Array.from(conversations.values());
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

  // Generate a generic task update message
  generateTaskUpdateMessage(task: Task): string {
    return `Task Update: ${task.title}
Status: ${task.status}
Location: ${task.location || "Not specified"}
Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "N/A"}`;
  },

  // Generate WhatsApp share link
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
