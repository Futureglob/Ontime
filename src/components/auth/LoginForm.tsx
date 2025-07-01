import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import devDataService from "@/services/devDataService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { setCurrentProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPinLogin, setIsPinLogin] = useState(false);
  const [pin, setPin] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isPinLogin
        ? await authService.loginWithPin(email, pin)
        : await authService.login(email, password);

      if (result.profile) {
        setCurrentProfile(result.profile);
        toast({ title: "Login successful!" });
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          if (result.profile.role === "superadmin") {
            router.push("/superadmin");
          } else {
            router.push("/tasks");
          }
        }
      } else {
        throw new Error("Profile not found.");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevSetup = async () => {
    setLoading(true);
    try {
      // This should be an organization ID of a test organization
      // For now, we might need to hardcode it or get it from somewhere
      const testOrganizationId = "YOUR_TEST_ORGANIZATION_ID"; // Replace with a valid ID
      if (testOrganizationId === "YOUR_TEST_ORGANIZATION_ID") {
        toast({
          title: "Setup Incomplete",
          description: "Please provide a test organization ID in the code.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      await devDataService.seedDatabase(testOrganizationId);
      toast({
        title: "Dev data seeded",
        description: "Test employees and tasks have been created.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Dev setup failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@ontime.com"
          />
        </div>
        {isPinLogin ? (
          <div>
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              placeholder="1234"
              maxLength={4}
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
      <Button
        variant="link"
        onClick={() => setIsPinLogin(!isPinLogin)}
        className="w-full"
      >
        {isPinLogin ? "Login with Password" : "Login with PIN"}
      </Button>
      {process.env.NODE_ENV === "development" && (
        <Button
          variant="outline"
          onClick={handleDevSetup}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Setting up..." : "Setup Dev Data"}
        </Button>
      )}
    </div>
  );
}
