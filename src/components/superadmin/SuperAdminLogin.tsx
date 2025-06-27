import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

interface SuperAdminLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function SuperAdminLogin({ onLogin, loading, error }: SuperAdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-purple-200">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Image
              src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
              alt="OnTime Logo"
              width={87}
              height={48}
              className="bg-transparent mix-blend-multiply"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Super Admin Access
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            System Administrator Portal
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@system.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Access System"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>🔒 Secure System Access</p>
              <p>For authorized personnel only</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
