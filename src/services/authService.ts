
import { supabase } from "@/integrations/supabase/client";
import { AuthTokenResponsePassword, AuthResponse, AuthError } from "@supabase/supabase-js";

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
    const { data, error } = await supabase.rpc('login_with_pin', { 
      p_employee_id: employeeId.toUpperCase(), 
      p_pin: pin 
    });

    if (error) {
      return {  { user: null, session: null }, error: error as unknown as AuthError };
    }

    const responseData = data as LoginWithPinResponse;

    if (responseData && responseData.access_token && responseData.refresh_token) {
      const sessionResponse = await supabase.auth.setSession({
        access_token: responseData.access_token,
        refresh_token: responseData.refresh_token,
      });

      if (sessionResponse.error) {
        return {  { user: null, session: null }, error: sessionResponse.error };
      }
      
      const getSessionResponse = await supabase.auth.getSession();
      
      return {  { session: getSessionResponse.data.session, user: getSessionResponse.data.session?.user ?? null }, error: getSessionResponse.error };
    }

    return {  { user: null, session: null }, error: new Error(responseData?.message || "Invalid credentials") as AuthError };
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
