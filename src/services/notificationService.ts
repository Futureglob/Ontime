export const notificationService = {
  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  },

  // Show local notification
  showNotification(title: string, options?: NotificationOptions) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  },

  // Register for push notifications
  async registerPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications not supported');
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      )
    });

    return subscription;
  },

  // Convert VAPID key
  urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // Task-specific notifications
  notifyTaskAssigned(taskTitle: string) {
    this.showNotification('New Task Assigned', {
      body: `You have been assigned: ${taskTitle}`,
      tag: 'task-assigned'
    });
  },

  notifyTaskUpdated(taskTitle: string, status: string) {
    this.showNotification('Task Updated', {
      body: `${taskTitle} status changed to ${status}`,
      tag: 'task-updated'
    });
  },

  notifyTaskDeadline(taskTitle: string, hoursLeft: number) {
    this.showNotification('Task Deadline Approaching', {
      body: `${taskTitle} is due in ${hoursLeft} hours`,
      tag: 'task-deadline'
    });
  }
};

export default notificationService;