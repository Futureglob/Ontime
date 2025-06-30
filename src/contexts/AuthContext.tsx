
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthResponse } from "@supabase/supabase-js";
import { useRouter } from "next/router";
import { UserRole, Profile } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<AuthResponse["data"]>;
  loginWithPin: (employeeId: string, pin: string) => Promise<AuthResponse["data"]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (user: User) => {
    const profileData = await authService.getUserProfile(user.id);
    if (profileData) {
      setProfile(profileData);
      setUserRole(profileData.role);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      const {  { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser);
      }
      setLoading(false);
    };

    getInitialSession();

    const {  { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async (): Promise<void> => {
    await authService.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    setUserRole(null);
    router.push("/");
  };

  const signIn = async (email: string, password: string) => {
    return authService.signIn(email, password);
  };

  const loginWithPin = async (employeeId: string, pin: string) => {
    return authService.signInWithPin(employeeId, pin);
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    isAuthenticated: !!user,
    signOut,
    signIn,
    loginWithPin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
