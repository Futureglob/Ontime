import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

export type Profile = ProfileRow & { organization: OrganizationRow | null };

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    console.log("Fetching profile for user:", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("No profile found for user:", userId);
        return null;
      }
      console.error("Error fetching profile:", error);
      throw error;
    }

    console.log("Fetched profile:", data);
    return data;
  },

  async getOrganizationProfiles(organizationId: string): Promise<Profile[]> {
    console.log("Fetching profiles for organization:", organizationId);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching organization profiles:", error);
        throw error;
      }

      console.log("Fetched profiles count:", data?.length);
      console.log("Fetched profiles data:", data);
      return data || [];
    } catch (err) {
      console.error("Error in getOrganizationProfiles:", err);
      throw err;
    }
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
