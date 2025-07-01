import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Users,
  Phone,
  Video
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService, MessageWithSender } from "@/services/messageService";
import { taskService } from "@/services/taskService";
import { EnrichedTask } from "@/types";

interface RealTimeMessagingProps {
  taskId: string;
}

export default function RealTimeMessaging({ taskId }: RealTimeMessagingProps) {
  const { user, currentProfile } = useAuth();
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [task, setTask] = useState<EnrichedTask | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [taskData, messagesData] = await Promise.all([
        taskService.getTask(id),
        messageService.getTaskMessages(id),
      ]);
      setTask(taskData);
      setMessages(messagesData);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      await messageService.markMessagesAsRead(id, user.id);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.task_id === id && msg.receiver_id === user.id ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user && currentProfile) {
      loadData(taskId);
    }
  }, [user, currentProfile, taskId, loadData]);

  useEffect(() => {
    if (user && currentProfile) {
      markMessagesAsRead(taskId);
    }
  }, [user, currentProfile, taskId, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && currentProfile) {
      const subscription = messageService.subscribeToTaskMessages(
        taskId,
        (payload) => {
          if (payload.new) {
            const newMsg = payload.new as MessageWithSender;
            setMessages(prev => [...prev, newMsg]);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [taskId, user, currentProfile]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !taskId || !user || !task) return;

    const receiverId = user.id === task.assignee_id ? task.created_by : task.assignee_id;
    if (!receiverId) {
      console.error("Could not determine the receiver of the message.");
      return;
    }

    try {
      await messageService.sendMessage(
        taskId,
        user.id,
        receiverId,
        newMessage.trim()
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredMessages = messages.filter(msg =>
    msg.content?.toLowerCase().includes(newMessage.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg border">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {messages.length > 0 ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {currentProfile?.full_name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{currentProfile?.full_name || "Unknown User"}</h3>
                    <p className="text-sm text-gray-500">
                      {currentProfile?.designation || "Unknown Designation"} • {currentProfile?.organization_id || "Unknown Organization"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredMessages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={isOwn ? "bg-blue-100 text-blue-600" : "bg-gray-100"}>
                            {message.sender?.full_name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-3 ${
                          isOwn 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-100 text-gray-900"
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            isOwn ? "text-blue-100" : "text-gray-500"
                          }`}>
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {message.created_at ? new Date(message.created_at).toISOString() : "Unknown"}
                            </span>
                            {isOwn && message.is_read && (
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages found
              </h3>
              <p className="text-gray-500">
                There are no messages for this task yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
