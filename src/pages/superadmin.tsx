import { useState, useEffect } from "react";
import SuperAdminLogin from "@/components/superadmin/SuperAdminLogin";
import SuperAdminDashboard from "@/components/superadmin/SuperAdminDashboard";
// import { superAdminService } from "@/services/superAdminService"; // Correctly commented out or remove if not used here
// import { useAuth } from "@/contexts/AuthContext"; // Removed unused import

export default function SuperAdminPage() {
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // const { user: generalUser, loading: authLoading } = useAuth(); // generalUser is unused, can be removed or commented if not planned

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
      // Mock login for now. Replace "password123" with a more secure check or use superAdminService.loginSuperAdmin
      if (email === "superadmin@system.com" && password === "password123") { 
        // Example using the service (once its login is fully implemented):
        // const { user, isSuperAdmin } = await superAdminService.loginSuperAdmin(email, password);
        // if (isSuperAdmin) {
        //   setIsSuperAdminAuthenticated(true);
        //   // Optionally store a specific super admin session token if needed
        // } else {
        //   throw new Error("User is not a super admin.");
        // }
        setIsSuperAdminAuthenticated(true); // Current mock behavior
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

  // if (authLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-lg">Loading...</div>
  //     </div>
  //   );
  // }

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
