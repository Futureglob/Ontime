
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
    // The RPC function seems to have typing issues. We cast to any to bypass.
    // This assumes a function `login_with_pin` exists in Supabase.
    const { data, error } = await supabase.rpc("login_with_pin" as any, {
      p_email: email,
      p_pin: pin,
    });

    if (error) throw error;
    if (!data) throw new Error("Login with PIN failed. No data returned from RPC.");

    // Assuming the RPC returns an object with access_token and refresh_token
    const {  sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
    });

    if (sessionError) throw sessionError;
    if (!sessionData.user) throw new Error("Failed to set session from PIN login.");

    const {  profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", sessionData.user.id)
      .single();

    if (profileError) throw profileError;

    return { user: sessionData.user, session: sessionData.session, profile: profileData as Profile };
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
  