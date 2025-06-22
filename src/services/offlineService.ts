interface OfflineTask {
  id: string;
  action: 'update_status' | 'upload_photo' | 'create_task';
  data: any;
  timestamp: number;
}

export const offlineService = {
  // Store offline actions in localStorage
  storeOfflineAction(action: OfflineTask) {
    const offlineActions = this.getOfflineActions();
    offlineActions.push(action);
    localStorage.setItem('ontime_offline_actions', JSON.stringify(offlineActions));
  },

  getOfflineActions(): OfflineTask[] {
    const stored = localStorage.getItem('ontime_offline_actions');
    return stored ? JSON.parse(stored) : [];
  },

  clearOfflineActions() {
    localStorage.removeItem('ontime_offline_actions');
  },

  // Cache task data for offline access
  cacheTaskData(tasks: any[]) {
    localStorage.setItem('ontime_cached_tasks', JSON.stringify({
      data: tasks,
      timestamp: Date.now()
    }));
  },

  getCachedTaskData() {
    const cached = localStorage.getItem('ontime_cached_tasks');
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours
    
    return isExpired ? null : parsed.data;
  },

  // Cache photos for offline upload
  cachePhotoForUpload(taskId: string, file: File, metadata: any) {
    const reader = new FileReader();
    reader.onload = () => {
      const photoData = {
        taskId,
        fileData: reader.result,
        fileName: file.name,
        fileType: file.type,
        metadata,
        timestamp: Date.now()
      };
      
      const cachedPhotos = this.getCachedPhotos();
      cachedPhotos.push(photoData);
      localStorage.setItem('ontime_cached_photos', JSON.stringify(cachedPhotos));
    };
    reader.readAsDataURL(file);
  },

  getCachedPhotos() {
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
      }
    }
    
    // Upload cached photos
    for (const photo of cachedPhotos) {
      try {
        await this.uploadCachedPhoto(photo);
      } catch (error) {
        console.error('Failed to upload cached photo:', error);
      }
    }
    
    // Clear synced data
    this.clearOfflineActions();
    this.clearCachedPhotos();
  },

  async processOfflineAction(action: OfflineTask) {
    // Implementation depends on action type
    console.log('Processing offline action:', action);
  },

  async uploadCachedPhoto(photoData: any) {
    // Convert base64 back to file and upload
    console.log('Uploading cached photo:', photoData);
  }
};

export default offlineService;