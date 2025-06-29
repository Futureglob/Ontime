
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { User } from "@supabase/supabase-js";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
};

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

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
    
    const pinIsValid = profile.pin_hash === `pin_${pin}`;

    if (!pinIsValid) {
        console.warn("Invalid PIN for employee ID:", employeeId);
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

  async signUp(email: string, password: string, profileData: Omit<ProfileInsert, 'id'>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Sign up error:", error);
      throw error;
    }

    if (data.user) {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({ ...profileData, id: data.user.id })
        .select(`*, organization:organizations(*)`)
        .single();

      if (profileError) {
        console.error("Profile creation error on sign-up:", profileError);
        throw profileError;
      }
      
      return { user: data.user, profile: newProfile as Profile };
    }

    return { user: null, profile: null };
  },

  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(`*, organization:organizations(*)`)
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`Error fetching profile for user ${userId}:`, error.message);
      return null;
    }

    return profile as Profile;
  },

  async generatePin(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async generatePinForUser(userId: string) {
    const pin = await this.generatePin();
    const pin_hash = `pin_${pin}`; 

    const { data, error } = await supabase
      .from('profiles')
      .update({ pin_hash })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error(`Error setting PIN for user ${userId}:`, error);
      throw error;
    }

    return { profile: data as Profile, pin };
  },

  async resetUserPin(userId: string) {
    return this.generatePinForUser(userId);
  },
};

export default authService;
