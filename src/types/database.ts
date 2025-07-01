
        export interface Profile {
  id: string;
  user_id: string;
  organization_id: string;
  employee_id: string;
  full_name: string;
  designation?: string;
  mobile_number?: string;
  role: "super_admin" | "admin" | "manager" | "employee";
  created_at: string;
  updated_at: string;
  is_active: boolean;
  pin?: string;
  email?: string;
  department?: string;
  avatar_url?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  is_active: boolean;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Task {
  id: string;
  organization_id: string;
  client_id?: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority?: string;
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

export interface TaskPhoto {
  id: string;
  task_id: string;
  photo_url: string;
  caption?: string;
  created_at: string;
}

export interface EnrichedTask extends Task {
  clients?: Client;
  profiles?: Profile;
  photos: TaskPhoto[];
}

export interface ChatMessage {
  id: string;
  task_id: string;
  sender_id: string;
  message: string;
  message_type: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface OrganizationDetails extends Organization {
  userCount: number;
  taskCount: number;
  completedTasks: number;
}
