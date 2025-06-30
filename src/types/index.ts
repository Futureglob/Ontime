import { Database } from "@/integrations/supabase/types";

export type UserRole = "org_admin" | "task_manager" | "employee" | "super_admin";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type TaskPhoto = Database["public"]["Tables"]["task_photos"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assigned_to_profile?: Profile | null;
  created_by_profile?: Profile | null;
  client?: Client | null;
  photos?: TaskPhoto[];
  task_type?: string | null;
};

// This User type seems to be a custom client-side model. It's different from Profile.
// It should be reviewed and reconciled with the Profile type in the future.
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
