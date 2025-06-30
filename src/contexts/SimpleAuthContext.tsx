
import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  role: "super_admin" | "org_admin" | "task_manager" | "field_worker";
  name: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "1",
    email: "admin@ontime.com",
    role: "super_admin",
    name: "Admin User",
    organization_id: "org1"
  });

  const login = async (email: string, password: string) => {
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
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
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
