
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_LISTEN_TYPES } from "@supabase/supabase-js";
import type { Task, Message, Profile, TaskPhoto, TaskStatusHistory } from "@/types/database";

// Define specific payload types, using 'any' for the record type if specific fields are not critical for the callback signature.
// Alternatively, define more precise types if needed.
type TaskChangesPayload = RealtimePostgresChangesPayload<Task>;
type MessageChangesPayload = RealtimePostgresChangesPayload<Message>;
type ProfileChangesPayload = RealtimePostgresChangesPayload<Profile>;
type TaskPhotoChangesPayload = RealtimePostgresChangesPayload<TaskPhoto>;
type TaskStatusHistoryChangesPayload = RealtimePostgresChangesPayload<TaskStatusHistory>;
type GenericChangesPayload<T extends { [key: string]: any }> = RealtimePostgresChangesPayload<T>;


export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export const realtimeService = {
  subscribeToTaskUpdates(
    organizationId: string,
    onTaskUpdate: (payload: TaskChangesPayload) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`tasks-${organizationId}`)
      .on<Task>( // Specify the table type for better type safety in payload
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
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
    onMessageReceived: (payload: MessageChangesPayload) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`messages-${taskId}`)
      .on<Message>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
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
    onEmployeeUpdate: (payload: ProfileChangesPayload) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`employees-${organizationId}`)
      .on<Profile>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
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
    onPhotoUploaded: (payload: TaskPhotoChangesPayload) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`photos-${taskId}`)
      .on<TaskPhoto>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
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
    onStatusChange: (payload: TaskStatusHistoryChangesPayload) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`status-${taskId}`)
      .on<TaskStatusHistory>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
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

  subscribeToTable<T extends { [key: string]: any }>(
    tableName: string,
    filterString: string,
    onUpdate: (payload: GenericChangesPayload<T>) => void,
    dbEvent: "*" | "INSERT" | "UPDATE" | "DELETE" = "*"
  ): RealtimeSubscription {
    const channelName = `${tableName.replace(/_/g, "-")}-changes-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on<T>( // Specify the generic type T
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: dbEvent,
          schema: "public",
          table: tableName,
          filter: filterString
        },
        onUpdate
      )
      .subscribe((status, err) => {
        if (err) {
          console.error(`Error subscribing to ${channelName}:`, err);
        }
      });

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};

export default realtimeService;
