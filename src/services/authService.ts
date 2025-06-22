import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  employeeId?: string;
  designation?: string;
  mobileNumber?: string;
  isActive?: boolean;
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile after successful login
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq("id", data.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        return { user: data.user, profile };
      }

      return { user: data.user, profile: null };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async signUp(email: string, password: string, userData?: Partial<AuthUser>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create profile after successful signup
    if (data.user && userData) {
      await this.createUserProfile(data.user.id, {
        ...userData,
        email: data.user.email || email,
      });
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      const profile = await this.getUserProfile(user.id);
      return { user, profile };
    }
    
    return { user: null, profile: null };
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      return null;
    }
  },

  async createUserProfile(userId: string, userData: Partial<AuthUser> & { email: string }) {
    // Get system organization ID for super admin
    let organizationId = userData.organizationId;
    
    if (userData.role === "super_admin") {
      const { data: systemOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", "System Administration")
        .single();
      
      organizationId = systemOrg?.id;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: userData.name || "User",
        role: userData.role || "employee",
        organization_id: organizationId,
        employee_id: userData.employeeId,
        designation: userData.designation,
        mobile_number: userData.mobileNumber,
        is_active: userData.isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;

    // If super admin, add to super_admins table
    // Temporarily comment out super_admins table interaction to resolve type errors
    // We can revisit this if a separate super_admins table is strictly needed
    // if (userData.role === "super_admin") {
    //   await supabase
    //     .from("super_admins") // This line causes a type error if super_admins is not in generated types
    //     .insert({
    //       user_id: userId,
    //       permissions: {
    //         can_manage_all: true,
    //         can_view_reports: true,
    //         can_manage_organizations: true,
    //         can_manage_users: true
    //       },
    //       created_by: userId
    //     });
    // }

    return data;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  }
};

export default authService;
