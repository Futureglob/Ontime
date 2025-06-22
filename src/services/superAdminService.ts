
import { supabase } from "@/integrations/supabase/client";

export interface SuperAdmin {
  id: string;
  user_id: string;
  permissions: Record<string, boolean>;
  created_at: string;
  created_by: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface SystemSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string;
  updated_by: string;
  updated_at: string;
}

export interface OrganizationStats {
  id: string;
  name: string;
  total_users: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  created_at: string;
}

export const superAdminService = {
  // Check if current user is super admin
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      // Use raw SQL query to avoid type issues
      const { data, error } = await supabase.rpc('check_super_admin', { user_id: userId });
      
      if (error) {
        console.error("Error checking super admin status:", error);
        // Fallback: check if user has admin role in profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();
        
        return profile?.role === "admin";
      }
      
      return !!data;
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  },

  // Get all super admins
  async getSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      // Fallback to getting admin users from profiles
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .eq("role", "admin");

      if (error) throw error;
      
      // Transform to SuperAdmin format
      return (data || []).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        permissions: {},
        created_at: profile.created_at,
        created_by: "system",
        user: {
          email: profile.email || "",
          full_name: profile.full_name || ""
        }
      }));
    } catch (error) {
      console.error("Error fetching super admins:", error);
      return [];
    }
  },

  // Add super admin
  async addSuperAdmin(userId: string, permissions: Record<string, boolean> = {}): Promise<SuperAdmin> {
    try {
      // Update user role to admin in profiles table
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        user_id: data.id,
        permissions,
        created_at: data.created_at,
        created_by: "system",
        user: {
          email: data.email || "",
          full_name: data.full_name || ""
        }
      };
    } catch (error) {
      console.error("Error adding super admin:", error);
      throw error;
    }
  },

  // Remove super admin
  async removeSuperAdmin(superAdminId: string): Promise<void> {
    try {
      // Update user role back to manager in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ role: "manager" })
        .eq("id", superAdminId);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing super admin:", error);
      throw error;
    }
  },

  // Update super admin permissions
  async updateSuperAdminPermissions(superAdminId: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      console.log("Permissions updated for:", superAdminId, permissions);
      // This would be implemented when we have proper super_admins table
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  // Get system settings
  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      // Return mock data for now
      return [
        {
          id: "1",
          key: "app_name",
          value: { name: "OnTime" },
          description: "Application name",
          updated_by: "system",
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  },

  // Update system setting
  async updateSystemSetting(key: string, value: Record<string, unknown>, description?: string): Promise<void> {
    try {
      console.log("System setting updated:", key, value, description);
      // This would be implemented when we have proper system_settings table
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  },

  // Get organization statistics
  async getOrganizationStats(): Promise<OrganizationStats[]> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, created_at");

      if (error) throw error;

      // Get counts for each organization
      const stats = await Promise.all((data || []).map(async (org) => {
        const [usersResult, tasksResult] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact" }).eq("organization_id", org.id),
          supabase.from("tasks").select("id, status", { count: "exact" }).eq("organization_id", org.id)
        ]);

        const tasks = tasksResult.data || [];
        return {
          id: org.id,
          name: org.name,
          created_at: org.created_at,
          total_users: usersResult.count || 0,
          total_tasks: tasksResult.count || 0,
          active_tasks: tasks.filter(task => 
            ["assigned", "accepted", "in_progress"].includes(task.status)
          ).length,
          completed_tasks: tasks.filter(task => 
            task.status === "completed"
          ).length
        };
      }));

      return stats;
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      return [];
    }
  },

  // Get system-wide analytics
  async getSystemAnalytics(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    recentActivity: Array<{
      type: string;
      description: string;
      timestamp: string;
      organization?: string;
    }>;
  }> {
    try {
      // Get basic counts
      const [orgsResult, usersResult, tasksResult] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("tasks").select("id, status", { count: "exact" })
      ]);

      const totalOrganizations = orgsResult.count || 0;
      const totalUsers = usersResult.count || 0;
      const totalTasks = tasksResult.count || 0;

      const tasks = tasksResult.data || [];
      const activeTasks = tasks.filter(task => 
        ["assigned", "accepted", "in_progress"].includes(task.status)
      ).length;
      const completedTasks = tasks.filter(task => 
        task.status === "completed"
      ).length;

      // Get recent activity (simplified for now)
      const recentActivity = [
        {
          type: "system",
          description: "System analytics generated",
          timestamp: new Date().toISOString(),
          organization: "System"
        }
      ];

      return {
        totalOrganizations,
        totalUsers,
        totalTasks,
        activeTasks,
        completedTasks,
        recentActivity
      };
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      throw error;
    }
  },

  // Manage organization (suspend/activate)
  async updateOrganizationStatus(organizationId: string, isActive: boolean): Promise<void> {
    try {
      console.log("Organization status updated:", organizationId, isActive);
      // This would be implemented when organizations table has is_active column
    } catch (error) {
      console.error("Error updating organization status:", error);
      throw error;
    }
  },

  // Get user activity across all organizations
  async getUserActivity(): Promise<Array<{
    user_id: string;
    user_name: string;
    organization: string;
    activity_type: string;
    description: string;
    timestamp: string;
  }>> {
    try {
      // This would need to be implemented based on activity logging
      // For now, return empty array
      return [];
    } catch (error) {
      console.error("Error fetching user activity:", error);
      throw error;
    }
  }
};

export default superAdminService;
