
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Send, 
  MessageSquare, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Image as ImageIcon,
  ExternalLink,
  Clock,
  CheckCheck,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "@/services/messageService";
import { realtimeService } from "@/services/realtimeService";
import { notificationService } from "@/services/notificationService";
import { Task } from "@/types/database";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  task_id: string;
  created_at: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_type?: string;
  sender?: {
    full_name: string;
    role: string;
    avatar_url?: string;
  };
}

interface ChatInterfaceProps {
  task?: Task & {
    assigned_to_profile?: { full_name: string; role: string; avatar_url?: string };
    assigned_by_profile?: { full_name: string; role: string; avatar_url?: string };
  };
  onClose?: () => void;
}

export default function ChatInterface({ task, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when task changes
  useEffect(() => {
    if (task?.id) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [task?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!task?.id) return;

    const subscription = realtimeService.subscribeToTaskMessages(
      task.id,
      handleNewMessage
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [task?.id]);

  const loadMessages = async () => {
    if (!task?.id) return;
    
    try {
      setLoading(true);
      const data = await messageService.getTaskMessages(task.id);
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
    if (payload.eventType === "INSERT" && payload.new) {
      const newMsg = payload.new as ChatMessage;
      
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Show notification if message is from someone else
      if (newMsg.sender_id !== user?.id) {
        notificationService.showNotification("New Message", {
          body: `${newMsg.sender?.full_name || "Someone"}: ${newMsg.content}`,
          tag: `message-${newMsg.id}`,
          icon: "/icons/icon-192x192.svg"
        });
      }

      // Mark as read if chat is open
      if (task?.id && newMsg.sender_id !== user?.id) {
        markMessagesAsRead();
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !task?.id || !user?.id || sending) return;

    try {
      setSending(true);
      await messageService.sendMessage(task.id, user.id, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!task?.id || !user?.id) return;
    
    try {
      await messageService.markMessagesAsRead(task.id, user.id);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const shareViaWhatsApp = () => {
    if (!task) return;
    
    const message = `Task Update: ${task.title}\nStatus: ${task.status}\nLocation: ${task.location || "Not specified"}\n\nView details in OnTime app.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherParticipant = () => {
    if (!task || !user) return null;
    
    if (user.id === task.assigned_to) {
      return task.assigned_by_profile;
    } else {
      return task.assigned_to_profile;
    }
  };

  const otherParticipant = getOtherParticipant();

  if (!task) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a task to start chatting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.avatar_url} />
              <AvatarFallback>
                {otherParticipant?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherParticipant?.full_name || "Unknown User"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {otherParticipant?.role} • Task: {task.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={shareViaWhatsApp}
              className="text-green-600 hover:text-green-700"
            >
              <ExternalLink className="h-4 w-4" />
              WhatsApp
            </Button>
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.sender_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.sender?.avatar_url} />
                        <AvatarFallback>
                          {message.sender?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {!isOwnMessage && !showAvatar && (
                      <div className="w-8" />
                    )}
                    
                    <div className={`max-w-[70%] ${isOwnMessage ? "order-1" : ""}`}>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        
                        {message.attachment_url && (
                          <div className="mt-2">
                            {message.attachment_type?.startsWith("image/") ? (
                              <img
                                src={message.attachment_url}
                                alt="Attachment"
                                className="max-w-full h-auto rounded"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-xs">Attachment</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${isOwnMessage ? "justify-end" : ""}`}>
                        <span>{formatTime(message.created_at)}</span>
                        {isOwnMessage && (
                          <div className="flex items-center">
                            {message.is_read ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        {isTyping && (
          <div className="text-xs text-muted-foreground mb-2">
            {otherParticipant?.full_name} is typing...
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            // Handle file upload
            const file = e.target.files?.[0];
            if (file) {
              console.log("File selected:", file.name);
              // TODO: Implement file upload
            }
          }}
        />
      </div>
    </Card>
  );
}
