
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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPin: (employeeId: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = useMemo(() => !!(user || profile), [user, profile]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);
      if (result && result.user) {
        setUser(result.user);
        setProfile(result.profile as Profile);
        localStorage.removeItem("pin-profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const loginWithPin = useCallback(async (employeeId: string, pin: string) => {
    try {
      const result = await authService.signInWithPin(employeeId, pin);
      if (result && result.profile) {
        setUser(null);
        const typedProfile = result.profile as Profile;
        setProfile(typedProfile);
        localStorage.setItem("pin-profile", JSON.stringify(typedProfile));
        console.log("Profile set after PIN login:", typedProfile);
      }
    } catch (error) {
      console.error("PIN login error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setProfile(null);
      localStorage.removeItem("pin-profile");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const userProfile = await authService.getUserProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile as Profile);
            localStorage.removeItem("pin-profile");
          }
        } else {
          // Only check for PIN profile if no Supabase session
          const storedPinProfile = localStorage.getItem("pin-profile");
          if (storedPinProfile && mounted) {
            try {
              const parsedProfile = JSON.parse(storedPinProfile);
              setProfile(parsedProfile);
              setUser(null); // Ensure user is null for PIN login
            } catch (error) {
              console.error("Error parsing stored PIN profile:", error);
              localStorage.removeItem("pin-profile");
            }
          }
        }
      } catch (error) {
        console.error("Error checking user session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth state change:", event, session?.user?.id);
      
      if (session?.user) {
        // Regular Supabase authentication
        setLoading(true);
        setUser(session.user);
        try {
          const userProfile = await authService.getUserProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile as Profile);
            localStorage.removeItem("pin-profile"); // Clear PIN profile
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else if (event === "SIGNED_OUT") {
        // Only clear state on explicit sign out
        setUser(null);
        const storedPinProfile = localStorage.getItem("pin-profile");
        if (!storedPinProfile) {
          setProfile(null);
        }
      }
      // Don't clear PIN authentication on other auth state changes
    });

    const subscription = data.subscription;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []); // Remove the [user] dependency to prevent loops

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated,
      login,
      loginWithPin,
      logout,
    }),
    [user, profile, loading, isAuthenticated, login, loginWithPin, logout]
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
