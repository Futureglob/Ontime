
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
            const savedProfile = sessionStorage.getItem("pin_login_profile");
            const isPinLoginSaved = sessionStorage.getItem("is_pin_login");

            if (savedProfile && isPinLoginSaved) {
              setProfile(JSON.parse(savedProfile));
              setIsPinLogin(true);
              setLoading(false);
              return;
            }

            const { user, profile } = await authService.getCurrentUser();
            setUser(user);
            setProfile(profile);
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
            const typedProfile = result.profile as Profile;
            setProfile(typedProfile);
            setIsPinLogin(true);
            sessionStorage.setItem("pin_login_profile", JSON.stringify(typedProfile));
            sessionStorage.setItem("is_pin_login", "true");
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
  