
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { profileService } from "@/services/profileService";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentProfile: Profile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User | null) => {
    if (user) {
      try {
        const profile = await profileService.getProfile(user.id);
        setCurrentProfile(profile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setCurrentProfile(null);
      }
    } else {
      setCurrentProfile(null);
    }
  }, []);

  useEffect(() => {
    const getSessionData = async () => {
      setLoading(true);
      const {  { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await fetchProfile(currentUser);
      setLoading(false);
    };

    getSessionData();

    const {  { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await fetchProfile(currentUser);
        if (loading) setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, loading]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentProfile(null);
  };

  const value = {
    user,
    session,
    currentProfile,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
