
import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string;
  path: string;
}

export const storageService = {
  async uploadTaskPhoto(file: File, taskId: string, photoType: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${taskId}/${photoType}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('task-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('task-photos')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  },

  async uploadOrganizationLogo(file: File, organizationId: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}/logo.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('organization-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  },

  async uploadProfilePhoto(file: File, userId: string): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path
    };
  },

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },

  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
};

export default storageService;
