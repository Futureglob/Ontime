import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import profileService from "@/services/profileService";
import type { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentProfile: Profile | null;
  isSuperAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ user: User; session: Session }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  currentProfile: null,
  isSuperAdmin: false,
  login: async () => ({ user: {} as User, session: {} as Session }),
  logout: async () => {}
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const router = useRouter();

  const isSuperAdmin = user?.user_metadata?.role === "super_admin";

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Immediate redirect for super admin on session check
        if (currentUser?.user_metadata?.role === "super_admin") {
          setCurrentProfile(null);
          setLoading(false);
          window.location.replace("/superadmin");
          return;
        }

        if (currentUser && currentUser.user_metadata?.role !== "super_admin") {
          const profile = await profileService.getProfile(currentUser.id);
          setCurrentProfile(profile);
        } else {
          setCurrentProfile(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setUser(null);
        setSession(null);
        setCurrentProfile(null);
      } finally {
        setLoading(false);
      }
    }

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Immediate redirect for super admin on auth state change
        if (currentUser?.user_metadata?.role === "super_admin") {
          setCurrentProfile(null);
          setLoading(false);
          window.location.replace("/superadmin");
          return;
        }

        if (currentUser && currentUser.user_metadata?.role !== "super_admin") {
          const profile = await profileService.getProfile(currentUser.id);
          setCurrentProfile(profile);
        } else {
          setCurrentProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
    
    const currentUser = data.user;
    setUser(currentUser);
    
    // If super admin, don't fetch profile and force immediate redirect
    if (currentUser?.user_metadata?.role === "super_admin") {
      setCurrentProfile(null);
      // Force immediate redirect to super admin page
      setTimeout(() => {
        window.location.replace("/superadmin");
      }, 100);
      return data;
    }
    
    if (currentUser) {
      const profile = await profileService.getProfile(currentUser.id);
      setCurrentProfile(profile);
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCurrentProfile(null);
    router.push("/");
  };

  const value = {
    user,
    session,
    loading,
    currentProfile,
    isSuperAdmin,
    login,
    logout
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
