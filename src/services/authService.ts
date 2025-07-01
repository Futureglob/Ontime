
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/database";

const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("User not found after sign-in.");

    const {  profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();
    
    if (profileError) throw new Error("Profile not found for this user.");

    return { user: data.user, session: data.session, profile: profile as Profile };
  },

  async loginWithPin(email: string, pin: string) {
    const { data, error } = await supabase.rpc('login_with_pin' as any, {
      p_email: email,
      p_pin: pin
    });

    if (error) throw error;
    // The RPC should return user, session, and profile data
    return data;
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
