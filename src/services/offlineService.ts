import { openDB } from "idb";

const DB_NAME = "OnTimeDB";
const DB_VERSION = 1;
const TASK_STORE = "tasks";
const PHOTO_STORE = "photos";
const SYNC_QUEUE_STORE = "syncQueue";

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TASK_STORE)) {
        db.createObjectStore(TASK_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
};

export const offlineService = {
  // Task operations
  async getOfflineTasks() {
    const db = await initDB();
    return db.getAll(TASK_STORE);
  },

  async saveTaskOffline(task) {
    const db = await initDB();
    return db.put(TASK_STORE, task);
  },

  async deleteTaskOffline(taskId) {
    const db = await initDB();
    return db.delete(TASK_STORE, taskId);
  },

  // Photo operations
  async getOfflinePhotos() {
    const db = await initDB();
    return db.getAll(PHOTO_STORE);
  },

  async savePhotoOffline(photo) {
    const db = await initDB();
    return db.put(PHOTO_STORE, photo);
  },

  async deletePhotoOffline(photoId) {
    const db = await initDB();
    return db.delete(PHOTO_STORE, photoId);
  },

  // Sync queue operations
  async getSyncQueue() {
    const db = await initDB();
    return db.getAll(SYNC_QUEUE_STORE);
  },

  async addToSyncQueue(item) {
    const db = await initDB();
    return db.add(SYNC_QUEUE_STORE, item);
  },

  async removeFromSyncQueue(itemId) {
    const db = await initDB();
    return db.delete(SYNC_QUEUE_STORE, itemId);
  },

  async clearSyncQueue() {
    const db = await initDB();
    return db.clear(SYNC_QUEUE_STORE);
  },
};