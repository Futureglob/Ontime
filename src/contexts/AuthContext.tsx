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
    // Only access localStorage on the client side after component mounts
    if (typeof window !== "undefined") {
      try {
        const mockUser = localStorage.getItem("ontime_user");
        if (mockUser) {
          setUser(JSON.parse(mockUser));
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
      }
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Mock login - replace with actual authentication
      let role: UserRole = "employee";
      if (email.includes("superadmin@system.com")) {
        role = "super_admin";
      } else if (email.includes("admin")) {
        role = "org_admin";
      } else if (email.includes("manager")) {
        role = "task_manager";
      }

      const mockUser: User = {
        id: "1",
        name: "John Doe",
        email: email,
        role: role,
        organizationId: role === "super_admin" ? "system" : "org_1",
        employeeId: "EMP001",
        designation: "Field Agent",
        mobileNumber: "+1234567890",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("ontime_user", JSON.stringify(mockUser));
      }
      setUser(mockUser);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ontime_user");
    }
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

// Remove the default export as AuthProvider is already exported as a named export
// export default AuthProvider;
