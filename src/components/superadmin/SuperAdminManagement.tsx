import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { superAdminService, SuperAdmin } from "@/services/superAdminService";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";

export default function SuperAdminManagement() {
  const { user } = useAuth();
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [newAdminUserId, setNewAdminUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuperAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const admins = await superAdminService.getSuperAdmins();
      setSuperAdmins(admins);
    } catch (err) {
      console.error("Error fetching super admins:", err);
      setError("Failed to load super admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperAdmins();
  }, []);

  const handleAddSuperAdmin = async () => {
    if (!newAdminUserId.trim()) {
      setError("User ID cannot be empty.");
      return;
    }
    if (!user) {
      setError("Current user not found.");
      return;
    }

    try {
      setError(null);
      await superAdminService.addSuperAdmin(newAdminUserId.trim());
      setNewAdminUserId("");
      await fetchSuperAdmins(); // Refresh the list
    } catch (err) {
      console.error("Error adding super admin:", err);
      setError("Failed to add super admin. Ensure the User ID is valid and not already a super admin.");
    }
  };

  const handleRemoveSuperAdmin = async (adminIdToRemove: string) => {
    if (user && adminIdToRemove === user.id) {
        // This check is based on super_admins.id, not user_id.
        // A super admin might want to remove their own record if they know the super_admins table's ID.
        // However, a more robust check would be to prevent removing the *last* super admin or self based on user_id.
        // For now, we'll check against the super_admins record's user_id.
        const adminRecord = superAdmins.find(sa => sa.id === adminIdToRemove);
        if (adminRecord && adminRecord.user_id === user.id) {
             setError("You cannot remove yourself as a super admin.");
             return;
        }
    }
    try {
      setError(null);
      await superAdminService.removeSuperAdmin(adminIdToRemove);
      await fetchSuperAdmins(); // Refresh the list
    } catch (err) {
      console.error("Error removing super admin:", err);
      setError("Failed to remove super admin.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            Super Admin Management
          </CardTitle>
          <CardDescription>Manage users with super administrative privileges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}
          
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter User ID to make Super Admin"
              value={newAdminUserId}
              onChange={(e) => setNewAdminUserId(e.target.value)}
            />
            <Button onClick={handleAddSuperAdmin}>Add Super Admin</Button>
          </div>

          {loading ? (
            <p>Loading super admins...</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Current Super Admins:</h3>
              {superAdmins.length === 0 ? (
                <p>No super admins found.</p>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {superAdmins.map((admin) => (
                    <li key={admin.id} className="flex justify-between items-center">
                      <span>
                        {admin.user_name || "Unknown Name"} ({admin.user_email || admin.user_id})
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveSuperAdmin(admin.id)}
                        disabled={user?.id === admin.user_id && superAdmins.length === 1} // Prevent removing self if last admin
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
