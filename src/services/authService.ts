
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";

const authService = {
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
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

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Try to get profile
    let profile = null;
    if (data.user) {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (!profileData) {
          // Try with id column
          const { data: profileData2 } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle();
          profile = profileData2;
        } else {
          profile = profileData;
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }
    
    return { ...data, profile };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async logout() {
    return this.signOut();
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async loginWithPin(email: string, pin: string) {
    // For now, treat PIN login as regular password login
    // This would need to be implemented based on your PIN system
    return this.login(email, pin);
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  }
};

export default authService;
