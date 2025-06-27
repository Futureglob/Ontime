import { supabase } from "@/integrations/supabase/client";
import { TaskPhoto, PhotoType } from "@/types/database";

interface UploadMetadata {
  type: PhotoType;
  location?: { lat: number; lng: number };
  timestamp: string;
  notes?: string;
}

export const photoService = {
  async uploadTaskPhoto(
    taskId: string,
    file: File,
    meta UploadMetadata
  ): Promise<TaskPhoto> {
    const filePath = `tasks/${taskId}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("task_photos")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("task_photos")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
        throw new Error("Could not get public URL for the uploaded file.");
    }

    const { data, error } = await supabase
      .from("task_photos")
      .insert({
        task_id: taskId,
        photo_url: urlData.publicUrl,
        photo_type: metadata.type,
        latitude: metadata.location?.lat,
        longitude: metadata.location?.lng,
        taken_at: metadata.timestamp,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Photo data not found after insert.");
    return data;
  },

  async getTaskPhotos(taskId: string): Promise<TaskPhoto[]> {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("task_id", taskId)
      .order("taken_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPhotosByType(taskId: string, photoType: PhotoType): Promise<TaskPhoto[]> {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("task_id", taskId)
      .eq("photo_type", photoType)
      .order("taken_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deletePhoto(photoId: string): Promise<void> {
    const {  photo, error: fetchError } = await supabase
      .from("task_photos")
      .select("photo_url")
      .eq("id", photoId)
      .single();

    if (fetchError) throw fetchError;
    if (!photo) throw new Error("Photo not found");

    const url = new URL(photo.photo_url);
    const filePath = url.pathname.substring(url.pathname.indexOf("task_photos/") + "task_photos/".length);
    
    const { error: storageError } = await supabase.storage
      .from("task_photos")
      .remove([filePath]);

    if (storageError) {
        console.error("Storage deletion failed:", storageError.message);
    }

    const { error: dbError } = await supabase
      .from("task_photos")
      .delete()
      .eq("id", photoId);

    if (dbError) throw dbError;
  },

  async uploadPhoto(file: File, taskId: string, type: string): Promise<string> {
    const fileName = `${taskId}/${type}_${Date.now()}`;
    const { data, error } = await supabase.storage
      .from("task_photos")
      .upload(fileName, file);

    if (error) {
      throw error;
    }
    if (!data) {
        throw new Error("File upload failed, no data returned.");
    }

    const {  { publicUrl } } = supabase.storage
      .from("task_photos")
      .getPublicUrl(data.path);
    
    if (!publicUrl) {
      throw new Error("Could not get public URL for the uploaded file.");
    }

    return publicUrl;
  }
};
