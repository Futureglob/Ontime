
import { supabase } from "@/integrations/supabase/client";
import { faker } from "@faker-js/faker";

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
        .eq("user_id", userId)
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
        .select(
          `
          id,
          user_id,
          full_name,
          role,
          created_at
        `
        )
        .eq("role", "super_admin");

      if (error) throw error;

      const superAdmins: SuperAdmin[] = (data || []).map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        user_name: profile.full_name || "Super Admin",
        user_email: "admin@system.com", // Placeholder
        permissions: { can_manage_all: true },
        created_at: profile.created_at || new Date().toISOString(),
      }));

      return superAdmins;
    } catch (error) {
      console.error("Error fetching super admins:", error);
      return [];
    }
  },

  async addSuperAdmin(
    userId: string,
    permissions: Record<string, boolean> = {}
  ): Promise<SuperAdmin> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("user_id", userId)
        .select("id, user_id, full_name, role, created_at")
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
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
        .update({ role: "org_admin" }) // Demote to org_admin
        .eq("user_id", userIdToRemove);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing super admin:", error);
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
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

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
          is_active: true, // Assuming active, schema doesn't have this field
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
      const { count: totalOrgs } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

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

  async createOrganizationWithAdmin(orgData: {
    name: string;
    logo_url?: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_mobile?: string;
  }): Promise<OrganizationForSuperAdminView> {
    // 1. Create the organization
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: orgData.name, logo_url: orgData.logo_url })
      .select()
      .single();

    if (orgError || !newOrg) {
      throw new Error(`Failed to create organization: ${orgError?.message}`);
    }

    // 2. Create the admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: orgData.admin_email,
      password: orgData.admin_password,
      options: {
        data: {
          full_name: orgData.admin_name,
          role: "org_admin",
          organization_id: newOrg.id,
        },
      },
    });

    if (authError) {
      // Clean up created organization if admin creation fails
      await supabase.from("organizations").delete().eq("id", newOrg.id);
      throw new Error(`Failed to create admin user: ${authError.message}`);
    }

    if (!authData.user) {
      await supabase.from("organizations").delete().eq("id", newOrg.id);
      throw new Error("Admin user was not created in authentication system.");
    }
    const adminUser = authData.user;

    // 3. Create the admin's profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: adminUser.id,
        full_name: orgData.admin_name,
        role: "org_admin",
        organization_id: newOrg.id,
        employee_id: `ADMIN-${faker.string.alphanumeric(4).toUpperCase()}`,
        designation: "Organization Admin",
        mobile_number: orgData.admin_mobile,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup created auth user and organization if profile creation fails
      await supabase.auth.admin.deleteUser(adminUser.id);
      await supabase.from("organizations").delete().eq("id", newOrg.id);
      throw new Error(`Failed to create admin profile: ${profileError.message}`);
    }

    return {
      id: newOrg.id,
      name: newOrg.name,
      user_count: 1,
      task_count: 0,
      logo_url: newOrg.logo_url,
      is_active: true,
    };
  },
};

export default superAdminService;
