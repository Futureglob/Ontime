
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
      const { data, error } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  },

  // Get all super admins
  async getSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      const { data, error } = await supabase
        .from("super_admins")
        .select(`
          *,
          user:profiles!super_admins_user_id_fkey(
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching super admins:", error);
      throw error;
    }
  },

  // Add super admin
  async addSuperAdmin(userId: string, permissions: Record<string, boolean> = {}): Promise<SuperAdmin> {
    try {
      const { data, error } = await supabase
        .from("super_admins")
        .insert([
          {
            user_id: userId,
            permissions,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding super admin:", error);
      throw error;
    }
  },

  // Remove super admin
  async removeSuperAdmin(superAdminId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("super_admins")
        .delete()
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
      const { error } = await supabase
        .from("super_admins")
        .update({ permissions })
        .eq("id", superAdminId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  // Get system settings
  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching system settings:", error);
      throw error;
    }
  },

  // Update system setting
  async updateSystemSetting(key: string, value: Record<string, unknown>, description?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key,
          value,
          description,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;
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
        .select(`
          id,
          name,
          created_at,
          profiles(count),
          tasks(count, status)
        `);

      if (error) throw error;

      // Transform data to include statistics
      const stats = data?.map(org => ({
        id: org.id,
        name: org.name,
        created_at: org.created_at,
        total_users: org.profiles?.length || 0,
        total_tasks: org.tasks?.length || 0,
        active_tasks: org.tasks?.filter(task => 
          ["assigned", "accepted", "in_progress"].includes(task.status)
        ).length || 0,
        completed_tasks: org.tasks?.filter(task => 
          task.status === "completed"
        ).length || 0
      })) || [];

      return stats;
    } catch (error) {
      console.error("Error fetching organization stats:", error);
      throw error;
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
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: isActive })
        .eq("id", organizationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating organization status:", error);
      throw error;
    }
  },

  // Get user activity across all organizations
  async getUserActivity(limit: number = 50): Promise<Array<{
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
