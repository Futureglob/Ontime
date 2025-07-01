import { supabase } from "@/integrations/supabase/client";

const authService = {
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
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

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    let profile = null;
    if (data.user) {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        
        // If user has no profile but is a super admin (based on metadata), create profile
        if (!profileData && data.user.user_metadata?.role === "super_admin") {
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert([{
              id: data.user.id,
              role: "super_admin",
              email: data.user.email
            }])
            .select()
            .single();
          
          profile = newProfile;
        } else {
          profile = profileData;
        }
      } catch (err) {
        console.error("Error fetching/creating profile:", err);
      }
    }
    
    return { ...data, profile };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async logout() {
    return this.signOut();
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  }
};

export default authService;
