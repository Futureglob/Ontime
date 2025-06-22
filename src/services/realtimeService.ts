import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel, RealtimePostgresChangesPayload, RealtimePostgresChangesFilter } from "@supabase/supabase-js";
import type { Task, Message, Profile, TaskPhoto, TaskStatusHistory } from "@/types/database";

type TaskChangesPayload = RealtimePostgresChangesPayload<Task>;
type MessageChangesPayload = RealtimePostgresChangesPayload<Message>;
type ProfileChangesPayload = RealtimePostgresChangesPayload<Profile>;
type TaskPhotoChangesPayload = RealtimePostgresChangesPayload<TaskPhoto>;
type TaskStatusHistoryChangesPayload = RealtimePostgresChangesPayload<TaskStatusHistory>;
type GenericChangesPayload<T extends Record<string, unknown>> = RealtimePostgresChangesPayload<T>;

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
      .on(
        "postgres_changes" as const,
        {
          event: "*" as RealtimePostgresChangesFilter<"*">["event"],
          schema: "public",
          table: "tasks",
          filter: `organization_id=eq.${organizationId}`
        } as RealtimePostgresChangesFilter<"*">,
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
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT" as RealtimePostgresChangesFilter<"INSERT">["event"],
          schema: "public",
          table: "messages",
          filter: `task_id=eq.${taskId}`
        } as RealtimePostgresChangesFilter<"INSERT">,
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
      .on(
        "postgres_changes" as const,
        {
          event: "*" as RealtimePostgresChangesFilter<"*">["event"],
          schema: "public",
          table: "profiles",
          filter: `organization_id=eq.${organizationId}`
        } as RealtimePostgresChangesFilter<"*">,
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
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT" as RealtimePostgresChangesFilter<"INSERT">["event"],
          schema: "public",
          table: "task_photos",
          filter: `task_id=eq.${taskId}`
        } as RealtimePostgresChangesFilter<"INSERT">,
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
      .on(
        "postgres_changes" as const,
        {
          event: "INSERT" as RealtimePostgresChangesFilter<"INSERT">["event"],
          schema: "public",
          table: "task_status_history",
          filter: `task_id=eq.${taskId}`
        } as RealtimePostgresChangesFilter<"INSERT">,
        onStatusChange
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  },

  subscribeToTable<T extends Record<string, unknown>>(
    tableName: string,
    filterString: string,
    onUpdate: (payload: GenericChangesPayload<T>) => void,
    dbEvent: "*" | "INSERT" | "UPDATE" | "DELETE" = "*"
  ): RealtimeSubscription {
    const channelName = `${tableName.replace(/_/g, "-")}-changes-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as const,
        {
          event: dbEvent as RealtimePostgresChangesFilter<typeof dbEvent>["event"],
          schema: "public",
          table: tableName,
          filter: filterString
        } as RealtimePostgresChangesFilter<typeof dbEvent>,
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
