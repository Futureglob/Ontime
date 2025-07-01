import { useAuth } from "@/contexts/SimpleAuthContext";
import RoleBasedSidebar from "@/components/layout/RoleBasedSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HomePage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");

  const handleLogin = async () => {
    if (email) {
      await login(email);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">OnTime Login</h1>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Enter email (try: super@test.com)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <RoleBasedSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">OnTime Dashboard</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user.name}!</h2>
            <p className="text-gray-600 mb-4">Role: {user.role.replace("_", " ").toUpperCase()}</p>
            <p className="text-gray-600">Application is working correctly!</p>
            <div className="mt-4">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Test Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
