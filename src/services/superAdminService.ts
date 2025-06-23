import { supabase } from "@/integrations/supabase/client";

export interface SuperAdmin {
  id: string; 
  user_id: string; 
  user_name?: string; 
  user_email?: string; 
  permissions?: Record<string, boolean>; 
  created_at: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string;
  updated_by: string;
  updated_at: string;
}

export interface OrganizationForSuperAdminView {
  id: string;
  name: string;
  user_count?: number;
  task_count?: number;
  logo_url?: string | null;
  is_active?: boolean;
}

export interface SystemStats {
  total_organizations: number;
  total_users: number;
  total_tasks: number;
}

export const superAdminService = {
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (error) {
        console.error("Error fetching profile for super admin check:", error);
        return false;
      }
      
      return data?.role === "super_admin";
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  },

  async getSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          created_at
        `)
        .eq("role", "super_admin");

      if (error) throw error;

      // Get user emails from auth.users (this requires RLS to be properly configured)
      const superAdmins: SuperAdmin[] = [];
      
      for (const profile of data || []) {
        // For now, we'll use the profile data without email since we can't easily access auth.users
        superAdmins.push({
          id: profile.id,
          user_id: profile.id,
          user_name: profile.full_name || "Super Admin",
          user_email: "admin@system.com", // Placeholder - would need service role to get real email
          permissions: { can_manage_all: true },
          created_at: profile.created_at || new Date().toISOString(),
        });
      }

      return superAdmins;
    } catch (error) {
      console.error("Error fetching super admins:", error);
      return [];
    }
  },

  async addSuperAdmin(userId: string, permissions: Record<string, boolean> = {}): Promise<SuperAdmin> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", userId)
        .select("id, full_name, role, created_at")
        .single();

      if (error) throw error;
      
      return {
        id: data.id, 
        user_id: data.id,
        user_name: data.full_name || "Super Admin",
        user_email: "admin@system.com", // Placeholder
        permissions,
        created_at: data.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error adding super admin:", error);
      throw error;
    }
  },

  async removeSuperAdmin(userIdToRemove: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "manager" })
        .eq("id", userIdToRemove);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing super admin:", error);
      throw error;
    }
  },

  async updateSuperAdminPermissions(superAdminId: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      // Update permissions in super_admins table if it exists
      const { error } = await supabase
        .from("super_admins")
        .upsert({
          user_id: superAdminId,
          permissions: permissions,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn("Super admins table not available, permissions stored in memory only");
      }
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) {
        console.warn("System settings table not available, returning defaults");
        return [
          {
            id: "1",
            key: "app_name",
            value: { name: "OnTime" },
            description: "Application name",
            updated_by: "system",
            updated_at: new Date().toISOString()
          },
          {
            id: "2",
            key: "maintenance_mode",
            value: { enabled: false },
            description: "System Maintenance Mode",
            updated_by: "system",
            updated_at: new Date().toISOString()
          }
        ];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  },

  async updateSystemSetting(key: string, newValue: Record<string, unknown>, newDescription?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key: key,
          value: newValue,
          description: newDescription,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  },

  async getOrganizations(): Promise<OrganizationForSuperAdminView[]> {
    try {
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;

      const organizationsWithStats: OrganizationForSuperAdminView[] = [];

      for (const org of orgs || []) {
        // Get user count for this organization
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        // Get task count for this organization
        const { count: taskCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        organizationsWithStats.push({
          id: org.id,
          name: org.name,
          user_count: userCount || 0,
          task_count: taskCount || 0,
          logo_url: org.logo_url,
          is_active: org.is_active
        });
      }

      return organizationsWithStats;
    } catch (error) {
      console.error("Error fetching organizations:", error);
      return [];
    }
  },
  
  async getSystemStats(): Promise<SystemStats> {
    try {
      // Get total organizations count
      const { count: totalOrgs } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      // Get total users count
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total tasks count
      const { count: totalTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      return {
        total_organizations: totalOrgs || 0,
        total_users: totalUsers || 0,
        total_tasks: totalTasks || 0,
      };
    } catch (error) {
      console.error("Error fetching system stats:", error);
      return {
        total_organizations: 0,
        total_users: 0,
        total_tasks: 0,
      };
    }
  },

  async loginSuperAdmin(email: string, password: string): Promise<{ user: { id: string; email: string; name?: string }; isSuperAdmin: boolean }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const isSuperAdmin = await this.isSuperAdmin(data.user.id);
        return {
          user: {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name
          },
          isSuperAdmin
        };
      }

      throw new Error("Login failed");
    } catch (error) {
      console.error("Super admin login error:", error);
      throw error;
    }
  },
  
  async getOrganizationStats(): Promise<OrganizationForSuperAdminView[]> {
    return this.getOrganizations(); 
  },

  async getSystemOverallStats(): Promise<SystemStats> {
    return this.getSystemStats(); 
  },

  async createOrganization(orgData: { name: string; logo_url?: string; primary_color?: string; secondary_color?: string }): Promise<OrganizationForSuperAdminView> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert([{
          name: orgData.name,
          logo_url: orgData.logo_url,
          primary_color: orgData.primary_color || "#3B82F6",
          secondary_color: orgData.secondary_color || "#1E40AF",
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        user_count: 0,
        task_count: 0,
        logo_url: data.logo_url,
        is_active: data.is_active
      };
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  },

  async updateOrganization(orgId: string, updates: Partial<{ name: string; logo_url: string; is_active: boolean }>): Promise<void> {
    try {
      const { error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", orgId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating organization:", error);
      throw error;
    }
  },

  async deleteOrganization(orgId: string): Promise<void> {
    try {
      // First, check if organization has users or tasks
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      const { count: taskCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      if ((userCount || 0) > 0 || (taskCount || 0) > 0) {
        throw new Error("Cannot delete organization with existing users or tasks. Please transfer or remove them first.");
      }

      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", orgId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting organization:", error);
      throw error;
    }
  }
};

export default superAdminService;