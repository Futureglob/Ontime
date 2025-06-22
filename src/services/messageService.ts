import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/database";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export const messageService = {
  async sendMessage(taskId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from("messages")
      .insert([{
        task_id: taskId,
        sender_id: senderId,
        content,
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  },

  async getTaskMessages(taskId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async markMessagesAsRead(taskId: string, userId: string) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("task_id", taskId)
      .neq("sender_id", userId);

    if (error) throw error;
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
  }
};
