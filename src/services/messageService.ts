import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";

export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    full_name: string;
    designation: string;
    avatar_url?: string | null;
  };
  created_at: string;
  is_read: boolean;
  message_type: string;
}

const messageService = {
  async getTaskMessages(taskId: string): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        created_at,
        is_read,
        message_type,
        sender:profiles!messages_sender_id_fkey(
          full_name,
          designation,
          avatar_url
        )
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return messages?.map(msg => {
      const senderProfile = msg.sender as Profile | null;
      return {
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read,
        message_type: msg.message_type,
        sender: {
          full_name: senderProfile?.full_name || "Unknown",
          designation: senderProfile?.designation || "",
          avatar_url: senderProfile?.avatar_url
        }
      }
    }) || [];
  },

  async getTasksWithMessages(organizationId: string) {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`*, created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url)`)
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const tasksWithLastMessage = await Promise.all(
      (tasks || []).map(async (task) => {
        const { data: lastMessage, error: messageError } = await supabase
          .from("messages")
          .select(`*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)`)
          .eq("task_id", task.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (messageError && messageError.code !== 'PGRST116') {
          console.error(`Error fetching last message for task ${task.id}:`, messageError);
        }

        return {
          ...task,
          lastMessage: lastMessage ? {
            ...lastMessage,
            sender: {
              full_name: (lastMessage.sender as Profile)?.full_name || "Unknown",
              avatar_url: (lastMessage.sender as Profile)?.avatar_url
            }
          } : null
        };
      })
    );

    return tasksWithLastMessage;
  },

  async sendMessage(taskId: string, senderId: string, content: string, messageType: string = "text") {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        task_id: taskId,
        sender_id: senderId,
        content,
        message_type: messageType,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);

    if (error) throw error;
    return true;
  },

  async markAllTaskMessagesAsRead(taskId: string, userId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .neq("sender_id", userId);

    if (error) throw error;
    return true;
  },

  async getUnreadMessageCount(userId: string) {
    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .neq("sender_id", userId);

    if (error) throw error;
    return count || 0;
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
    return true;
  }
};

export default messageService;
