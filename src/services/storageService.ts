
    import { supabase } from "@/integrations/supabase/client";

const BUCKETS = {
  avatars: "avatars",
  taskPhotos: "task_photos",
};

export const storageService = {
  async uploadFile(
    bucket: string,
    filePath: string,
    file: File
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      throw error;
    }

    const {
       { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl;
  },

  async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}.${fileExt}`;
    return this.uploadFile(BUCKETS.avatars, filePath, file);
  },

  async uploadTaskPhoto(taskId: string, file: File): Promise<string> {
    const fileName = `${taskId}/${new Date().toISOString()}-${file.name}`;
    return this.uploadFile(BUCKETS.taskPhotos, fileName, file);
  },

  async deleteFile(publicUrl: string): Promise<void> {
    try {
      const url = new URL(publicUrl);
      const pathWithBucket = url.pathname.split("/public/")[1];
      const [bucket, ...pathParts] = pathWithBucket.split("/");
      const path = pathParts.join("/");

      if (!bucket || !path) {
        console.error("Could not determine bucket or path from URL:", publicUrl);
        return;
      }

      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error("Error deleting file from storage:", error);
      }
    } catch (e) {
      console.error("Invalid URL for file deletion:", publicUrl, e);
    }
  },

  getPublicUrl(bucket: string, path: string): string {
    const {
       { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  },
};
  