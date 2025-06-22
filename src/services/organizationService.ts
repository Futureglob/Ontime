
import { supabase } from "@/integrations/supabase/client";
import { Organization } from "@/types/database";

export const organizationService = {
  async getOrganization(id: string) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async updateOrganization(id: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async uploadLogo(organizationId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${organizationId}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("organization-logos")
      .getPublicUrl(fileName);

    await this.updateOrganization(organizationId, { logo_url: publicUrl });
    return publicUrl;
  }
};
