
import { supabase } from "@/integrations/supabase/client";

const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async uploadTaskPhoto(taskId: string, userId: string, file: File): Promise<{ photo_url: string, file_path: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${taskId}-${Date.now()}.${fileExt}`;
    const filePath = `task-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("task_photos")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("task_photos")
      .getPublicUrl(filePath);

    return { photo_url: data.publicUrl, file_path: filePath };
  }
};

export default storageService;
  