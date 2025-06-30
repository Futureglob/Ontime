
import { taskService, TaskUpdate } from "@/services/taskService";
import { photoService } from "@/services/photoService";
import { notificationService } from "@/services/notificationService";

interface TaskUpdatePayload {
  taskId: string;
  status: string;
  notes?: string;
  assignedTo?: string;
}

interface PhotoUploadMetadata {
  type: "check_in" | "progress" | "completion";
  location?: { lat: number; lng: number };
  timestamp: string;
  notes?: string;
  accuracy?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
  };
}

interface PhotoUploadPayload {
  taskId: string;
  fileData: string | ArrayBuffer | null;
  fileName: string;
  fileType: string;
  meta: PhotoUploadMetadata;
}

interface OfflineTaskAction {
  id: string;
  action: "update_status" | "upload_photo" | "create_task";
  payload: TaskUpdatePayload | PhotoUploadPayload | Record<string, unknown>;
  timestamp: number;
}

interface CachedPhoto {
  taskId: string;
  fileData: string | ArrayBuffer | null;
  fileName: string;
  fileType: string;
  meta: PhotoUploadMetadata;
  timestamp: number;
}

interface QueuedItem {
    id: string;
    [key: string]: any;
}

export const offlineService = {
  storeOfflineAction(action: OfflineTaskAction) {
    const offlineActions = this.getOfflineActions();
    offlineActions.push(action);
    localStorage.setItem("ontime_offline_actions", JSON.stringify(offlineActions));
    
    notificationService.showNotification("Action Queued", {
      body: "Your action will sync when you're back online",
      tag: "offline-queue"
    });
  },

  getOfflineActions(): OfflineTaskAction[] {
    const stored = localStorage.getItem("ontime_offline_actions");
    return stored ? JSON.parse(stored) : [];
  },

  clearOfflineActions() {
    localStorage.removeItem("ontime_offline_actions");
  },

  cacheTaskData(tasks: Record<string, unknown>[]) {
    localStorage.setItem("ontime_cached_tasks", JSON.stringify({
      tasks,
      timestamp: Date.now()
    }));
  },

  getCachedTaskData(): Record<string, unknown>[] | null {
    const cached = localStorage.getItem("ontime_cached_tasks");
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    
    return isExpired ? null : parsed.tasks;
  },

  cachePhotoForUpload(taskId: string, file: File, meta: PhotoUploadMetadata) {
    const reader = new FileReader();
    reader.onload = () => {
      const photoData: CachedPhoto = {
        taskId,
        fileData: reader.result,
        fileName: file.name,
        fileType: file.type,
        meta: meta,
        timestamp: Date.now()
      };
      
      const cachedPhotos = this.getCachedPhotos();
      cachedPhotos.push(photoData);
      localStorage.setItem("ontime_cached_photos", JSON.stringify(cachedPhotos));
      
      notificationService.showNotification("Photo Cached", {
        body: "Photo will upload when you're back online",
        tag: "offline-photo-cache"
      });
    };
    reader.readAsDataURL(file);
  },

  getCachedPhotos(): CachedPhoto[] {
    const cached = localStorage.getItem("ontime_cached_photos");
    return cached ? JSON.parse(cached) : [];
  },

  clearCachedPhotos() {
    localStorage.removeItem("ontime_cached_photos");
  },

  async syncOfflineData() {
    const offlineActions = this.getOfflineActions();
    const cachedPhotos = this.getCachedPhotos();
    
    if (offlineActions.length === 0 && cachedPhotos.length === 0) {
      return;
    }

    let syncedActions = 0;
    let syncedPhotos = 0;
    const failedActions: OfflineTaskAction[] = [];
    const failedPhotos: CachedPhoto[] = [];

    for (const action of offlineActions) {
      try {
        await this.processOfflineAction(action);
        syncedActions++;
      } catch (error) {
        console.error("Failed to sync offline action:", error);
        failedActions.push(action);
      }
    }
    
    for (const photo of cachedPhotos) {
      try {
        await this.uploadCachedPhoto(photo);
        syncedPhotos++;
      } catch (error) {
        console.error("Failed to upload cached photo:", error);
        failedPhotos.push(photo);
      }
    }
    
    const taskUpdates = await this.getQueuedData("taskUpdates");
    for (const update of taskUpdates) {
      try {
        const typedUpdate = update as { id: string;  TaskUpdate };
        await taskService.updateTask(typedUpdate.id, typedUpdate.data);
        await this.removeFromQueue("taskUpdates", typedUpdate.id);
      } catch (error) {
        console.error("Failed to sync task update:", error);
      }
    }
    
    if (failedActions.length === 0) {
      this.clearOfflineActions();
    } else {
      localStorage.setItem("ontime_offline_actions", JSON.stringify(failedActions));
    }

    if (failedPhotos.length === 0) {
      this.clearCachedPhotos();
    } else {
      localStorage.setItem("ontime_cached_photos", JSON.stringify(failedPhotos));
    }

    if (syncedActions > 0 || syncedPhotos > 0) {
      notificationService.showNotification("Sync Complete", {
        body: `Synced ${syncedActions} actions and ${syncedPhotos} photos`,
        tag: "sync-complete"
      });
    }

    if (failedActions.length > 0 || failedPhotos.length > 0) {
      notificationService.showNotification("Partial Sync", {
        body: `${failedActions.length + failedPhotos.length} items failed to sync`,
        tag: "sync-partial"
      });
    }
  },

  async processOfflineAction(action: OfflineTaskAction) {
    switch (action.action) {
      case "update_status":
        const updatePayload = action.payload as TaskUpdatePayload;
        await taskService.updateTask(
          updatePayload.taskId,
          { status: updatePayload.status, notes: updatePayload.notes }
        );
        break;

      case "upload_photo":
        const photoPayload = action.payload as PhotoUploadPayload;
        if (photoPayload.fileData && typeof photoPayload.fileData === "string") {
          const response = await fetch(photoPayload.fileData);
          const blob = await response.blob();
          const file = new File([blob], photoPayload.fileName, { type: photoPayload.fileType });
          
          await photoService.uploadTaskPhoto(
            photoPayload.taskId,
            file,
            {
              type: photoPayload.meta.type,
              location: photoPayload.meta.location,
              timestamp: photoPayload.meta.timestamp,
              notes: photoPayload.meta.notes
            }
          );
        }
        break;

      case "create_task":
        console.log("Task creation sync not implemented yet");
        break;

      default:
        console.warn("Unknown offline action type:", action.action);
    }
  },

  async uploadCachedPhoto(photoData: CachedPhoto) {
    if (photoData.fileData && typeof photoData.fileData === "string") {
      const response = await fetch(photoData.fileData);
      const blob = await response.blob();
      const file = new File([blob], photoData.fileName, { type: photoData.fileType });
      
      await photoService.uploadTaskPhoto(
        photoData.taskId,
        file,
        {
          type: photoData.meta.type,
          location: photoData.meta.location,
          timestamp: photoData.meta.timestamp,
          notes: photoData.meta.notes
        }
      );
    }
  },

  getSyncStatus() {
    const offlineActions = this.getOfflineActions();
    const cachedPhotos = this.getCachedPhotos();
    
    return {
      pendingActions: offlineActions.length,
      pendingPhotos: cachedPhotos.length,
      hasPendingSync: offlineActions.length > 0 || cachedPhotos.length > 0
    };
  },

  async forceSyncNow() {
    if (navigator.onLine) {
      await this.syncOfflineData();
      return true;
    } else {
      notificationService.showNotification("Sync Failed", {
        body: "Cannot sync while offline",
        tag: "sync-failed"
      });
      return false;
    }
  },

  async getQueuedData(queueName: string): Promise<QueuedItem[]> {
    const stored = localStorage.getItem(`ontime_${queueName}`);
    return stored ? JSON.parse(stored) : [];
  },

  async addToQueue(queueName: string,  Record<string, unknown>) {
    const existing = await this.getQueuedData(queueName);
    existing.push(data as QueuedItem);
    localStorage.setItem(`ontime_${queueName}`, JSON.stringify(existing));
  },

  async removeFromQueue(queueName: string, id: string): Promise<boolean> {
    const existing = await this.getQueuedData(queueName);
    const filtered = existing.filter(item => item.id !== id);
    if (filtered.length === existing.length) return false;
    
    localStorage.setItem(`ontime_${queueName}`, JSON.stringify(filtered));
    return true;
  }
};

export default offlineService;
