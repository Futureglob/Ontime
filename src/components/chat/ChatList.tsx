import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService } from "@/services/messageService";
import { realtimeService } from "@/services/realtimeService";
import { ChatConversation } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface ChatListProps {
  selectedConversationId: string | null;
  onSelectConversation: (taskId: string) => void;
}

export default function ChatList({
  selectedConversationId,
  onSelectConversation,
}: ChatListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await messageService.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<Message>) => {
      // A new message should trigger a reload of conversations
      // to get updated last message and unread counts.
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        loadConversations();
      }
    },
    [loadConversations]
  );

  useEffect(() => {
    if (!user?.id) return;

    const subscription = realtimeService.subscribeToAllMessages(
      user.id,
      handleRealtimeUpdate
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, handleRealtimeUpdate]);

  const filteredConversations = conversations.filter((convo) => {
    const task = convo.task;
    const otherParticipant =
      task.created_by === user?.id
        ? task.assigned_to_profile
        : task.created_by_profile;

    return (
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      otherParticipant?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const getOtherParticipant = (convo: ChatConversation) => {
    if (!user) return null;
    const { task } = convo;
    return user.id === task.assigned_to
      ? task.created_by_profile
      : task.assigned_to_profile;
  };

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Messages</h2>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading chats...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No conversations found.
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((convo) => {
              const otherParticipant = getOtherParticipant(convo);
              return (
                <button
                  key={convo.task_id}
                  onClick={() => onSelectConversation(convo.task_id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                    selectedConversationId === convo.task_id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={otherParticipant?.avatar_url || undefined} />
                    <AvatarFallback>
                      {otherParticipant?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold truncate">
                        {otherParticipant?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(
                          convo.lastMessage.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex justify-between items-start">
                      <p className="text-sm truncate text-muted-foreground">
                        {convo.lastMessage.content}
                      </p>
                      {convo.unreadCount > 0 && (
                        <Badge className="h-5 w-5 flex items-center justify-center p-0">
                          {convo.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
