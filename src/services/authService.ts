import { supabase } from "@/integrations/supabase/client";

const authService = {
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },

  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async login(email: string, password: string) {
    return this.signIn(email, password);
  },

  async loginWithPin(_pin: string) {
    throw new Error("PIN authentication not implemented yet");
  }
};

export default authService;
