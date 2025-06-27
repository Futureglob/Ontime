
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Users,
  Search,
  Phone,
  Video
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "@/services/messageService";
import type { MessageWithSender } from "@/services/messageService";
import { Task } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  taskId: string;
  task: Partial<Task>;
  lastMessage?: MessageWithSender;
  unreadCount: number;
  participants: string[];
}

export default function RealTimeMessaging() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user || !profile) return;
    
    try {
      setLoading(true);
      
      // Mock conversations for now
      const mockConversations: Conversation[] = [
        {
          taskId: "task-1",
          task: {
            id: "task-1",
            title: "Fix Network Issue",
            description: "Resolve connectivity problems in Building A",
            status: "in_progress",
            created_at: new Date().toISOString(),
            organization_id: profile.organization_id || "",
            assigned_to: user.id,
            assigned_by: "manager-1",
            location: "Building A",
            task_type: "maintenance"
          },
          lastMessage: {
            id: "msg-1",
            task_id: "task-1",
            sender_id: "manager-1",
            receiver_id: user.id,
            content: "Please update me on the progress",
            is_read: false,
            created_at: new Date().toISOString(),
            sender: {
              full_name: "John Manager",
              designation: "task_manager"
            }
          },
          unreadCount: 1,
          participants: [user.id, "manager-1"]
        },
        {
          taskId: "task-2",
          task: {
            id: "task-2",
            title: "Urgent: Fix leaky pipe in Unit 4B",
            status: "in_progress",
          },
          unreadCount: 0,
          participants: [user.id, "manager-2"]
        },
        {
          taskId: "task-3",
          task: {
            id: "task-3",
            title: "Client meeting preparation",
            status: "in_progress",
          },
          unreadCount: 0,
          participants: [user.id, "manager-3"]
        },
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  const loadMessages = useCallback(async (taskId: string) => {
    try {
      const taskMessages = await messageService.getTaskMessages(taskId);
      setMessages(taskMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (taskId: string) => {
    if (!user) return;
    
    try {
      await messageService.markMessagesAsRead(taskId, user.id);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.taskId === taskId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user && profile) {
      loadConversations();
    }
  }, [user, profile, loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
    }
  }, [selectedConversation, loadMessages, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && user) {
      const subscription = messageService.subscribeToTaskMessages(
        selectedConversation,
        (payload) => {
          if (payload.new) {
            const newMsg = payload.new as MessageWithSender;
            setMessages(prev => [...prev, newMsg]);
            
            setConversations(prev => 
              prev.map(conv => 
                conv.taskId === selectedConversation 
                  ? { ...conv, lastMessage: newMsg, unreadCount: 0 }
                  : conv
              )
            );
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation, user, profile]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      await messageService.sendMessage(
        selectedConversation,
        user.id,
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

  const filteredConversations = conversations.filter(conv =>
    conv.task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.task.description && conv.task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedConv = conversations.find(c => c.taskId === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg border">
      {/* Conversations List */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Messages</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[500px]">
          <div className="p-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.taskId}
                  onClick={() => setSelectedConversation(conv.taskId)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conv.taskId
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {conv.task.title?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">
                          {conv.task.title}
                        </h4>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage?.content || "No messages yet"}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {conv.task.status}
                        </Badge>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {selectedConv.task.title?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConv.task.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedConv.task.status} • {selectedConv.participants.length} participants
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
                {messages.map((message) => {
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
                              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
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
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a task conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
