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

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const router = useRouter();

  // Add debugging for super admin check
  const isSuperAdmin = user?.user_metadata?.role === "super_admin";
  
  // Debug logging
  useEffect(() => {
    console.log("🔍 AuthContext Debug:", {
      user: user?.email,
      role: user?.user_metadata?.role,
      isSuperAdmin,
      loading
    });
  }, [user, isSuperAdmin, loading]);

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔍 Session check:", session?.user?.user_metadata?.role);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser?.user_metadata?.role === "super_admin") {
          console.log("✅ Super admin detected in session check");
          setCurrentProfile(null);
          setLoading(false);
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
      async (event, session) => {
        console.log("🔍 Auth state change:", event, session?.user?.user_metadata?.role);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser?.user_metadata?.role === "super_admin") {
          console.log("✅ Super admin detected in auth change");
          setCurrentProfile(null);
          setLoading(false);
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
    
    // If super admin, don't fetch profile and redirect immediately
    if (currentUser?.user_metadata?.role === "super_admin") {
      setCurrentProfile(null);
      // Use router.replace instead of window.location.href for better control
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

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      currentProfile,
      isSuperAdmin,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
