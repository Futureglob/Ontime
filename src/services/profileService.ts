import { supabase } from "@/integrations/supabase/client";
import type { Profile, UserRole } from "@/types/database";

const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      // First try with user_id
      const result1 = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (result1.error && result1.error.code !== "42703") {
        throw result1.error;
      }
      
      if (result1.data) {
        return this.transformProfileData(result1.data);
      }
      
      // If user_id doesn't exist, try with id
      const result2 = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
        
      if (result2.error && result2.error.code !== "42703") {
        throw result2.error;
      }
      
      if (result2.data) {
        return this.transformProfileData(result2.data);
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
  },

  transformProfileData(data: any): Profile {
    return {
      id: data.id,
      user_id: data.user_id || data.id,
      organization_id: data.organization_id || undefined,
      employee_id: data.employee_id || undefined,
      full_name: data.full_name,
      designation: data.designation || undefined,
      mobile_number: data.mobile_number,
      bio: data.bio || null,
      skills: data.skills || null,
      address: data.address || null,
      emergency_contact: data.emergency_contact || null,
      role: data.role as UserRole,
      is_active: data.is_active,
      pin: data.pin || undefined,
      avatar_url: data.avatar_url || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateProfile(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return this.transformProfileData(data);
  },
};

export default profileService;
  
