
    import { supabase } from "@/integrations/supabase/client";
    import type { Organization, OrganizationDetails, Profile } from "@/types/database";

    const organizationManagementService = {
      async getEmployees(organizationId: string): Promise<Profile[]> {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("organization_id", organizationId);

        if (error) throw error;
        return (data as Profile[]) || [];
      },

      async addEmployee(employeeData: {
        email: string;
        fullName: string;
        role: Profile["role"];
        employeeId: string;
        organizationId: string;
        designation?: string;
        mobileNumber?: string;
      }) {
        // This function has admin privileges. Use with caution.
        const {  { user }, error: authError } = await supabase.auth.admin.createUser({
          email: employeeData.email,
          password: Math.random().toString(36).slice(-8), // auto-generates a random password
          email_confirm: true,
          user_meta {
            full_name: employeeData.fullName,
            role: employeeData.role,
          },
        });

        if (authError) throw authError;
        if (!user) throw new Error("User creation failed.");

        const {  profile, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: user.id, // Ensure profile id matches user id
            organization_id: employeeData.organizationId,
            full_name: employeeData.fullName,
            employee_id: employeeData.employeeId,
            role: employeeData.role,
            designation: employeeData.designation,
            mobile_number: employeeData.mobileNumber,
          })
          .select()
          .single();

        if (profileError) {
          // If profile creation fails, delete the created auth user
          await supabase.auth.admin.deleteUser(user.id);
          throw profileError;
        }
        return profile;
      },

      async updateEmployee(profileId: string, updates: Partial<Profile>): Promise<Profile> {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", profileId)
          .select()
          .single();

        if (error) throw error;
        return data as Profile;
      },

      async deleteEmployee(profileId: string): Promise<boolean> {
        // Note: This only deletes the profile, not the auth user.
        // You might want to delete the auth user separately.
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", profileId);

        if (error) throw error;
        return true;
      },

      async getOrganizationSettings(organizationId: string): Promise<Organization | null> {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationId)
          .single();

        if (error) throw error;
        return data;
      },

      async updateOrganizationSettings(organizationId: string, updates: Partial<Organization>): Promise<Organization> {
        const { data, error } = await supabase
          .from("organizations")
          .update(updates)
          .eq("id", organizationId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      async getOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
        const {  orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", organizationId)
          .single();

        if (orgError) throw orgError;
        if (!orgData) throw new Error("Organization not found");

        const { count: userCount, error: usersError } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organizationId);

        if (usersError) throw usersError;

        const {  tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("status")
          .eq("organization_id", organizationId);

        if (tasksError) throw tasksError;

        const taskCount = tasksData?.length || 0;
        const completedTasks = tasksData?.filter(t => t.status === "completed").length || 0;

        return {
          ...orgData,
          userCount: userCount || 0,
          taskCount,
          completedTasks,
        };
      },

      async sendPasswordResetEmail(email: string): Promise<boolean> {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return true;
      },

      async toggleUserStatus(userId: string, isActive: boolean): Promise<Profile> {
        const { data, error } = await supabase
          .from("profiles")
          .update({ is_active: isActive })
          .eq("id", userId)
          .select()
          .single();

        if (error) throw error;
        return data as Profile;
      },

      async updateUserRole(userId: string, role: Profile["role"]): Promise<Profile> {
        const { data, error } = await supabase
          .from("profiles")
          .update({ role })
          .eq("id", userId)
          .select()
          .single();

        if (error) throw error;
        return data as Profile;
      },

      async deleteUserAndProfile(userId: string): Promise<boolean> {
        // This function has admin privileges. Use with caution.
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);

        if (profileError) {
          console.error("Error deleting profile:", profileError);
          // Decide if you want to proceed with auth user deletion
        }

        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) throw authError;

        return true;
      },
    };

    export default organizationManagementService;
  