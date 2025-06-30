
import { supabase } from "@/integrations/supabase/client";
import { Profile, UserRole } from "@/types";
import { AuthResponse, Session, User, SignUpWithPasswordCredentials } from "@supabase/supabase-js";

export const authService = {
  async signIn(email: string, password: string): Promise<AuthResponse["data"]> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, meta: Record<string, unknown>): Promise<{ user: User | null; session: Session | null; }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
         meta,
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut(): Promise<void> {
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
        if (error.code !== "PGRST116") {
          console.error("Error fetching user profile:", error);
        }
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error("Exception fetching user profile:", error);
      return null;
    }
  },
  
  async getProfileByEmployeeId(employeeId: string): Promise<Profile | null> {
    if (!employeeId) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("employee_id", employeeId)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error(`Error fetching profile for employee ID ${employeeId}:`, error);
        }
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error(`Exception fetching profile for employee ID ${employeeId}:`, error);
      return null;
    }
  },

  async getUserRole(userId: string): Promise<UserRole | null> {
    if (!userId) return null;
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role || null;
    } catch (error) {
      console.error("Exception fetching user role:", error);
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
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
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { error } = await supabase
      .from("profiles")
      .update({ pin: pin }) // In a real app, you'd save a HASH of this pin
      .eq("id", userId);

    if (error) {
      console.error(`Error saving PIN for user ${userId}:`, error);
      return null;
    }
    
    return { pin };
  },

  async resetUserPin(userId: string): Promise<{ pin: string } | null> {
    console.log(`Resetting PIN for user ${userId}`);
    return this.generatePinForUser(userId);
  },

  async signInWithPin(employeeId: string, pin: string): Promise<AuthResponse["data"]> {
    const profile = await this.getProfileByEmployeeId(employeeId);

    if (!profile) {
      throw new Error("Invalid Employee ID or PIN.");
    }

    if (profile.pin !== pin) {
      // In a real app, you would compare a hash of the pin
      throw new Error("Invalid Employee ID or PIN.");
    }

    // This is a workaround. Since we can't get the user's password,
    // we can't use signInWithPassword. A proper implementation would use
    // a custom auth flow with a serverless function.
    // For now, we will throw an error to indicate this feature is not fully implemented.
    throw new Error("PIN login is not fully implemented. Please contact an administrator.");
  }
};
