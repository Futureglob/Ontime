
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string, role: UserRole) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getUserRole(userId: string): Promise<UserRole | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      return data?.role as UserRole;
    } catch (error) {
      console.error("Exception fetching user role:", error);
      return null;
    }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async switchRole(userId: string, newRole: UserRole) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error switching role:", error);
      throw error;
    }
    return data;
  },
};
