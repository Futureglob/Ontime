
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import authService, { Profile } from "@/services/authService";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (employeeId: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinLogin, setIsPinLogin] = useState(false);
  const router = useRouter();

  const fetchProfile = useCallback(async (user: SupabaseUser) => {
    try {
      const userProfile = await authService.getUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to fetch profile on auth change:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const {  { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    const initialAuthCheck = async () => {
      setLoading(true);
      const {  { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      }
      setLoading(false);
    };
    
    initialAuthCheck();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const isAuthenticated = useMemo(() => {
    return !!(user || profile) && !loading;
  }, [user, profile, loading]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);
      if (result && result.user) {
        setUser(result.user);
        setProfile(result.profile);
        setIsPinLogin(false);
        sessionStorage.removeItem("pin_login_profile");
        sessionStorage.removeItem("is_pin_login");
        console.log("Regular login successful:", result.user.email);
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithPin = useCallback(async (employeeId: string, pin: string) => {
    try {
      setLoading(true);
      const result = await authService.signInWithPin(employeeId, pin);
      if (result && result.profile) {
        setUser(null);
        setProfile(result.profile);
        setIsPinLogin(true);
        sessionStorage.setItem("pin_login_profile", JSON.stringify(result.profile));
        sessionStorage.setItem("is_pin_login", "true");
        console.log("PIN login successful, profile set:", result.profile);
      }
    } catch (error) {
      console.error("PIN login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (!isPinLogin) {
        await authService.signOut();
      }
      sessionStorage.removeItem("pin_login_profile");
      sessionStorage.removeItem("is_pin_login");
      setUser(null);
      setProfile(null);
      setIsPinLogin(false);
      router.push("/").catch(console.error);
      toast.success("Successfully signed out!");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
      throw error;
    }
  }, [isPinLogin, router]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated,
      login,
      loginWithPin,
      signOut,
    }),
    [user, profile, loading, isAuthenticated, login, loginWithPin, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
