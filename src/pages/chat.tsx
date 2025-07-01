
        import { useAuth } from "@/contexts/AuthContext";
        import DashboardLayout from "@/components/layout/DashboardLayout";
        import ChatInterface from "@/components/chat/ChatInterface";
        import LoginForm from "@/components/auth/LoginForm";

        export default function ChatPage() {
          const { user, loading } = useAuth();

          if (loading) {
            return (
              <div className="flex h-screen items-center justify-center">
                <p>Loading...</p>
              </div>
            );
          }

          if (!user) {
            return <LoginForm />;
          }

          return (
            <DashboardLayout>
              <ChatInterface />
            </DashboardLayout>
          );
        }
      