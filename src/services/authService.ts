
import { supabase } from "@/integrations/supabase/client";
import { Profile, UserRole } from "@/types";

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, meta Record<string, any>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
         metadata,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getUserProfile(userId: string): Promise<Profile | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error("Exception fetching user profile:", error);
      return null;
    }
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
    const {  { user } } = await supabase.auth.getUser();
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

  async generatePinForUser(userId: string): Promise<{ pin: string } | null> {
    console.log(`Generating PIN for user ${userId}`);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    // In a real app, you"d save a hash of this to the user"s profile
    return { pin };
  },

  async resetUserPin(userId: string): Promise<{ pin: string } | null> {
    console.log(`Resetting PIN for user ${userId}`);
    return this.generatePinForUser(userId);
  },

  async signInWithPin(userId: string, pin: string): Promise<any> {
    console.log(`Signing in with PIN for user ${userId}`);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, pin")
      .eq("id", userId)
      .single();

    if (error || !data) {
      throw new Error("User not found or PIN not set up.");
    }

    // In a real app, you"d compare a hash, not the plain text PIN
    if (data.pin === pin) {
      const {  { session } } = await supabase.auth.getSession();
      return { session };
    } else {
      throw new Error("Invalid PIN");
    }
  }
};
