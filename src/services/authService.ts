
import { supabase } from "@/integrations/supabase/client";
import { AuthTokenResponsePassword, AuthResponse, AuthError, PostgrestError } from "@supabase/supabase-js";

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
      const { data, error: rpcError } = await supabase.rpc("login_with_pin", {
        p_employee_id: employeeId.toUpperCase(),
        p_pin: pin,
      });

      if (rpcError) {
        const authError = new AuthError((rpcError as PostgrestError).message, parseInt((rpcError as PostgrestError).code, 10) || 500);
        return {  { user: null, session: null }, error: authError };
      }

      const responseData = data as LoginWithPinResponse;

      if (responseData && responseData.access_token && responseData.refresh_token) {
        const sessionResponse = await supabase.auth.setSession({
          access_token: responseData.access_token,
          refresh_token: responseData.refresh_token,
        });

        return sessionResponse;
      }

      const authError = new AuthError(responseData?.message || "Invalid credentials or PIN", 401);
      return {  { user: null, session: null }, error: authError };
    } catch (e) {
      const error = e as Error;
      const authError = new AuthError(error.message || "Login failed", 500);
      return {  { user: null, session: null }, error: authError };
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
    return supabase.auth.signUp({ email, password, options: {  options } });
  },

  async generatePinForUser(userId: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.rpc('generate_user_pin', { p_user_id: userId });
    if (error) {
      return { error: new AuthError(error.message, 500) };
    }
    return { error: null };
  },

  async resetUserPin(userId: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.rpc('reset_user_pin', { p_user_id: userId });
    if (error) {
      return { error: new AuthError(error.message, 500) };
    }
    return { error: null };
  },
};
  