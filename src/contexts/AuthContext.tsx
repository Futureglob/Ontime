import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService, AuthUser } from "@/services/authService";

interface AuthContextType {
  user: SupabaseUser | null;
  profile: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { user: currentUser, profile: profileDataFromService } = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser && profileDataFromService) {
          const combinedProfile: AuthUser = {
            id: currentUser.id,
            email: currentUser.email!,
            name: (profileDataFromService as { full_name?: string }).full_name || undefined,
            role: (profileDataFromService as { role?: string }).role || undefined,
            organizationId: (profileDataFromService as { organization_id?: string }).organization_id || undefined,
            employeeId: (profileDataFromService as { employee_id?: string }).employee_id || undefined,
            designation: (profileDataFromService as { designation?: string }).designation || undefined,
            mobileNumber: (profileDataFromService as { mobile_number?: string }).mobile_number || undefined,
            isActive: (profileDataFromService as { is_active?: boolean }).is_active !== undefined ? (profileDataFromService as { is_active: boolean }).is_active : true,
          };
          setProfile(combinedProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
        setProfile(null); // Ensure profile is null on error
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            const profileDataFromService = await authService.getUserProfile(session.user.id);
            if (profileDataFromService) {
              const combinedProfile: AuthUser = {
                id: session.user.id,
                email: session.user.email!,
                name: (profileDataFromService as { full_name?: string }).full_name || undefined,
                role: (profileDataFromService as { role?: string }).role || undefined,
                organizationId: (profileDataFromService as { organization_id?: string }).organization_id || undefined,
                employeeId: (profileDataFromService as { employee_id?: string }).employee_id || undefined,
                designation: (profileDataFromService as { designation?: string }).designation || undefined,
                mobileNumber: (profileDataFromService as { mobile_number?: string }).mobile_number || undefined,
                isActive: (profileDataFromService as { is_active?: boolean }).is_active !== undefined ? (profileDataFromService as { is_active: boolean }).is_active : true,
              };
              setProfile(combinedProfile);
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error("Error fetching user profile on auth change:", error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: authUser, profile: profileDataFromService } = await authService.signIn(email, password);
      setUser(authUser);
      if (authUser && profileDataFromService) {
        const combinedProfile: AuthUser = {
          id: authUser.id,
          email: authUser.email!,
          name: (profileDataFromService as { full_name?: string }).full_name || undefined,
          role: (profileDataFromService as { role?: string }).role || undefined,
          organizationId: (profileDataFromService as { organization_id?: string }).organization_id || undefined,
          employeeId: (profileDataFromService as { employee_id?: string }).employee_id || undefined,
          designation: (profileDataFromService as { designation?: string }).designation || undefined,
          mobileNumber: (profileDataFromService as { mobile_number?: string }).mobile_number || undefined,
          isActive: (profileDataFromService as { is_active?: boolean }).is_active !== undefined ? (profileDataFromService as { is_active: boolean }).is_active : true,
        };
        setProfile(combinedProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Login error:", error);
      setProfile(null); // Ensure profile is null on error
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading }}>
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
