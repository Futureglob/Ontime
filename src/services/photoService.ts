
import { supabase } from "@/integrations/supabase/client";
import { TaskPhoto, PhotoType, CreatePhotoRequest } from "@/types/database";

export const photoService = {
  async uploadTaskPhoto(file: File, taskId: string, photoType: PhotoType, latitude?: number, longitude?: number) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${taskId}/${photoType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("task-photos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("task-photos")
      .getPublicUrl(fileName);

    const photoData: CreatePhotoRequest = {
      task_id: taskId,
      photo_type: photoType,
      photo_url: publicUrl,
      latitude,
      longitude
    };

    const { data, error } = await supabase
      .from("task_photos")
      .insert([photoData])
      .select()
      .single();

    if (error) throw error;
    return data as TaskPhoto;
  },

  async getTaskPhotos(taskId: string) {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("task_id", taskId)
      .order("taken_at", { ascending: true });

    if (error) throw error;
    return data as TaskPhoto[];
  },

  async getPhotosByType(taskId: string, photoType: PhotoType) {
    const { data, error } = await supabase
      .from("task_photos")
      .select("*")
      .eq("task_id", taskId)
      .eq("photo_type", photoType)
      .order("taken_at", { ascending: true });

    if (error) throw error;
    return data as TaskPhoto[];
  }
};
