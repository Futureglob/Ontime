
import { supabase } from "@/integrations/supabase/client";
import { Photo, PhotoType } from "@/types/database";

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
    metadata: UploadMetadata
  ): Promise<Photo> {
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
      .from("photos")
      .insert({
        task_id: taskId,
        url: urlData.publicUrl,
        type: metadata.type,
        location: metadata.location 
          ? `POINT(${metadata.location.lng} ${metadata.location.lat})` 
          : undefined,
        notes: metadata.notes,
        timestamp: metadata.timestamp,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Photo data not found after insert.");
    return data;
  },

  async getTaskPhotos(taskId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("task_id", taskId)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPhotosByType(taskId: string, photoType: PhotoType): Promise<Photo[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("task_id", taskId)
      .eq("type", photoType)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deletePhoto(photoId: string): Promise<void> {
    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("url")
      .eq("id", photoId)
      .single();

    if (fetchError) throw fetchError;
    if (!photo) throw new Error("Photo not found");

    const url = new URL(photo.url);
    const filePath = url.pathname.substring(url.pathname.indexOf("task_photos/") + "task_photos/".length);
    
    const { error: storageError } = await supabase.storage
      .from("task_photos")
      .remove([filePath]);

    if (storageError) {
        console.error("Storage deletion failed:", storageError.message);
    }

    const { error: dbError } = await supabase
      .from("photos")
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

    const { data: { publicUrl } } = supabase.storage
      .from("task_photos")
      .getPublicUrl(data.path);
    
    if (!publicUrl) {
      throw new Error("Could not get public URL for the uploaded file.");
    }

    return publicUrl;
  }
};
