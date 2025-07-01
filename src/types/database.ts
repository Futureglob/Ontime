export type UserRole = "super_admin" | "admin" | "manager" | "employee";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
  owner_id?: string;
  is_active?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  organization_id: string;
  employee_id: string;
  full_name: string;
  designation?: string;
  mobile_number?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_location_lat?: number;
  last_location_lng?: number;
  last_location_updated?: string;
  pin?: string;
  pin_attempts?: number;
  pin_locked_until?: string;
  avatar_url?: string;
}

export interface Task {
  id: string;
  organization_id: string;
  client_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedTask extends Task {
  assigned_to_profile?: Profile;
  created_by_profile?: Profile;
  client?: Client;
}

export interface ChatMessage {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type?: string;
  sender?: Profile;
}

export interface OrganizationDetails extends Organization {
  userCount: number;
  taskCount: number;
  completedTasks: number;
}

export interface Credits {
  id: string;
  organization_id: string;
  total_credits: number;
  used_credits: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  organization_id: string;
  amount: number;
  type: "purchase" | "usage" | "refund";
  description?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  task_id: string;
  user_id: string;
  photo_url: string;
  photo_type?: string;
  created_at: string;
}

export interface TaskSummary {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}
