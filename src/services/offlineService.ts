import { Task, PhotoType } from "@/types/database"; // Assuming Task is the correct type

// Define specific payload types for offline actions
interface TaskUpdatePayload {
  taskId: string;
  status: string; // Should be TaskStatus ideally
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
  fileData: string | ArrayBuffer | null; // From FileReader result
  fileName: string;
  fileType: string;
  meta: PhotoUploadMetadata; // Changed space to colon
}

// We might need a TaskCreatePayload if that action is implemented
// interface TaskCreatePayload { ... }

interface OfflineTaskAction {
  id: string;
  action: 'update_status' | 'upload_photo' | 'create_task'; // Add other actions as needed
   TaskUpdatePayload | PhotoUploadPayload | Record<string, unknown>; // Added '' property name
  timestamp: number;
}

interface CachedPhoto {
  taskId: string;
  fileData: string | ArrayBuffer | null;
  fileName: string;
  fileType: string;
  meta: PhotoUploadMetadata; // Changed space to colon
  timestamp: number;
}

export const offlineService = {
  // Store offline actions in localStorage
  storeOfflineAction(action: OfflineTaskAction) {
    const offlineActions = this.getOfflineActions();
    offlineActions.push(action);
    localStorage.setItem('ontime_offline_actions', JSON.stringify(offlineActions));
  },

  getOfflineActions(): OfflineTaskAction[] {
    const stored = localStorage.getItem('ontime_offline_actions');
    return stored ? JSON.parse(stored) : [];
  },

  clearOfflineActions() {
    localStorage.removeItem('ontime_offline_actions');
  },

  // Cache task data for offline access
  cacheTaskData(tasks: Task[]) { // Changed any[] to Task[]
    localStorage.setItem('ontime_cached_tasks', JSON.stringify({
       tasks,
      timestamp: Date.now()
    }));
  },

  getCachedTaskData(): Task[] | null { // Added return type
    const cached = localStorage.getItem('ontime_cached_tasks');
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours
    
    return isExpired ? null : parsed.data as Task[];
  },

  // Cache photos for offline upload
  cachePhotoForUpload(taskId: string, file: File, meta PhotoUploadMetadata) { // Typed metadata
    const reader = new FileReader();
    reader.onload = () => {
      const photoData: CachedPhoto = { // Typed photoData
        taskId,
        fileData: reader.result,
        fileName: file.name,
        fileType: file.type,
        meta: metadata, // Changed 'metadata,' to 'meta: metadata,'
        timestamp: Date.now()
      };
      
      const cachedPhotos = this.getCachedPhotos();
      cachedPhotos.push(photoData);
      localStorage.setItem('ontime_cached_photos', JSON.stringify(cachedPhotos));
    };
    reader.readAsDataURL(file);
  },

  getCachedPhotos(): CachedPhoto[] { // Typed return
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
    
    // Process offline actions
    for (const action of offlineActions) {
      try {
        await this.processOfflineAction(action);
      } catch (error) {
        console.error('Failed to sync offline action:', error);
        // Potentially re-queue or notify user
      }
    }
    
    // Upload cached photos
    for (const photo of cachedPhotos) {
      try {
        await this.uploadCachedPhoto(photo);
      } catch (error) {
        console.error('Failed to upload cached photo:', error);
        // Potentially re-queue or notify user
      }
    }
    
    // Clear synced data only if successful, or handle partial sync
    this.clearOfflineActions();
    this.clearCachedPhotos();
  },

  async processOfflineAction(action: OfflineTaskAction) {
    // Implementation depends on action type
    // Example:
    // if (action.action === 'update_status') {
    //   const payload = action.data as TaskUpdatePayload;
    //   await taskService.updateTaskStatus(payload.taskId, { status: payload.status, notes: payload.notes }, payload.assignedTo);
    // }
    console.log('Processing offline action:', action);
  },

  async uploadCachedPhoto(photoData: CachedPhoto) { // Typed photoData
    // Convert base64 back to file and upload
    // Example:
    // const file = await (await fetch(photoData.fileData as string)).blob();
    // await photoService.uploadTaskPhoto(photoData.taskId, new File([file], photoData.fileName, { type: photoData.fileType }), photoData.metadata);
    console.log('Uploading cached photo:', photoData);
  }
};

export default offlineService;
