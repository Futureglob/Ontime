
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

export default function OrgAdminDashboard() {
  const { currentProfile, logout } = useAuth();
  const router = useRouter();

  if (!currentProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Welcome, {currentProfile.full_name}
      </h1>
      <p>This is the Organization Admin Dashboard.</p>
      <Button onClick={() => router.push("/employees")}>
        Manage Employees
      </Button>
      <Button onClick={() => router.push("/tasks")}>Manage Tasks</Button>
      <Button onClick={logout} className="mt-4">
        Sign Out
      </Button>
    </div>
  );
}
