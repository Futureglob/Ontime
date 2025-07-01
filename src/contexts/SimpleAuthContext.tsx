
    import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  id: string;
  email: string;
  role: "super_admin" | "org_admin" | "task_manager" | "field_worker";
  name: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this is where you might check for a session token.
    // For our mock setup, we'll just finish the loading state.
    setLoading(false);
  }, []);

  const login = async (email: string) => {
    setLoading(true);
    // Mock login - in real app this would call Supabase
    const mockUser: User = {
      id: "1",
      email,
      role: email.includes("super") ? "super_admin" : 
            email.includes("org") ? "org_admin" :
            email.includes("task") ? "task_manager" : "field_worker",
      name: "Test User",
      organization_id: "org1"
    };
    setUser(mockUser);
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
  