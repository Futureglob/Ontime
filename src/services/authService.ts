
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "./profileService";

export const authService = {
  async loginWithPin(employeeId: string, pin: string, organizationId: string) {
    const { data, error } = await supabase.rpc("login_with_pin" as any, {
      p_employee_id: employeeId,
      p_pin: pin,
      p_organization_id: organizationId,
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    const profile = await profileService.getProfileByEmployeeId(employeeId, organizationId);
    return { user: profile, session: null }; // No session from PIN login
  },

  async signUp(email, password, organizationId, fullName, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
         {
          organization_id: organizationId,
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async generatePin(userId: string) {
    const { data, error } = await supabase.rpc("generate_user_pin" as any, {
      p_user_id: userId,
    });
    if (error) throw error;
    if (data.error) throw new Error(data.error);
    return data.pin;
  },

  async resetPin(userId: string) {
    const { error } = await supabase.rpc("reset_user_pin" as any, {
      p_user_id: userId,
    });
    if (error) throw error;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
