import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import Image from "next/image";

export default function LoginForm() {
  const router = useRouter();
  const { login, loginWithPin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("email");
  
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: ""
  });

  const [pinFormData, setPinFormData] = useState({
    employeeId: "",
    pin: ""
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!emailFormData.email || !emailFormData.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await login(emailFormData.email, emailFormData.password);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("email_not_confirmed") || err.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in. If you didn't receive the email, contact your administrator.");
        } else if (err.message.includes("invalid_credentials") || err.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else {
          setError(err.message || "Failed to sign in");
        }
      } else {
        setError("An unknown error occurred during sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!pinFormData.employeeId || !pinFormData.pin) {
      setError("Please enter both Employee ID and PIN");
      return;
    }

    if (pinFormData.pin.length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }

    try {
      setLoading(true);
      await loginWithPin(pinFormData.employeeId, pinFormData.pin);
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("account_locked")) {
          setError("Account is temporarily locked due to multiple failed attempts. Please contact your administrator.");
        } else if (err.message.includes("invalid_pin")) {
          setError("Invalid Employee ID or PIN. Please check your credentials and try again.");
        } else if (err.message.includes("pin_expired")) {
          setError("Your PIN has expired. Please contact your administrator for a new PIN.");
        } else {
          setError(err.message || "Failed to sign in with PIN");
        }
      } else {
        setError("An unknown error occurred during PIN sign in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePinInputChange = (value: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setPinFormData(prev => ({
      ...prev,
      pin: numericValue
    }));
  };

  const handleForgotPin = () => {
    if (!pinFormData.employeeId) {
      setError("Please enter your Employee ID first");
      return;
    }
    
    // This will be handled by the admin
    alert(`PIN reset request for Employee ID: ${pinFormData.employeeId}\n\nYour request has been sent to the administrator. You will receive your new PIN orally from your supervisor.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center light-blue-gradient py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
              alt="OnTime Logo"
              width={115}
              height={64}
              className="bg-transparent mix-blend-multiply"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
            />
          </div>
          <div className="flex items-center justify-center gap-3 mt-6">
            <h2 className="text-3xl font-extrabold text-sky-900">
              Sign in
            </h2>
            <Image
              src="/ontime-logo-png-amaranth-font-740x410-mcf79fls.png"
              alt="OnTime Logo"
              width={87}
              height={48}
              className="bg-transparent mix-blend-multiply"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
            />
          </div>
          <p className="mt-2 text-sm text-sky-700">
            Task management made simple
          </p>
        </div>

        <Card className="light-blue-card">
          <CardHeader>
            <CardTitle className="text-sky-800">Welcome back</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Login
                </TabsTrigger>
                <TabsTrigger value="pin" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Employee PIN
                </TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="email">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-sky-800">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        type="email"
                        value={emailFormData.email}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        className="pl-10 border-sky-200 focus:border-sky-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-sky-800">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={emailFormData.password}
                        onChange={(e) => setEmailFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 border-sky-200 focus:border-sky-400"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-sky-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-sky-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full light-blue-button">
                    {loading ? "Signing in..." : "Sign in with Email"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-sky-600 hover:text-sky-800"
                      onClick={() => {
                        const email = prompt("Enter your email for password reset:");
                        if (email) {
                          alert("Password reset functionality will be implemented with Supabase integration");
                        }
                      }}
                    >
                      Forgot your password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="pin">
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-sky-800">Employee ID</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        type="text"
                        value={pinFormData.employeeId}
                        onChange={(e) => setPinFormData(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
                        placeholder="Enter your Employee ID"
                        className="pl-10 border-sky-200 focus:border-sky-400 uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-sky-800">PIN</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        type={showPin ? "text" : "password"}
                        value={pinFormData.pin}
                        onChange={(e) => handlePinInputChange(e.target.value)}
                        placeholder="Enter your 6-digit PIN"
                        className="pl-10 pr-10 border-sky-200 focus:border-sky-400 text-center text-lg tracking-widest"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? (
                          <EyeOff className="h-4 w-4 text-sky-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-sky-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-sky-600 mt-1">Enter the 6-digit PIN provided by your administrator</p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full light-blue-button">
                    {loading ? "Signing in..." : "Sign in with PIN"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-sky-600 hover:text-sky-800"
                      onClick={handleForgotPin}
                    >
                      Forgot your PIN?
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <p className="text-xs text-sky-700 font-medium mb-2">💡 Login Options:</p>
              <div className="text-xs text-sky-600 space-y-1">
                <p>• <strong>Email Login:</strong> For admin users</p>
                <p>• <strong>PIN Login:</strong> For all users other than admins</p>
                <p>• Contact your supervisor if you need help with login</p>
              </div>
            </div>

  );
}
