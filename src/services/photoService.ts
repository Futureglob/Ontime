
import { supabase } from "@/integrations/supabase/client";
import { Photo, PhotoType } from "@/types/database";

export const photoService = {
  async uploadTaskPhoto(
    taskId: string,
    file: File,
    meta {
      type: PhotoType;
      location?: { lat: number; lng: number };
      timestamp: string;
      notes?: string;
    }
  ): Promise<Photo> {
    const filePath = `tasks/${taskId}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("task_photos")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {  urlData } = supabase.storage
      .from("task_photos")
      .getPublicUrl(filePath);

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
    return data;
  },

  async getTaskPhotos(taskId: string): Promise<Photo[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("task_id", taskId)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPhotosByType(taskId: string, photoType: PhotoType): Promise<Photo[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("*")
      .eq("task_id", taskId)
      .eq("type", photoType)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    return data;
  },

  async deletePhoto(photoId: string) {
    const {  photo, error: fetchError } = await supabase
      .from("photos")
      .select("url")
      .eq("id", photoId)
      .single();

    if (fetchError) throw fetchError;

    const filePath = new URL(photo.url).pathname.split("/task_photos/")[1];
    
    const { error: storageError } = await supabase.storage
      .from("task_photos")
      .remove([filePath]);

    if (storageError) console.error("Storage deletion failed:", storageError.message);

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

    const {  { publicUrl } } = supabase.storage
      .from("task_photos")
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
