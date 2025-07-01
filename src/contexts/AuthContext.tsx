import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  currentProfile: null,
  setCurrentProfile: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
  signIn: async () => ({ error: null })
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setCurrentProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      // Try to get profile by user_id (auth.users id)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      if (data) {
        // Transform the data to match our Profile type
        const profileData: Profile = {
          id: data.id,
          user_id: data.user_id || data.id,
          organization_id: data.organization_id || undefined,
          employee_id: data.employee_id || undefined,
          full_name: data.full_name,
          designation: data.designation || undefined,
          mobile_number: data.mobile_number,
          bio: null,
          skills: null,
          address: null,
          emergency_contact: null,
          role: data.role as UserRole,
          is_active: data.is_active,
          pin: data.pin || undefined,
          avatar_url: data.avatar_url || undefined,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        setCurrentProfile(profileData);
        return;
      }
      
      // If no profile found, set to null
      setCurrentProfile(null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setCurrentProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setCurrentProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      currentProfile, 
      setCurrentProfile,
      refreshProfile,
      signOut,
      signIn
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
