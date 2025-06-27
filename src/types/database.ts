
import { Database } from "@/integrations/supabase/types";

// Database Types
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskPhoto = Database["public"]["Tables"]["task_photos"]["Row"];
export type TaskStatusHistory = Database["public"]["Tables"]["task_status_history"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export type TaskWithAssignee = Task & {
  assignee: Pick<Profile, "full_name" | "designation" | "mobile_number"> | null;
  assigner: Pick<Profile, "full_name"> | null;
};

export type MessageWithSender = Message & {
  sender: Pick<Profile, "full_name" | "designation">;
};

// Enums
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee"
}

export enum TaskStatus {
  ASSIGNED = "assigned",
  ACCEPTED = "accepted",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  RETURNED = "returned"
}

export enum PhotoType {
  CHECK_IN = "check_in",
  PROGRESS = "progress",
  COMPLETION = "completion"
}

// Request/Response Types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  task_type: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  client_info?: string;
  deadline?: string;
  assigned_to?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  notes?: string;
}

export interface CreatePhotoRequest {
  task_id: string;
  photo_type: PhotoType;
  photo_url: string;
  latitude?: number;
  longitude?: number;
}

export interface ProfileReference {
  full_name: string;
  designation: string;
  avatar_url?: string;
}
