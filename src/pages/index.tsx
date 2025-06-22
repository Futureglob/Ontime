
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Head from "next/head";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>OnTime - Field Service Management</title>
          <meta name="description" content="Professional field service management platform" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <LoginForm />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>OnTime - Dashboard</title>
        <meta name="description" content="OnTime field service management dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <DashboardLayout />
    </>
  );
}
