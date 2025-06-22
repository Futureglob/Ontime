
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "./profileService";
import { UserRole } from "@/types/database";

export const authService = {
  async signUp(email: string, password: string, userData: {
    full_name: string;
    organization_id?: string;
    employee_id?: string;
    designation?: string;
    mobile_number?: string;
    role?: UserRole;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    if (data.user) {
      await profileService.createEmployee({
        id: data.user.id,
        ...userData
      });
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getCurrentUserProfile() {
    const user = await this.getCurrentUser();
    if (!user) return null;
    
    return await profileService.getProfile(user.id);
  }
};
