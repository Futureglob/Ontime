import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User, KeyRound } from "lucide-react";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/router";
import { devDataService } from "@/services/devDataService";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const pinSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      devDataService.setupTestEmployees();
    }
  }, []);

  const handleForgotPin = () => {
    const employeeId = pinForm.getValues("employeeId");
    if (!employeeId) {
      pinForm.setError("employeeId", { message: "Please enter your Employee ID first" });
      return;
    }
    alert(`PIN reset request for Employee ID: ${employeeId}\n\nYour request has been sent to the administrator. You will receive your new PIN orally from your supervisor.`);
  };

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "An Error Occurred",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onPinSubmit(values: z.infer<typeof pinSchema>) {
    setLoading(true);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "An Error Occurred",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
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
                    <label htmlFor="email-login" className="text-sm font-medium text-sky-800">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 border-sky-200 focus:border-sky-400"
                        {...form.register("email")}
                      />
                    </div>
                    {form.formState.errors.email && <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="password-login" className="text-sm font-medium text-sky-800">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="password-login"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 border-sky-200 focus:border-sky-400"
                        {...form.register("password")}
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
                    {form.formState.errors.password && <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>}
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
                          authService.resetPassword(email).then(({ error }) => {
                            if (error) {
                              toast({ title: "Error", description: error.message, variant: "destructive" });
                            } else {
                              toast({ title: "Success", description: "Password reset email sent." });
                            }
                          });
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
                        type="text"
                        placeholder="Enter your Employee ID"
                        className="pl-10 border-sky-200 focus:border-sky-400 uppercase"
                        {...pinForm.register("employeeId")}
                      />
                    </div>
                    {pinForm.formState.errors.employeeId && <p className="text-sm text-red-500 mt-1">{pinForm.formState.errors.employeeId.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="pin" className="text-sm font-medium text-sky-800">PIN</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sky-400 h-4 w-4" />
                      <Input
                        id="pin"
                        type={showPin ? "text" : "password"}
                        placeholder="Enter your 6-digit PIN"
                        className="pl-10 pr-10 border-sky-200 focus:border-sky-400 text-center text-lg tracking-widest"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...pinForm.register("pin")}
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
                    {pinForm.formState.errors.pin && <p className="text-sm text-red-500 mt-1">{pinForm.formState.errors.pin.message}</p>}
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
