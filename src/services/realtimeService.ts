import { supabase } from "@/integrations/supabase/client";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  RealtimePostgresChangesFilter, // Import this
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT // Import this
} from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type TaskRow = Tables["tasks"]["Row"];
type MessageRow = Tables["messages"]["Row"];
type ProfileRow = Tables["profiles"]["Row"];
type TaskPhotoRow = Tables["task_photos"]["Row"];
type TaskStatusHistoryRow = Tables["task_status_history"]["Row"];

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export const realtimeService = {
  subscribeToTaskUpdates(
    organizationId: string,
    onTaskUpdate: (payload: RealtimePostgresChangesPayload<TaskRow>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`tasks-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `organization_id=eq.${organizationId}`
        },
        onTaskUpdate
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToTaskMessages(
    taskId: string,
    onMessageReceived: (payload: RealtimePostgresChangesPayload<MessageRow>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`messages-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `task_id=eq.${taskId}`
        },
        onMessageReceived
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToEmployeeUpdates(
    organizationId: string,
    onEmployeeUpdate: (payload: RealtimePostgresChangesPayload<ProfileRow>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`employees-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `organization_id=eq.${organizationId}`
        },
        onEmployeeUpdate
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToTaskPhotos(
    taskId: string,
    onPhotoUploaded: (payload: RealtimePostgresChangesPayload<TaskPhotoRow>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`photos-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_photos",
          filter: `task_id=eq.${taskId}`
        },
        onPhotoUploaded
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToTaskStatusHistory(
    taskId: string,
    onStatusChange: (payload: RealtimePostgresChangesPayload<TaskStatusHistoryRow>) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`status-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "task_status_history",
          filter: `task_id=eq.${taskId}`
        },
        onStatusChange
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToTable<T extends Record<string, unknown>>( // eslint-disable-line @typescript-eslint/no-explicit-any
    tableName: string,
    filterString: string,
    onUpdate: (payload: RealtimePostgresChangesPayload<T>) => void,
    dbEvent: "*" | "INSERT" | "UPDATE" | "DELETE" = "*"
  ): RealtimeSubscription {
    const channelName = `${tableName.replace(/_/g, "-")}-changes-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: dbEvent,
          schema: "public",
          table: tableName,
          filter: filterString,
        },
        onUpdate
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  // Utility methods for managing subscriptions
  unsubscribeAll() {
    supabase.removeAllChannels();
  },

  getActiveChannels() {
    return supabase.getChannels();
  }
};

export default realtimeService;
