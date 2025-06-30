
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { rateLimit, hashPin } from "@/lib/utils";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export const authService = {
  async signIn(email: string, password: string) {
    await rateLimit(email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }

    if (data.user) {
      const {  profile, error: profileError } = await supabase
        .from("profiles")
        .select(`*`)
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error on sign-in:", profileError);
        return { user: data.user, profile: null };
      }
      
      return { user: data.user, profile: profile as Profile };
    }

    return { user: null, profile: null };
  },

  async signInWithPin(employeeId: string, pin: string) {
    await rateLimit(employeeId);
    
    const {  profiles, error: profileError } = await supabase
      .from("profiles")
      .select(`*`)
      .eq("employee_id", employeeId)
      .eq("is_active", true);

    if (profileError || !profiles?.length) {
      throw new Error("Invalid credentials");
    }

    const profile = profiles[0];
    const hashedPin = await hashPin(pin, profile.id);
    
    if (profile.pin_hash !== hashedPin) {
      throw new Error("Invalid credentials");
    }

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
    const {  { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error("Error getting session:", sessionError);
        return { user: null, profile: null };
    }

    if (session?.user) {
        const {  profile, error: profileError } = await supabase
            .from("profiles")
            .select(`*`)
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

  async signUp(email: string, password: string, profileData: Omit<ProfileInsert, "id">) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Sign up error:", error);
      throw error;
    }

    if (data.user) {
      const {  newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({ ...profileData, id: data.user.id })
        .select(`*`)
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
    const {  profile, error } = await supabase
      .from("profiles")
      .select(`*`)
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
    const hashedPin = await hashPin(pin, userId);

    const { data, error } = await supabase
      .from("profiles")
      .update({ 
        pin_hash: hashedPin,
        pin_updated_at: new Date().toISOString(),
        pin_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { profile: data as Profile, pin };
  },

  async resetUserPin(userId: string) {
    return this.generatePinForUser(userId);
  },
};

export default authService;
