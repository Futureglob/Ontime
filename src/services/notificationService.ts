
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
      data?: Record<string, any>;
      actions?: NotificationAction[];
      silent?: boolean;
      requireInteraction?: boolean;
    }

    export const notificationService = {
      isSupported(): boolean {
        if (typeof window === "undefined") return false;
        return "Notification" in window && "serviceWorker" in navigator;
      },

      async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
          return "denied";
        }
        return await Notification.requestPermission();
      },

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
          ...options,
        };

        try {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.showNotification) {
              await registration.showNotification(title, defaultOptions);
            } else {
              new Notification(title, defaultOptions);
            }
        } catch (error) {
            console.error("Error showing notification:", error);
        }
      },

      async showTaskAssignedNotification(taskTitle: string, assignedBy: string): Promise<void> {
        await this.showNotification("New Task Assigned", {
          body: `${assignedBy} assigned you: ${taskTitle}`,
          tag: "task-assigned",
           { type: "task_assigned", taskTitle },
        });
      },

      async showTaskStatusNotification(taskTitle: string, status: string, updatedBy: string): Promise<void> {
        await this.showNotification("Task Status Updated", {
          body: `${updatedBy} updated "${taskTitle}" to ${status.replace("_", " ")}`,
          tag: "task-status",
           { type: "task_status", taskTitle, status },
        });
      },

      async showMessageNotification(senderName: string, message: string, taskTitle: string): Promise<void> {
        await this.showNotification("New Message", {
          body: `${senderName}: ${message}`,
          tag: "new-message",
           { type: "message", senderName, taskTitle },
        });
      },

      async showOfflineSyncNotification(itemCount: number): Promise<void> {
        await this.showNotification("Data Synced", {
          body: `${itemCount} items synced successfully`,
          tag: "offline-sync",
           { type: "sync", itemCount },
        });
      },

      async showReminderNotification(taskTitle: string, deadline: string): Promise<void> {
        await this.showNotification("Task Reminder", {
          body: `"${taskTitle}" is due ${deadline}`,
          tag: "task-reminder",
          requireInteraction: true,
           { type: "reminder", taskTitle, deadline },
        });
      },

      setupNotificationHandlers(): void {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
            if (event.data && event.data.type === "notification-click") {
              this.handleNotificationClick(event.data.data);
            }
          });
        }
      },

      handleNotificationClick( Record<string, any>): void {
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

      async getUnreadNotifications(): Promise<any[]> {
        // Mock implementation
        return [];
      },

      async markAsRead(notificationId: string): Promise<void> {
        // Mock implementation
        console.log("Marking notification as read:", notificationId);
      },
    };

    export default notificationService;
  