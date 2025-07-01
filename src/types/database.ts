
export type UserRole = "super_admin" | "admin" | "manager" | "employee";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type MessageType = "text" | "image" | "file";

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  organization_id?: string;
  employee_id?: string;
  full_name: string;
  designation?: string;
  mobile_number: string | null;
  bio: string | null;
  skills: string | null;
  address: string | null;
  emergency_contact: string | null;
  role: UserRole;
  is_active: boolean;
  pin?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string;
  organization_id: string;
  created_by: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface EnrichedTask extends Task {
  client?: Client;
  assigned_to_profile?: Profile;
  created_by_profile?: Profile;
}

export interface ChatMessage {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

export interface TaskPhoto {
  id: string;
  task_id: string;
  uploaded_by: string;
  photo_url: string;
  caption?: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
  uploaded_by_profile?: Profile;
}

export interface OrganizationDetails extends Organization {
  userCount: number;
  taskCount: number;
  completedTasks: number;
}
