
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export const realtimeService = {
  // Subscribe to task updates for real-time status changes
  subscribeToTaskUpdates(
    organizationId: string,
    onTaskUpdate: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`tasks-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
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

  // Subscribe to messages for real-time chat
  subscribeToTaskMessages(
    taskId: string,
    onMessageReceived: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`messages-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
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

  // Subscribe to employee status updates
  subscribeToEmployeeUpdates(
    organizationId: string,
    onEmployeeUpdate: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`employees-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
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

  // Subscribe to task photos for real-time photo uploads
  subscribeToTaskPhotos(
    taskId: string,
    onPhotoUploaded: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`photos-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_photos',
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

  // Subscribe to task status history for audit trail
  subscribeToTaskStatusHistory(
    taskId: string,
    onStatusChange: (payload: any) => void
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`status-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_status_history',
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

  // Generic subscription for any table
  subscribeToTable(
    tableName: string,
    filter: string,
    onUpdate: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
  ): RealtimeSubscription {
    const channel = supabase
      .channel(`${tableName}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: tableName,
          filter
        },
        onUpdate
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};

export default realtimeService;
