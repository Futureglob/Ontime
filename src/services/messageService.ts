import { supabase } from "@/integrations/supabase/client";
import {
  Message,
  MessageWithSender,
  ChatConversation,
  EnrichedTask,
} from "@/types";

export const messageService = {
  async getTaskMessages(taskId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(
          full_name,
          avatar_url,
          designation
        )
      `
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
    return data as unknown as MessageWithSender[];
  },

  async getConversations(userId: string): Promise<ChatConversation[]> {
    const {  tasks, error: tasksError } = await supabase
      .from("tasks")
      .select(
        `
        *,
        client:clients!tasks_client_id_fkey(*),
        assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
        created_by_profile:profiles!tasks_created_by_fkey(*)
      `
      )
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (tasksError) {
      console.error("Error fetching tasks for conversations:", tasksError);
      throw tasksError;
    }

    if (!tasks || tasks.length === 0) {
      return [];
    }

    const conversations: ChatConversation[] = await Promise.all(
      tasks.map(async (task) => {
        const enrichedTask = task as EnrichedTask;

        const {  lastMessage, error: lastMessageError } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
          `
          )
          .eq("task_id", task.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count, error: countError } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("task_id", task.id)
          .eq("is_read", false)
          .not("sender_id", "eq", userId);

        if (lastMessageError && lastMessageError.code !== 'PGRST116') { // Ignore 'single row not found'
          console.error(`Error fetching last message for task ${task.id}:`, lastMessageError);
        }
        if (countError) {
           console.error(`Error fetching unread count for task ${task.id}:`, countError);
        }

        return {
          task_id: enrichedTask.id,
          task: enrichedTask,
          lastMessage:
            (lastMessage as unknown as MessageWithSender) ||
            ({
              id: "",
              task_id: enrichedTask.id,
              sender_id: "",
              content: "No messages yet",
              created_at: enrichedTask.created_at,
              is_read: true,
              message_type: "text",
              sender: { full_name: "System", avatar_url: "" },
            } as MessageWithSender),
          unreadCount: count || 0,
        };
      })
    );

    return conversations.filter(c => c.lastMessage.id || c.lastMessage.content === "No messages yet");
  },

  async sendMessage(
    taskId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: string = "text"
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        task_id: taskId,
        sender_id: senderId,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    await supabase
      .from("tasks")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", taskId);

    return data;
  },

  async markMessagesAsRead(taskId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .not("sender_id", "eq", userId);

    if (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  },
};
