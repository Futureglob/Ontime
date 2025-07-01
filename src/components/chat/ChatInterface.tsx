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
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      if (user) {
        try {
          const fetchedMessages = await messageService.getMessages(taskId);
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
    };

    fetchMessages();

    const subscription = realtimeService.subscribeToMessages(taskId, (newMessageData) => {
      setMessages((prevMessages) => [...prevMessages, newMessageData]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [taskId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !profile) return;

    try {
      await messageService.sendMessage(taskId, profile.id, newMessage);
      setNewMessage("");
      // The realtime subscription should handle updating the message list
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${
                message.sender.full_name === profile?.full_name ? "justify-end" : ""
              }`}
            >
              {message.sender.full_name !== profile?.full_name && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={message.sender.avatar_url} />
                  <AvatarFallback>
                    {message.sender.full_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                  message.sender.full_name === profile?.full_name
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
