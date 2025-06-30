
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  async login(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async loginWithPin(employeeId, pin) {
    const { data, error } = await supabase.rpc('login_with_pin', { 
      p_employee_id: employeeId.toUpperCase(), 
      p_pin: pin 
    });

    if (error) {
      return {  null, error };
    }

    if (data && data.access_token && data.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        return {  null, error: sessionError };
      }
      
      const {  { session } } = await supabase.auth.getSession();
      return {  { session }, error: null };
    }

    return {  null, error: new Error(data.message || "Invalid credentials") };
  },

  async resetPassword(email) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  async logout() {
    return supabase.auth.signOut();
  },

  async signUp(email, password, options) {
    return supabase.auth.signUp({ email, password, options });
  },
};
