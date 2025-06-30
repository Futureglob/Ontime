
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  async login(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async loginWithPin(employeeId: string, pin: string) {
    const { data, error } = await supabase.rpc('login_with_pin', { 
      p_employee_id: employeeId.toUpperCase(), 
      p_pin: pin 
    });

    if (error) {
      return { data: null, error };
    }

    if (data && data.access_token && data.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        return { data: null, error: sessionError };
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      return { data: { session }, error: null };
    }

    return { data: null, error: new Error(data.message || "Invalid credentials") };
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  async logout() {
    return supabase.auth.signOut();
  },

  async signUp(email: string, password: string, options?: any) {
    return supabase.auth.signUp({ email, password, options });
  },
};
