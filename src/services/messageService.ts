import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Profile } from "@/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];

export interface MessageWithSender extends Message {
  sender?: {
    full_name: string;
    designation: string;
    avatar_url?: string;
  };
}

export interface ChatListItem {
  task: Task;
  lastMessage: Message | null;
  unreadCount: number;
  participants: Profile[];
}

export const messageService = {
  async sendMessage(
    taskId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert([{ task_id: taskId, sender_id: senderId, receiver_id: receiverId, content }])
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }
    return data;
  },

  async getTaskMessages(taskId: string): Promise<MessageWithSender[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(*)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching task messages:", error);
      throw error;
    }
    return data || [];
  },

  async getChatList(userId: string): Promise<ChatListItem[]> {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        messages(count),
        participants:profiles!tasks_assignee_id_fkey(id, full_name)
      `
      )
      .or(`created_by.eq.${userId},assignee_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching chat list:", error);
      throw error;
    }

    return (data || []).map((task: Record<string, any>) => ({
      task,
      lastMessage: null,
      unreadCount: task.messages[0]?.count || 0,
      participants: [task.participants].filter(Boolean),
    }));
  },

  subscribeToTaskMessages(
    taskId: string,
    onMessage: (payload: Record<string, any>) => void
  ) {
    return supabase
      .channel(`messages:task=${taskId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `task_id=eq.${taskId}` },
        onMessage
      )
      .subscribe();
  },

  async markMessagesAsRead(taskId: string, userId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const { data: userTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .or(`assignee_id.eq.${userId},created_by.eq.${userId}`);

      if (tasksError) throw tasksError;
      if (!userTasks || userTasks.length === 0) return 0;

      const taskIds = userTasks.map(t => t.id);

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("task_id", taskIds)
        .eq("is_read", false)
        .neq("sender_id", userId);

      return count || 0;
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      return 0;
    }
  },

  async getTaskConversations(userId: string) {
    try {
      const { data: userTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!tasks_assignee_id_fkey(*), created_by_profile:profiles!tasks_created_by_fkey(*)")
        .or(`assignee_id.eq.${userId},created_by.eq.${userId}`);

      if (tasksError) throw tasksError;
      if (!userTasks || userTasks.length === 0) return [];

      const conversations = await Promise.all(
        userTasks.map(async (task) => {
          const { data: lastMessage, error: messageError } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("task_id", task.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if(messageError) console.error("Error fetching last message:", messageError);

          const { count: unreadCount, error: countError } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("task_id", task.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          if(countError) console.error("Error fetching unread count:", countError);

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
Due Date: ${task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}`;
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
