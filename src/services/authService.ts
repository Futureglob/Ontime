
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "./profileService";

const authService = {
  async loginWithPin(employeeId: string, pin: string, organizationId: string) {
    const { data, error } = await supabase.rpc("login_with_pin", {
      employee_id: employeeId,
      pin: pin,
      organization_id: organizationId
    });

    if (error) throw error;
    if (!data?.user || !data?.session) throw new Error("Invalid credentials");

    const profile = await profileService.getProfile(data.user.id);
    
    return { user: data.user, session: data.session, profile };
  },

  async signUp(email: string, password: string, organizationId: string, fullName: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_id: organizationId,
          role: role
        }
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

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  async generatePinForUser(userId: string) {
    const { data, error } = await supabase.rpc("generate_user_pin", {
      user_id: userId
    });

    if (error) throw error;
    if (!data?.pin || !data?.user) throw new Error("Failed to generate PIN");
    
    return { pin: data.pin, user: data.user };
  },

  async resetUserPin(userId: string) {
    const { data, error } = await supabase.rpc("reset_user_pin", {
      user_id: userId
    });

    if (error) throw error;
    return data;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
    return true;
  }
};

export default authService;
