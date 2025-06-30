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
import authService from "@/services/authService";
import { Database } from "@/integrations/supabase/types";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  organization: Database["public"]["Tables"]["organizations"]["Row"] | null;
};

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

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        // Safely access sessionStorage
        let savedProfile = null;
        let isPinLoginSaved = null;
        
        try {
          savedProfile = sessionStorage.getItem("pin_login_profile");
          isPinLoginSaved = sessionStorage.getItem("is_pin_login");
        } catch (error) {
          console.warn("SessionStorage access failed:", error);
        }

        if (savedProfile && isPinLoginSaved) {
          try {
            setProfile(JSON.parse(savedProfile));
            setIsPinLogin(true);
            setLoading(false);
            return;
          } catch (error) {
            console.warn("Failed to parse saved profile:", error);
            // Clear invalid data
            try {
              sessionStorage.removeItem("pin_login_profile");
              sessionStorage.removeItem("is_pin_login");
            } catch (e) {
              console.warn("Failed to clear sessionStorage:", e);
            }
          }
        }

        // SIMPLIFIED: Just check if user is authenticated, don't fetch profile yet
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error) {
            console.warn("Auth check failed:", error);
          } else {
            setUser(user);
            // Don't fetch profile here to avoid the infinite recursion issue
          }
        } catch (error) {
          console.warn("Auth initialization failed:", error);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const isAuthenticated = useMemo(() => {
    return !!(user || profile) && !loading;
  }, [user, profile, loading]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);
      if (result && result.user) {
        setUser(result.user);
        setProfile(result.profile as Profile);
        setIsPinLogin(false);
        
        // Safely clear sessionStorage
        try {
          sessionStorage.removeItem("pin_login_profile");
          sessionStorage.removeItem("is_pin_login");
        } catch (error) {
          console.warn("Failed to clear sessionStorage:", error);
        }
        
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
        const typedProfile = result.profile as Profile;
        setProfile(typedProfile);
        setIsPinLogin(true);
        
        // Safely save to sessionStorage
        try {
          sessionStorage.setItem("pin_login_profile", JSON.stringify(typedProfile));
          sessionStorage.setItem("is_pin_login", "true");
        } catch (error) {
          console.warn("Failed to save to sessionStorage:", error);
        }
        
        console.log("PIN login successful, profile set:", typedProfile);
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
      
      // Safely clear sessionStorage
      try {
        sessionStorage.removeItem("pin_login_profile");
        sessionStorage.removeItem("is_pin_login");
      } catch (error) {
        console.warn("Failed to clear sessionStorage:", error);
      }
      
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
