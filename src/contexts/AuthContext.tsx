import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const mockUser = localStorage.getItem("ontime_user");
    if (mockUser) {
      setUser(JSON.parse(mockUser));
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Mock login - replace with actual authentication
    const mockUser: User = {
      id: "1",
      name: "John Doe",
      email: email,
      role: email.includes("admin") ? "org_admin" : email.includes("manager") ? "task_manager" : "employee",
      organizationId: "org_1",
      employeeId: "EMP001",
      designation: "Field Agent",
      mobileNumber: "+1234567890",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    localStorage.setItem("ontime_user", JSON.stringify(mockUser));
    setUser(mockUser);
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("ontime_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
