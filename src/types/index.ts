export type UserRole = "org_admin" | "task_manager" | "employee" | "super_admin";

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

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  clientInfo: {
    name: string;
    contact: string;
    email?: string;
  };
  deadline: Date;
  status: "assigned" | "accepted" | "in_progress" | "on_hold" | "completed" | "returned";
  assignedTo?: string;
  assignedBy: string;
  organizationId: string;
  priority: "low" | "medium" | "high";
  estimatedDuration: number;
  actualDuration?: number;
  photos: TaskPhoto[];
  checkInTime?: Date;
  checkOutTime?: Date;
  travelDistance?: number;
  travelDuration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskPhoto {
  id: string;
  taskId: string;
  url: string;
  type: "check_in" | "progress" | "completion";
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
  };
  caption?: string;
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
  data?: Record<string, unknown>; // Changed from any to Record<string, unknown>
  createdAt: Date;
}
