import { supabase } from "@/integrations/supabase/client";
import { Profile, UserRole } from "@/types/database";

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async getOrganizationEmployees(organizationId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("role", UserRole.EMPLOYEE);

    if (error) throw error;
    return data as Profile[];
  },

  async createEmployee(newEmployeeData: Omit<Profile, "created_at" | "updated_at" | "role">) {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ ...newEmployeeData, role: UserRole.EMPLOYEE }])
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },

  async getOrganizationProfiles(organizationId: string): Promise<Profile[] | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching organization profiles:", error);
      throw error;
    }
  },

  async deleteProfile(profileId: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting profile:", error);
      throw error;
    }
  }
};
