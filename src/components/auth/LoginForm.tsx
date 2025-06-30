import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const pinSchema = z.object({
  employeeId: z.string().min(1),
  pin: z.string().min(6).max(6),
});

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPinLogin, setIsPinLogin] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pinForm = useForm<z.infer<typeof pinSchema>>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      employeeId: "",
      pin: "",
    },
  });

  const [activeTab, setActiveTab] = useState("email");
  
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: ""
  });

  const [pinFormData, setPinFormData] = useState({
    employeeId: "",
    pin: ""
  });

  // Setup test data on component mount (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      devDataService.setupTestEmployees();
    }
  }, []);

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

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const { error } = await authService.login(values.email, values.password);
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: "An Error Occurred",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function onPinSubmit(values: z.infer<typeof pinSchema>) {
    try {
      const { error } = await authService.loginWithPin(values.employeeId, values.pin);
      if (error) {
        toast({
          title: "PIN Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
        router.push('/');
      }
    } catch (error: any) {
      toast({
        title: "An Error Occurred",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Temporarily removed logo to fix page loading issue */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <h2 className="text-3xl font-extrabold text-sky-900">
              OnTime - Sign in
            </h2>
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

              <TabsContent value="email">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-sky-800">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="email"
                        name="email"
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
                    <label htmlFor="password" className="text-sm font-medium text-sky-800">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="password"
                        name="password"
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
                <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="employeeId" className="text-sm font-medium text-sky-800">Employee ID</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="employeeId"
                        name="employeeId"
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
                    <label htmlFor="pin" className="text-sm font-medium text-sky-800">PIN</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="pin"
                        name="pin"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
