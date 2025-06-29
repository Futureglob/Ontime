
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
};

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`*, organization:organizations(*)`)
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error on sign-in:", profileError);
        throw profileError;
      }
      
      return { user: data.user, profile: profile as Profile };
    }

    return { user: null, profile: null };
  },

  async signInWithPin(employeeId: string, pin: string) {
    console.log("Attempting PIN sign-in for employee ID:", employeeId);

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select(`*, organization:organizations(*)`)
      .eq("employee_id", employeeId)
      .eq("is_active", true);

    if (profileError) {
      console.error("Error fetching profile by PIN:", profileError);
      throw new Error("Invalid credentials");
    }

    if (!profiles || profiles.length === 0) {
      console.warn("No active profile found for employee ID:", employeeId);
      throw new Error("Invalid credentials");
    }

    const profile = profiles[0];
    
    // This is a simplified placeholder for PIN verification.
    // In a real app, you'd use something like bcrypt to compare a hashed PIN.
    const pinIsValid = profile.pin_hash === `pin_${pin}`;

    if (!pinIsValid) {
        console.warn("Invalid PIN for employee ID:", employeeId);
        // Here you would implement logic for failed attempts, account locking, etc.
        throw new Error("Invalid credentials");
    }
    
    console.log("PIN login successful for:", employeeId);
    return { user: null, profile: profile as Profile, isPinLogin: true };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  async getCurrentUser() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error("Error getting session:", sessionError);
        return { user: null, profile: null };
    }

    if (session?.user) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(`*, organization:organizations(*)`)
            .eq("id", session.user.id)
            .single();

        if (profileError) {
            console.error("Error fetching profile for current user:", profileError);
            return { user: session.user, profile: null };
        }
        return { user: session.user, profile: profile as Profile };
    }

    return { user: null, profile: null };
  },
};

export default authService;
