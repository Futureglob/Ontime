import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Search, 
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "@/services/messageService";
import { realtimeService } from "@/services/realtimeService";
import { Task } from "@/types/database";

interface ChatConversation {
  task_id: string;
  task: Task & {
    assigned_to_profile?: { full_name: string; role: string; avatar_url?: string };
    assigned_by_profile?: { full_name: string; role: string; avatar_url?: string };
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

interface ChatListProps {
  onSelectConversation: (task: Task) => void;
  selectedTaskId?: string;
}

export default function ChatList({ onSelectConversation, selectedTaskId }: ChatListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      loadUnreadCount();
    }
  }, [user?.id]);

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToTable(
      "messages",
      `sender_id.neq.${user.id}`,
      handleNewMessage,
      "INSERT"
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await messageService.getTaskConversations(user.id);
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const count = await messageService.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleNewMessage = () => {
    // Reload conversations and unread count when new message arrives
    loadConversations();
    loadUnreadCount();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getOtherParticipant = (task: Task) => {
    if (!user) return null;
    
    if (user.id === task.assigned_to) {
      return task.assigned_by_profile;
    } else {
      return task.assigned_to_profile;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-blue-100 text-blue-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "on_hold": return "bg-orange-100 text-orange-800";
      case "returned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOtherParticipant(conv.task)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading conversations...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32 px-4">
              <div className="text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs">Start by assigning or accepting tasks</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation.task);
                const isSelected = selectedTaskId === conversation.task_id;
                
                return (
                  <div
                    key={conversation.task_id}
                    onClick={() => onSelectConversation(conversation.task)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={otherParticipant?.avatar_url} />
                        <AvatarFallback>
                          {otherParticipant?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {otherParticipant?.full_name || "Unknown User"}
                          </h4>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTime(conversation.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          Task: {conversation.task.title}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            className={`text-xs ${getStatusColor(conversation.task.status || "")}`}
                          >
                            {conversation.task.status?.replace("_", " ").toUpperCase()}
                          </Badge>
                          
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
