import { useState, useEffect, useCallback } from "react";
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
    assigned_to_profile?: { full_name: string; designation: string; avatar_url?: string };
    assigned_by_profile?: { full_name: string; designation: string; avatar_url?: string };
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

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const count = await messageService.getUnreadMessageCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }, [user?.id]);

  const loadConversations = useCallback(async () => {
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
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
      loadUnreadCount();
    }
  }, [user?.id, loadConversations, loadUnreadCount]);

  const handleNewMessage = useCallback(() => {
    // Reload conversations and unread count when new message arrives
    loadConversations();
    loadUnreadCount();
  }, [loadConversations, loadUnreadCount]);

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
  }, [user?.id, handleNewMessage]);

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

  const getOtherParticipant = (conversationTask: Task & { assigned_to_profile?: { full_name: string; designation: string; avatar_url?: string }; assigned_by_profile?: { full_name: string; designation: string; avatar_url?: string } }) => {
    if (!user) return null;
    
    if (user.id === conversationTask.assigned_to) {
      return conversationTask.assigned_by_profile;
    } else {
      return conversationTask.assigned_to_profile;
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

  const getGroupedChats = () => {
    return filteredConversations.reduce((acc, chat) => {
      const key = chat.task.assigned_to === user.id ? chat.task.assigned_by : chat.task.assigned_to;
      if (key && !acc[key]) {
        acc[key] = {
          profile: getOtherParticipant(chat.task),
          tasks: [],
        };
      }
      if (key) {
        acc[key].tasks.push(chat);
      }
      return acc;
    }, {} as Record<string, { profile: { full_name: string; designation: string; avatar_url?: string } | null; tasks: ChatConversation[] }>);
  };

  const handleSelectChat = (task: Task) => {
    onSelectConversation(task);
  };

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
              {getGroupedChats().map((group) => {
                const { profile, tasks } = group;
                const isSelected = selectedTaskId === tasks[0].task_id;
                
                return (
                  <div
                    key={profile?.full_name || `group-${Date.now()}`}
                    onClick={() => handleSelectChat(tasks[0].task)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {profile?.full_name || "Unknown User"}
                          </h4>
                          {tasks[0].lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatTime(tasks[0].lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 truncate">
                          Task: {tasks[0].task.title}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge 
                            className={`text-xs ${getStatusColor(tasks[0].task.status || "")}`}
                          >
                            {tasks[0].task.status?.replace("_", " ").toUpperCase()}
                          </Badge>
                          
                          {tasks[0].unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {tasks[0].unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        {tasks[0].lastMessage && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {tasks[0].lastMessage.content}
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
