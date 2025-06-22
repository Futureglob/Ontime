
import { useState, useEffect } from "react";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
import { superAdminService } from "@/services/superAdminService"; // Assuming a login function here
import { useAuth } from "@/contexts/AuthContext"; // To check general user login if needed

export default function SuperAdminPage() {
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { user: generalUser, loading: authLoading } = useAuth(); // General auth context

  // This effect could be used to check if a super admin session already exists
  useEffect(() => {
    // For now, we rely on manual login.
    // In a real scenario, you might check a specific super admin token.
    // Example: const superAdminToken = localStorage.getItem("super_admin_token");
    // if (superAdminToken) setIsSuperAdminAuthenticated(true);
  }, []);

  const handleSuperAdminLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(undefined);
    try {
      // In a real app, superAdminService.loginSuperAdmin would call Supabase
      // and verify against the 'super_admins' table or a custom claim.
      // For mock purposes, let's assume a specific credential.
      if (email === "superadmin@system.com" && password === "password123") { // Replace with actual logic
        // const { data, error: loginError } = await superAdminService.loginSuperAdmin(email, password);
        // if (loginError) throw loginError;
        // if (data?.user && data?.isSuperAdmin) { // Assuming loginSuperAdmin returns this
        setIsSuperAdminAuthenticated(true);
        // localStorage.setItem("super_admin_token", "mock_super_admin_token"); // Store a token
        // } else {
        //   throw new Error("Invalid super admin credentials or not a super admin.");
        // }
      } else {
         throw new Error("Invalid super admin credentials.");
      }
    } catch (err) {
      setError((err as Error).message || "Super admin login failed");
      setIsSuperAdminAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Optional: Add a logout function for super admin
  // const handleSuperAdminLogout = () => {
  //   localStorage.removeItem("super_admin_token");
  //   setIsSuperAdminAuthenticated(false);
  // };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Example: Redirect if a general user tries to access /superadmin without being a super_admin
  // This logic might need refinement based on how super_admin role is stored in generalUser
  // if (generalUser && generalUser.role !== "super_admin" && !isSuperAdminAuthenticated) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-lg text-red-500">Access Denied. You are not a Super Admin.</div>
  //     </div>
  //   );
  // }


  if (!isSuperAdminAuthenticated) {
    return (
      <SuperAdminLogin
        onLogin={handleSuperAdminLogin}
        loading={loading}
        error={error}
      />
    );
  }

  return <SuperAdminDashboard />;
}
