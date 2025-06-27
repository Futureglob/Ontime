
        import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, organization:organizations(*)")
      .eq("id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        throw error;
    }
    return data;
  },

  async getOrganizationProfiles(organizationId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId);
      
    if (error) {
        console.error("Error fetching organization profiles:", error);
        return [];
    }
    return data;
  },

  async createProfile(profileData: ProfileInsert) {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (error) throw error;
    return data as ProfileRow;
  },

  async updateProfile(userId: string, updates: ProfileUpdate) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProfile(profileId: string) {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) throw error;
  }
};
      