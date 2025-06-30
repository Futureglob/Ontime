import { Task, PhotoType, TaskStatus } from "@/types/database";
import { taskService } from "@/services/taskService";
import { photoService } from "@/services/photoService";
import { notificationService } from "@/services/notificationService";

// Define specific payload types for offline actions
interface TaskUpdatePayload {
  taskId: string;
  status: string;
  notes?: string;
  assignedTo?: string;
}

interface PhotoUploadMetadata {
  type: PhotoType;
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
  action: 'update_status' | 'upload_photo' | 'create_task';
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

export const offlineService = {
  // Store offline actions in localStorage
  storeOfflineAction(action: OfflineTaskAction) {
    const offlineActions = this.getOfflineActions();
    offlineActions.push(action);
    localStorage.setItem('ontime_offline_actions', JSON.stringify(offlineActions));
    
    // Show notification about queued action
    notificationService.showNotification('Action Queued', {
      body: 'Your action will sync when you\'re back online',
      tag: 'offline-queue'
    });
  },

  getOfflineActions(): OfflineTaskAction[] {
    const stored = localStorage.getItem('ontime_offline_actions');
    return stored ? JSON.parse(stored) : [];
  },

  clearOfflineActions() {
    localStorage.removeItem('ontime_offline_actions');
  },

  // Cache task data for offline access
  cacheTaskData(tasks: any[]) {
    localStorage.setItem('ontime_cached_tasks', JSON.stringify({
      tasks,
      timestamp: Date.now()
    }));
  },

  getCachedTaskData(): any[] | null {
    const cached = localStorage.getItem('ontime_cached_tasks');
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours
    
    return isExpired ? null : parsed.tasks;
  },

  // Cache photos for offline upload
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
      localStorage.setItem('ontime_cached_photos', JSON.stringify(cachedPhotos));
      
      // Show notification about cached photo
      notificationService.showNotification('Photo Cached', {
        body: 'Photo will upload when you\'re back online',
        tag: 'offline-photo-cache'
      });
    };
    reader.readAsDataURL(file);
  },

  getCachedPhotos(): CachedPhoto[] {
    const cached = localStorage.getItem('ontime_cached_photos');
    return cached ? JSON.parse(cached) : [];
  },

  clearCachedPhotos() {
    localStorage.removeItem('ontime_cached_photos');
  },

  // Sync offline data when back online
  async syncOfflineData() {
    const offlineActions = this.getOfflineActions();
    const cachedPhotos = this.getCachedPhotos();
    
    if (offlineActions.length === 0 && cachedPhotos.length === 0) {
      return; // Nothing to sync
    }

    let syncedActions = 0;
    let syncedPhotos = 0;
    const failedActions: OfflineTaskAction[] = [];
    const failedPhotos: CachedPhoto[] = [];

    // Process offline actions
    for (const action of offlineActions) {
      try {
        await this.processOfflineAction(action);
        syncedActions++;
      } catch (error) {
        console.error('Failed to sync offline action:', error);
        failedActions.push(action);
      }
    }
    
    // Upload cached photos
    for (const photo of cachedPhotos) {
      try {
        await this.uploadCachedPhoto(photo);
        syncedPhotos++;
      } catch (error) {
        console.error('Failed to upload cached photo:', error);
        failedPhotos.push(photo);
      }
    }
    
    // Clear successfully synced data
    if (failedActions.length === 0) {
      this.clearOfflineActions();
    } else {
      // Keep only failed actions
      localStorage.setItem('ontime_offline_actions', JSON.stringify(failedActions));
    }

    if (failedPhotos.length === 0) {
      this.clearCachedPhotos();
    } else {
      // Keep only failed photos
      localStorage.setItem('ontime_cached_photos', JSON.stringify(failedPhotos));
    }

    // Show sync results notification
    if (syncedActions > 0 || syncedPhotos > 0) {
      notificationService.showNotification('Sync Complete', {
        body: `Synced ${syncedActions} actions and ${syncedPhotos} photos`,
        tag: 'sync-complete'
      });
    }

    if (failedActions.length > 0 || failedPhotos.length > 0) {
      notificationService.showNotification('Partial Sync', {
        body: `${failedActions.length + failedPhotos.length} items failed to sync`,
        tag: 'sync-partial'
      });
    }
  },

  async processOfflineAction(action: OfflineTaskAction) {
    switch (action.action) {
      case 'update_status':
        const updatePayload = action.payload as TaskUpdatePayload;
        await taskService.updateTaskStatus(
          updatePayload.taskId,
          updatePayload.status
        );
        break;

      case 'upload_photo':
        const photoPayload = action.payload as PhotoUploadPayload;
        if (photoPayload.fileData && typeof photoPayload.fileData === 'string') {
          // Convert base64 back to file
          const response = await fetch(photoPayload.fileData);
          const blob = await response.blob();
          const file = new File([blob], photoPayload.fileName, { type: photoPayload.fileType });
          
          await photoService.uploadTaskPhoto(
            photoPayload.taskId,
            file,
            photoPayload.meta
          );
        }
        break;

      case 'create_task':
        // Implementation for task creation if needed
        console.log('Task creation sync not implemented yet');
        break;

      default:
        console.warn('Unknown offline action type:', action.action);
    }
  },

  async uploadCachedPhoto(photoData: CachedPhoto) {
    if (photoData.fileData && typeof photoData.fileData === 'string') {
      // Convert base64 back to file
      const response = await fetch(photoData.fileData);
      const blob = await response.blob();
      const file = new File([blob], photoData.fileName, { type: photoData.fileType });
      
      await photoService.uploadTaskPhoto(
        photoData.taskId,
        file,
        photoData.meta
      );
    }
  },

  // Get sync status for UI
  getSyncStatus() {
    const offlineActions = this.getOfflineActions();
    const cachedPhotos = this.getCachedPhotos();
    
    return {
      pendingActions: offlineActions.length,
      pendingPhotos: cachedPhotos.length,
      hasPendingSync: offlineActions.length > 0 || cachedPhotos.length > 0
    };
  },

  // Manual sync trigger
  async forceSyncNow() {
    if (navigator.onLine) {
      await this.syncOfflineData();
      return true;
    } else {
      notificationService.showNotification('Sync Failed', {
        body: 'Cannot sync while offline',
        tag: 'sync-failed'
      });
      return false;
    }
  }
};

export default offlineService;
