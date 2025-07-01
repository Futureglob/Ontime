import { supabase } from "@/integrations/supabase/client";
import { storageService } from "@/services/storageService";
import type { TaskPhoto } from "@/types";

export const photoService = {
  async uploadTaskPhoto(
    taskId: string,
    userId: string,
    file: File,
    photoType: "check_in" | "progress" | "completion"
  ): Promise<TaskPhoto> {
    const photo_url = await storageService.uploadTaskPhoto(taskId, file);

    const photoData = {
      task_id: taskId,
      user_id: userId,
      photo_url,
      photo_type: photoType,
      // The following fields are not in the schema, so they are removed.
      // latitude: location?.lat,
      // longitude: location?.lng,
    };

    const { data, error } = await supabase
      .from("task_photos")
      .insert(photoData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting photo meta", error);
      throw error;
    }

    return data as TaskPhoto;
  },

  async getTaskPhotos(taskId: string): Promise<TaskPhoto[]> {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching task photos:", error);
      throw error;
    }
    return data as TaskPhoto[];
  },

  async getPhotosForUser(userId: string): Promise<TaskPhoto[]> {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user photos:", error);
      throw error;
    }
    return data as TaskPhoto[];
  },

  async deletePhoto(photoId: string): Promise<void> {
    // First, get the photo URL to delete from storage
    const {  data: photo, error: fetchError } = await supabase
      .from("task_photos")
      .select("photo_url")
      .eq("id", photoId)
      .single();

    if (fetchError) {
      console.error("Error fetching photo for deletion:", fetchError);
      throw fetchError;
    }

    if (photo) {
      // Delete the file from storage
      await storageService.deleteFile(photo.photo_url);

      // Delete the record from the database
      const { error: deleteError } = await supabase
        .from("task_photos")
        .delete()
        .eq("id", photoId);

      if (deleteError) {
        console.error("Error deleting photo record:", deleteError);
        throw deleteError;
      }
    }
  },
};
