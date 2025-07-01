import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  currentProfile: null,
  setCurrentProfile: () => {},
  refreshProfile: async () => {}
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
      // First try with user_id
      const result1 = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (result1.error && result1.error.code !== "42703") {
        throw result1.error;
      }
      
      if (result1.data) {
        setCurrentProfile(result1.data as Profile);
        return;
      }
      
      // If user_id doesn't exist, try with id
      const result2 = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
        
      if (result2.error && result2.error.code !== "42703") {
        throw result2.error;
      }
      
      if (result2.data) {
        setCurrentProfile(result2.data as Profile);
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      currentProfile, 
      setCurrentProfile,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
