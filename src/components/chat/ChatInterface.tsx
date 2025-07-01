import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import messageService from "@/services/messageService";
import type { ChatMessage } from "@/services/messageService";
import realtimeService from "@/services/realtimeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format } from "date-fns";

interface ChatInterfaceProps {
  taskId: string;
}

export default function ChatInterface({ taskId }: ChatInterfaceProps) {
  const { user, currentProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (user) {
        try {
          const fetchedMessages = await messageService.getTaskMessages(taskId);
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
    };

    fetchMessages();

    const subscription = realtimeService.subscribeToTaskMessages(taskId, (payload) => {
  if (payload.eventType === 'INSERT' && payload.new) {
    const newMessage: ChatMessage = {
      id: payload.new.id,
      content: payload.new.content,
      sender: payload.new.sender_id,
      created_at: payload.new.created_at,
      task_id: payload.new.task_id,
      is_read: payload.new.is_read
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }
});

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentProfile) return;

    try {
      await messageService.sendMessage(taskId, currentProfile.id, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.sender.full_name === currentProfile?.full_name ? "justify-end" : ""
              }`}
            >
              {message.sender.full_name !== currentProfile?.full_name && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatar_url} />
                  <AvatarFallback>
                    {message.sender.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                  message.sender.full_name === currentProfile?.full_name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-right opacity-70 mt-1">
                  {format(new Date(message.created_at), "p")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
