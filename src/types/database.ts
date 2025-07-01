
        export interface Profile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  organization_id: string;
  role: "super_admin" | "admin" | "manager" | "employee";
  employee_id?: string;
  designation?: string;
  mobile_number?: string;
  is_active?: boolean;
  user_id: string;
}

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  owner_id: string;
  is_active: boolean;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  credits: number;
}

export interface OrganizationDetails extends Organization {
  userCount: number;
  taskCount: number;
  completedTasks: number;
}

export interface Client {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  organization_id: string;
}

export interface Task {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  due_date: string;
  assigned_to: string;
  organization_id: string;
  client_id: string;
}

export interface EnrichedTask extends Task {
  clients: Client | null;
  profiles: Profile | null;
}

export interface TaskSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}
      