
import { useState } from "react";
import ChatList from "@/components/chat/ChatList";
import ChatInterface from "@/components/chat/ChatInterface";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ChatPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-80px)]">
        <div className="md:col-span-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-y-auto">
          <ChatList onSelectChat={setSelectedTaskId} />
        </div>
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-lg">
          {selectedTaskId ? (
            <ChatInterface taskId={selectedTaskId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
      