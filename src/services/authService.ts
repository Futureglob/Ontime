import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";

const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("User not found after sign-in.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();
    
    if (profileError) throw new Error("Profile not found for this user.");

    return { user: data.user, session: data.session, profile: profile as Profile };
  },

  async loginWithPin(email: string, pin: string) {
    // Simplified PIN login - in real implementation this would use proper RPC
    throw new Error("PIN login not implemented yet");
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  },
};

export default authService;
  
