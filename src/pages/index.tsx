import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (isSuperAdmin) {
        window.location.replace("/superadmin");
      } else {
        router.replace("/profile");
      }
    }
  }, [user, loading, isSuperAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome to OnTime</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your field service management solution.
        </p>
        <div className="mt-8 space-x-4">
          <Button asChild>
            <Link href="/api/auth/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/superadmin">Super Admin Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
