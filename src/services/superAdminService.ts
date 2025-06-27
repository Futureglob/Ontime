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
      // Since super_admins table is not in generated types, we'll store permissions in profiles table
      // or handle this functionality differently
      console.log("Super admin permissions would be updated:", { superAdminId, permissions });
      // For now, we'll just log this - in a real implementation, you might want to:
      // 1. Add a permissions column to profiles table
      // 2. Create the super_admins table and regenerate types
      // 3. Use a different approach for permissions
    } catch (error) {
      console.error("Error updating super admin permissions:", error);
      throw error;
    }
  },

  async getSystemSettings(): Promise<SystemSettings[]> {
    try {
      // Since system_settings table is not in generated types, return default settings
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
        },
        {
          id: "3",
          key: "user_registration",
          value: { enabled: true },
          description: "Allow new user registration",
          updated_by: "system",
          updated_at: new Date().toISOString()
        },
        {
          id: "4",
          key: "email_notifications",
          value: { enabled: true },
          description: "Send email notifications",
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
      // Since system_settings table is not in generated types, we'll just log this
      console.log("System setting would be updated:", { key, newValue, newDescription });
      // For now, we'll just log this - in a real implementation, you might want to:
      // 1. Create the system_settings table and regenerate types
      // 2. Use a different approach for system settings
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
          is_active: true // Default to true since field doesn't exist in current schema
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

  async createOrganization(orgData: { 
    name: string; 
    logo_url?: string; 
    primary_color?: string; 
    secondary_color?: string;
    contact_person?: string;
    contact_email?: string;
  }): Promise<OrganizationForSuperAdminView> {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .insert([{
          name: orgData.name,
          logo_url: orgData.logo_url,
          primary_color: orgData.primary_color || "#3B82F6",
          secondary_color: orgData.secondary_color || "#1E40AF",
          contact_person: orgData.contact_person,
          contact_email: orgData.contact_email,
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
        is_active: true
      };
    } catch (error) {
      console.error("Error creating organization:", error);
      throw error;
    }
  },

  async createOrganizationWithAdmin(orgData: { 
    name: string; 
    logo_url?: string; 
    primary_color?: string; 
    secondary_color?: string;
    contact_person?: string;
    contact_email?: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_employee_id?: string;
    admin_mobile?: string;
  }): Promise<OrganizationForSuperAdminView> {
    try {
      // Validate inputs first
      if (!orgData.name.trim()) {
        throw new Error("Organization name is required");
      }
      
      if (!orgData.admin_email.trim() || !orgData.admin_password.trim()) {
        throw new Error("Admin email and password are required");
      }
      
      if (orgData.admin_password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(orgData.admin_email)) {
        throw new Error("Please enter a valid email address");
      }

      console.log("Creating organization with data:", {
        name: orgData.name,
        admin_email: orgData.admin_email,
        password_length: orgData.admin_password.length
      });

      // First, create the organization
      const { data: orgResult, error: orgError } = await supabase
        .from("organizations")
        .insert([{
          name: orgData.name.trim(),
          logo_url: orgData.logo_url?.trim() || null,
          primary_color: orgData.primary_color || "#3B82F6",
          secondary_color: orgData.secondary_color || "#1E40AF",
          contact_person: orgData.contact_person?.trim() || null,
          contact_email: orgData.contact_email?.trim() || null,
          is_active: true
        }])
        .select()
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      console.log("Organization created successfully:", orgResult);

      // Create the organization admin user with improved error handling
      const signUpData = {
        email: orgData.admin_email.trim(),
        password: orgData.admin_password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: orgData.admin_name.trim(),
            role: 'org_admin',
            organization_id: orgResult.id
          }
        }
      };

      console.log("Attempting to create auth user with:", {
        email: signUpData.email,
        password_length: signUpData.password.length,
        metadata: signUpData.options.data
      });

      const { data: authResult, error: authError } = await supabase.auth.signUp(signUpData);

      if (authError) {
        console.error("Auth signup error:", authError);
        // Clean up the organization if user creation fails
        await supabase.from("organizations").delete().eq("id", orgResult.id);
        
        // Provide more specific error messages based on common Supabase auth errors
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          throw new Error(`Email ${orgData.admin_email} is already registered. Please use a different email.`);
        } else if (authError.message.includes("password") || authError.message.includes("Password")) {
          throw new Error("Password must be at least 6 characters long and contain valid characters.");
        } else if (authError.message.includes("email") || authError.message.includes("Email")) {
          throw new Error("Please enter a valid email address.");
        } else if (authError.message.includes("rate limit") || authError.message.includes("too many")) {
          throw new Error("Too many signup attempts. Please wait a moment and try again.");
        } else {
          throw new Error(`Failed to create admin user: ${authError.message}`);
        }
      }

      console.log("Auth user created successfully:", authResult.user?.id);

      if (authResult.user) {
        // Wait for the auth user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create the admin profile with retry logic
        const profileData = {
          id: authResult.user.id,
          full_name: orgData.admin_name.trim(),
          role: "org_admin" as const,
          organization_id: orgResult.id,
          employee_id: orgData.admin_employee_id?.trim() || `ADMIN-${Date.now()}`,
          designation: "Organization Administrator",
          mobile_number: orgData.admin_mobile?.trim() || null,
          is_active: true,
        };

        console.log("Creating profile with data:", profileData);

        let profileCreated = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!profileCreated && retryCount < maxRetries) {
          try {
            const { data: profileResult, error: profileError } = await supabase
              .from("profiles")
              .insert(profileData)
              .select()
              .single();

            if (profileError) {
              console.error(`Profile creation error (attempt ${retryCount + 1}):`, profileError);
              
              if (retryCount === maxRetries - 1) {
                // Final attempt failed, clean up
                await supabase.from("organizations").delete().eq("id", orgResult.id);
                throw new Error(`Failed to create admin profile after ${maxRetries} attempts: ${profileError.message}`);
              }
              
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
            } else {
              console.log("Profile created successfully:", profileResult);
              profileCreated = true;
            }
          } catch (error) {
            console.error(`Profile creation attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            
            if (retryCount >= maxRetries) {
              await supabase.from("organizations").delete().eq("id", orgResult.id);
              throw new Error(`Failed to create admin profile after ${maxRetries} attempts: ${error}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        // Show success message with email confirmation info
        console.log("Organization and admin created successfully. Admin needs to confirm email before login.");
      }

      return {
        id: orgResult.id,
        name: orgResult.name,
        user_count: 1, // The admin we just created
        task_count: 0,
        logo_url: orgResult.logo_url,
        is_active: true
      };
    } catch (error) {
      console.error("Error creating organization with admin:", error);
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
