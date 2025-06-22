import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/database";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export interface MessageWithSender extends Message {
  sender?: {
    full_name: string;
    role: string;
    avatar_url?: string;
  };
}

export const messageService = {
  async sendMessage(taskId: string, senderId: string, content: string, attachmentUrl?: string, attachmentType?: string) {
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        task_id: taskId,
        sender_id: senderId,
        content,
        is_read: false,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      }])
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role, avatar_url)
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
        sender:profiles!messages_sender_id_fkey(full_name, role, avatar_url)
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
    const { data, error } = await supabase
      .from("messages")
      .select("id", { count: "exact" })
      .neq("sender_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return data?.length || 0;
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
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, role, avatar_url),
          assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, role, avatar_url)
        )
      `)
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

  // WhatsApp Integration
  generateWhatsAppLink(phoneNumber: string, message: string): string {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },

  generateTaskUpdateMessage(task: any): string {
    return `🔔 Task Update - OnTime App

📋 Task: ${task.title}
📍 Status: ${task.status?.replace("_", " ").toUpperCase()}
📍 Location: ${task.location || "Not specified"}
⏰ Deadline: ${task.deadline ? new Date(task.deadline).toLocaleDateString() : "Not set"}

View full details in the OnTime mobile app.`;
  }
};

export default messageService;
