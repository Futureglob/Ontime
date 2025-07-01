import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ChatList from "@/components/chat/ChatList";
import ChatInterface from "@/components/chat/ChatInterface";
import { Task } from "@/types/database";
import { notificationService } from "@/services/notificationService";

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Initialize notifications when chat page loads
    notificationService.initialize();
  }, []);

  const handleSelectConversation = (task: Task) => {
    setSelectedTask(task);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    setShowChatList(true);
    setSelectedTask(null);
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please log in to access chat.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with your team about tasks and projects
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
          {/* Chat List - Always visible on desktop, conditional on mobile */}
          <div className={`${isMobile && !showChatList ? "hidden" : ""} md:block`}>
            <ChatList
              onSelectConversation={handleSelectConversation}
              selectedTaskId={selectedTask?.id}
            />
          </div>

          {/* Chat Interface - Takes remaining space */}
          <div className={`md:col-span-2 ${isMobile && showChatList ? "hidden" : ""}`}>
            <ChatInterface
              task={selectedTask}
              onClose={isMobile ? handleBackToList : undefined}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
