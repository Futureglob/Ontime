
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

  async createEmployee(newEmployee: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{ ...newEmployee, role: UserRole.EMPLOYEE }])
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }
};
