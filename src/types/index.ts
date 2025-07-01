import { Database } from "@/integrations/supabase/types";

export type UserRole = "org_admin" | "task_manager" | "employee" | "super_admin";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type TaskPhoto = Database["public"]["Tables"]["task_photos"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Credits = Database["public"]["Tables"]["credits"]["Row"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type EnrichedTask = Task & {
  assigned_to_profile?: Profile | null;
  created_by_profile?: Profile | null;
  client?: Client | null;
  photos?: TaskPhoto[];
  task_type?: string | null;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  employeeId?: string;
  designation?: string;
  mobileNumber?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: "text" | "image" | "location";
  attachments?: string[];
}

export interface MessageWithSender {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: string | null;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface ChatConversation {
  task_id: string;
  task: EnrichedTask;
  lastMessage: MessageWithSender;
  unreadCount: number;
}

export interface TaskWithChatData extends Task {
  messages: { count: number }[];
  participants: Profile;
}

export interface PerformanceMetrics {
  userId: string;
  organizationId: string;
  period: "daily" | "weekly" | "monthly";
  tasksCompleted: number;
  averageResponseTime: number;
  averageCompletionTime: number;
  totalTravelDistance: number;
  totalWorkingHours: number;
  completionRate: number;
  date: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "task_assigned" | "task_updated" | "message" | "reminder";
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

export interface Photo {
  id: string;
  task_id: string;
  user_id: string;
  url: string;
  created_at: string;
}

export interface CreditTransaction {
  amount: number;
  operation: 'add' | 'subtract';
  description: string;
}
