import { pwaService } from "./pwaService";

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  silent?: boolean;
  requireInteraction?: boolean;
}

export const notificationService = {
  // Check if notifications are supported and permission granted
  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "Notification" in window && "serviceWorker" in navigator;
  },

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return "denied";
    }

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    const permission = await Notification.requestPermission();
    return permission;
  },

  // Show a notification
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: "/icons/icon-192x192.svg",
      badge: "/icons/icon-72x72.svg",
      tag: "ontime-notification",
      requireInteraction: false,
      ...options
    };

    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return;
      }
    }

    new Notification(title, defaultOptions);
  },

  // Show task assignment notification
  async showTaskAssignedNotification(taskTitle: string, assignedBy: string): Promise<void> {
    await this.showNotification("New Task Assigned", {
      body: `${assignedBy} assigned you: ${taskTitle}`,
      tag: "task-assigned",
      icon: "/icons/icon-192x192.svg",
      actions: [
        { action: "view", title: "View Task" },
        { action: "dismiss", title: "Dismiss" }
      ],
       { type: "task_assigned", taskTitle }
    });
  },

  // Show task status update notification
  async showTaskStatusNotification(taskTitle: string, status: string, updatedBy: string): Promise<void> {
    await this.showNotification("Task Status Updated", {
      body: `${updatedBy} updated "${taskTitle}" to ${status.replace("_", " ")}`,
      tag: "task-status",
      icon: "/icons/icon-192x192.svg",
       { type: "task_status", taskTitle, status }
    });
  },

  // Show message notification
  async showMessageNotification(senderName: string, message: string, taskTitle: string): Promise<void> {
    await this.showNotification("New Message", {
      body: `${senderName}: ${message}`,
      tag: "new-message",
      icon: "/icons/icon-192x192.svg",
      actions: [
        { action: "reply", title: "Reply" },
        { action: "view", title: "View Chat" }
      ],
       { type: "message", senderName, taskTitle }
    });
  },

  // Show offline sync notification
  async showOfflineSyncNotification(itemCount: number): Promise<void> {
    await this.showNotification("Data Synced", {
      body: `${itemCount} items synced successfully`,
      tag: "offline-sync",
      icon: "/icons/icon-192x192.svg",
       { type: "sync", itemCount }
    });
  },

  // Show reminder notification
  async showReminderNotification(taskTitle: string, deadline: string): Promise<void> {
    await this.showNotification("Task Reminder", {
      body: `"${taskTitle}" is due ${deadline}`,
      tag: "task-reminder",
      icon: "/icons/icon-192x192.svg",
      requireInteraction: true,
      actions: [
        { action: "view", title: "View Task" },
        { action: "snooze", title: "Remind Later" }
      ],
       { type: "reminder", taskTitle, deadline }
    });
  },

  // Schedule a notification (for reminders)
  async scheduleNotification(title: string, options: NotificationOptions, delay: number): Promise<void> {
    setTimeout(() => {
      this.showNotification(title, options);
    }, delay);
  },

  // Clear all notifications with a specific tag
  async clearNotifications(tag: string): Promise<void> {
    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  },

  // Setup notification click handlers
  setupNotificationHandlers(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
        if (event.data && event.data.type === "notification-click") {
          this.handleNotificationClick(event.data.data as Record<string, unknown>);
        }
      });
    }
  },

  // Handle notification clicks
  handleNotificationClick( Record<string, unknown>): void {
    if (typeof window === "undefined") return;
    switch (data?.type) {
      case "task_assigned":
      case "task_status":
      case "reminder":
        window.location.href = "/tasks";
        break;
      case "message":
        window.location.href = "/chat";
        break;
      default:
        window.focus();
    }
  },

  // Initialize notification service
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.warn("Notifications not supported in this browser");
      return;
    }

    await this.requestPermission();
    this.setupNotificationHandlers();
    
    if (await pwaService.isInstalled()) {
      await pwaService.registerBackgroundSync("ontime-sync");
    }
  },

  // Get unread notifications from a database (placeholder)
  async getUnreadNotifications(): Promise<unknown[]> {
    // Mock implementation - replace with actual Supabase query
    try {
      // For now, return empty array to prevent errors
      return [];
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    // Mock implementation
    console.log("Marking notification as read:", notificationId);
  }
};

export default notificationService;
