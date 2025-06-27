import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import authService from "@/services/authService";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
};

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (employeeId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const result = await authService.signIn(email, password);
    setUser(result.user);
    setProfile(result.profile as Profile);
  };

  const loginWithPin = async (employeeId: string, pin: string) => {
    const result = await authService.signInWithPin(employeeId, pin);
    setUser(result.user as SupabaseUser);
    setProfile(result.profile as Profile);
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    const checkUser = async () => {
      const {  { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const userProfile = await authService.getUserProfile(session.user.id);
        setProfile(userProfile as Profile);
      }
      setLoading(false);
    };

    checkUser();

    const {  { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          const userProfile = await authService.getUserProfile(session.user.id);
          setProfile(userProfile as Profile);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithPin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
