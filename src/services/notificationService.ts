
import { pwaService } from "./pwaService";
import type { Notification as NotificationType } from "@/types";

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

    // Try to use service worker for better notification handling
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return;
      }
    }

    // Fallback to regular notification
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
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  },

  // Setup notification click handlers
  setupNotificationHandlers(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => { // Added MessageEvent type
        if (event.data && event.data.type === "notification-click") {
          this.handleNotificationClick(event.data as Record<string, unknown>); // Cast data to Record<string, unknown>
        }
      });
    }
  },

  // Handle notification clicks
  handleNotificationClick( Record<string, unknown>): void {
    switch (data.notificationType) {
      case "task_assigned":
      case "task_status":
        // Navigate to tasks page
        window.location.href = "/tasks";
        break;
      case "message":
        // Navigate to chat
        window.location.href = "/tasks"; // Could be enhanced to open specific chat
        break;
      case "reminder":
        // Navigate to specific task
        window.location.href = "/tasks";
        break;
      default:
        // Default action
        window.focus();
    }
  },

  // Initialize notification service
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.warn("Notifications not supported in this browser");
      return;
    }

    // Request permission on initialization
    await this.requestPermission();
    
    // Setup handlers
    this.setupNotificationHandlers();
    
    // Register with PWA service for background notifications
    if (pwaService.isInstalled()) { // Corrected: pwaService.isInstalled() exists
      await pwaService.registerBackgroundSync("ontime-sync"); // Corrected: pwaService.registerBackgroundSync() exists and expects a tag
    }
  },

  // Add missing method for getting unread notifications
  async getUnreadNotifications(userId: string): Promise<NotificationType[]> {
    // For now, return empty array - this would need to be implemented with a notifications table
    // TODO: Implement proper notification storage in Supabase
    console.log("Fetching notifications for user:", userId);
    return [];
  }
};

export default notificationService;
