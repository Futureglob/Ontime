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
      .select()
      .single();

    if (error) throw error;

    // Get sender info separately to avoid complex joins
    const { data: senderData } = await supabase
      .from("profiles")
      .select("full_name, designation")
      .eq("id", senderId)
      .single();

    return {
      ...data,
      sender: senderData
    } as MessageWithSender;
  },

  async getTaskMessages(taskId: string): Promise<MessageWithSender[]> {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) return [];

    // Get all unique sender IDs
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    
    // Get sender profiles separately
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, designation")
      .in("id", senderIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return messages.map(message => ({
      ...message,
      sender: profileMap.get(message.sender_id)
    })) as MessageWithSender[];
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
      // Simplified approach - get tasks first, then count messages
      const { data: userTasks } = await supabase
        .from("tasks")
        .select("id")
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

      if (!userTasks || userTasks.length === 0) return 0;

      const taskIds = userTasks.map(t => t.id);

      // Count unread messages for these tasks
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
      // Get user's tasks with simplified query
      const { data: userTasks } = await supabase
        .from("tasks")
        .select("*")
        .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`);

      if (!userTasks || userTasks.length === 0) return [];

      // Get profiles for all users involved
      const userIds = [...new Set([
        ...userTasks.map(t => t.assigned_to),
        ...userTasks.map(t => t.assigned_by)
      ].filter(Boolean))];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, designation")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Process each task to get conversation data
      const conversations = await Promise.all(
        userTasks.map(async (task) => {
          // Get last message for this task
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, created_at, sender_id")
            .eq("task_id", task.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count for this task
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("task_id", task.id)
            .eq("is_read", false)
            .neq("sender_id", userId);

          // Enrich task with profile data
          const enrichedTask = {
            ...task,
            assigned_to_profile: task.assigned_to ? profileMap.get(task.assigned_to) : null,
            assigned_by_profile: task.assigned_by ? profileMap.get(task.assigned_by) : null
          };

          return {
            task_id: task.id,
            task: enrichedTask,
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
