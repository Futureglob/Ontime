import { supabase } from "@/integrations/supabase/client";
// import type { Database } from "@/integrations/supabase/types"; // Ensure this line is removed or stays commented

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

const MOCK_ORGANIZATIONS: OrganizationForSuperAdminView[] = [
  { id: "org1", name: "Tech Solutions Inc.", user_count: 50, task_count: 200, logo_url: "https://via.placeholder.com/40", is_active: true },
  { id: "org2", name: "Green Energy Co.", user_count: 30, task_count: 150, logo_url: null, is_active: true },
  { id: "org3", name: "HealthFirst Clinic", user_count: 75, task_count: 300, logo_url: "https://via.placeholder.com/40", is_active: false },
];

const MOCK_SUPER_ADMINS: SuperAdmin[] = [
  { id: "sa1", user_id: "user_sa1", user_name: "Super Alice", user_email: "alice@super.system", created_at: new Date().toISOString(), permissions: { can_manage_all: true } },
  { id: "sa2", user_id: "user_sa2", user_name: "Super Bob", user_email: "bob@super.system", created_at: new Date().toISOString(), permissions: { can_view_reports: true } },
];

const MOCK_SYSTEM_STATS: SystemStats = {
  total_organizations: MOCK_ORGANIZATIONS.length,
  total_users: 155, 
  total_tasks: 650,  
};

interface ProfileData {
    id: string;
    full_name: string | null;
    role: string | null;
    created_at?: string;
    // email?: string; // email is not directly on profiles table
}


export const superAdminService = {
  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const {  data, error: profileError } = await supabase // Ensure 'data' is used here
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile for super admin check:", profileError);
        return false;
      }
      
      return data?.role === "admin"; // Ensure 'data' is used here
    } catch (error) {
      console.error("Error checking super admin status:", error);
      return false;
    }
  },

  async getSuperAdmins(): Promise<SuperAdmin[]> {
    console.log("superAdminService.getSuperAdmins called");
    return MOCK_SUPER_ADMINS;
  },

  async addSuperAdmin(userId: string, permissions: Record<string, boolean> = {}): Promise<SuperAdmin> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId)
        .select("id, full_name, role, created_at") 
        .single();

      if (error) throw error;
      
      const p = data as ProfileData;
      // This is a simplified mapping. In a real scenario, you might need to fetch user_email separately
      // or ensure full_name is sufficient for user_name.
      return {
        id: p.id, 
        user_id: p.id,
        user_name: p.full_name || "N/A",
        // user_email: "fetched_email@example.com", // Placeholder: email needs to be fetched if required
        permissions,
        created_at: p.created_at || new Date().toISOString(),
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
      console.error("Error removing super admin (revoking admin role):", error);
      throw error;
    }
  },

  async updateSuperAdminPermissions(superAdminId: string, permissions: Record<string, boolean>): Promise<void> {
    try {
      console.log("Permissions update called for (placeholder):", superAdminId, permissions);
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      console.warn("'getSystemSettings' is returning mock data.");
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
    } catch (error) {
      console.error("Error fetching system settings:", error);
      return [];
    }
  },

  async updateSystemSetting(key: string, newValue: Record<string, unknown>, newDescription?: string): Promise<void> {
    try {
      console.warn(`'updateSystemSetting' for key '${key}' with value '${JSON.stringify(newValue)}' and description '${newDescription}' is a placeholder.`);
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  },

  async getOrganizations(): Promise<OrganizationForSuperAdminView[]> {
    console.log("superAdminService.getOrganizations called");
    return MOCK_ORGANIZATIONS;
  },
  
  async getSystemStats(): Promise<SystemStats> {
    console.log("superAdminService.getSystemStats called");
    return MOCK_SYSTEM_STATS;
  },

  async loginSuperAdmin(email: string, password: string): Promise<{ user: { id: string; email: string; name?: string }; isSuperAdmin: boolean }> { // Type for user is specific
    console.log("superAdminService.loginSuperAdmin called with", email);
    if (email === "superadmin@system.com" && password === "password123") {
      return { user: { id: "mock_sa_user_id", email, name: "Mock Super Admin" }, isSuperAdmin: true };
    }
    throw new Error("Invalid super admin credentials");
  },
  
  async getOrganizationStats(): Promise<OrganizationForSuperAdminView[]> {
    return this.getOrganizations(); 
  },

  async getSystemOverallStats(): Promise<SystemStats> {
    return this.getSystemStats(); 
  }
};

export default superAdminService;
