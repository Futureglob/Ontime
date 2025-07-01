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

  transformProfileData(data: Record<string, unknown>): Profile {
    return {
      id: data.id as string,
      user_id: (data.user_id || data.id) as string,
      organization_id: data.organization_id as string || undefined,
      employee_id: data.employee_id as string || undefined,
      full_name: data.full_name as string,
      designation: data.designation as string || undefined,
      mobile_number: data.mobile_number as string,
      bio: data.bio as string || null,
      skills: data.skills as string || null,
      address: data.address as string || null,
      emergency_contact: data.emergency_contact as string || null,
      role: data.role as UserRole,
      is_active: data.is_active as boolean,
      pin: data.pin as string || undefined,
      avatar_url: data.avatar_url as string || undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  async updateProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  },
};

export default profileService;
  
