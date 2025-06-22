import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authService, AuthUser } from "@/services/authService";

interface AuthContextType {
  user: SupabaseUser | null;
  profile: AuthUser | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        authService.getUserProfile(session.user.id).then((profileData) => {
          if (profileData) {
            const typedProfile = profileData as { full_name?: string, role?: string, organization_id?: string, employee_id?: string, designation?: string, mobile_number?: string, is_active?: boolean };
            const combinedProfile: AuthUser = {
              id: session.user.id,
              email: session.user.email!,
              name: typedProfile.full_name || undefined,
              role: typedProfile.role || undefined,
              organizationId: typedProfile.organization_id || undefined,
              employeeId: typedProfile.employee_id || undefined,
              designation: typedProfile.designation || undefined,
              mobileNumber: typedProfile.mobile_number || undefined,
              isActive: typedProfile.is_active !== undefined ? typedProfile.is_active : true,
            };
            setProfile(combinedProfile);
          }
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await authService.getUserProfile(session.user.id);
        if (profileData) {
          const typedProfile = profileData as { full_name?: string, role?: string, organization_id?: string, employee_id?: string, designation?: string, mobile_number?: string, is_active?: boolean };
          const combinedProfile: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            name: typedProfile.full_name || undefined,
            role: typedProfile.role || undefined,
            organizationId: typedProfile.organization_id || undefined,
            employeeId: typedProfile.employee_id || undefined,
            designation: typedProfile.designation || undefined,
            mobileNumber: typedProfile.mobile_number || undefined,
            isActive: typedProfile.is_active !== undefined ? typedProfile.is_active : true,
          };
          setProfile(combinedProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setSession(data.session);
      setUser(data.user);

      if (data.user) {
        const profileData = await authService.getUserProfile(data.user.id);
        if (profileData) {
          const typedProfile = profileData as { full_name?: string, role?: string, organization_id?: string, employee_id?: string, designation?: string, mobile_number?: string, is_active?: boolean };
          const combinedProfile: AuthUser = {
            id: data.user.id,
            email: data.user.email!,
            name: typedProfile.full_name || undefined,
            role: typedProfile.role || undefined,
            organizationId: typedProfile.organization_id || undefined,
            employeeId: typedProfile.employee_id || undefined,
            designation: typedProfile.designation || undefined,
            mobileNumber: typedProfile.mobile_number || undefined,
            isActive: typedProfile.is_active !== undefined ? typedProfile.is_active : true,
          };
          setProfile(combinedProfile);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, login, logout, loading }}>
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
