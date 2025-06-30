
import { supabase } from "@/integrations/supabase/client";
import { AuthTokenResponsePassword, AuthResponse } from "@supabase/supabase-js";

interface LoginWithPinResponse {
  access_token?: string;
  refresh_token?: string;
  message?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthTokenResponsePassword> {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async loginWithPin(employeeId: string, pin: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.rpc('login_with_pin', { 
        p_employee_id: employeeId.toUpperCase(), 
        p_pin: pin 
      });

      if (error) {
        return {  { user: null, session: null }, error };
      }

      const responseData = data as LoginWithPinResponse;

      if (responseData && responseData.access_token && responseData.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: responseData.access_token,
          refresh_token: responseData.refresh_token,
        });

        if (sessionError) {
          return {  { user: null, session: null }, error: sessionError };
        }
        
        const {  { session } } = await supabase.auth.getSession();
        return {  { session, user: session?.user || null }, error: null };
      }

      return {  { user: null, session: null }, error: new Error(responseData?.message || "Invalid credentials") };
    } catch (error) {
      return {  { user: null, session: null }, error: error as Error };
    }
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  async logout() {
    return supabase.auth.signOut();
  },

  async signUp(email: string, password: string, options?: Record<string, unknown>): Promise<AuthResponse> {
    return supabase.auth.signUp({ email, password, options });
  },
};
