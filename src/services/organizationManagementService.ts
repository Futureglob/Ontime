import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

export const organizationManagementService = {
  async getEmployees(organizationId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data || [];
  },

  async addEmployee(
    organizationId: string,
    employeeData: {
      email: string;
      fullName: string;
      role: string;
      employeeId: string;
      designation?: string;
      mobileNumber?: string;
    }
  ) {
    // 1. Create the auth user
    const {  authData, error: authError } = await supabase.auth.signUp({
      email: employeeData.email,
      password: `password_${Math.random().toString(36).slice(-8)}`, // Generate a random temporary password
      options: {
         {
          full_name: employeeData.fullName,
          role: employeeData.role,
          organization_id: organizationId,
        },
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("User was not created in authentication system.");
    }

    // 2. Create the profile
    const profilePayload = {
      user_id: authData.user.id,
      organization_id: organizationId,
      full_name: employeeData.fullName,
      role: employeeData.role,
      employee_id: employeeData.employeeId,
      designation: employeeData.designation,
      mobile_number: employeeData.mobileNumber,
      is_active: true,
    };

    const {  profile, error: profileError } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Optional: Clean up the created auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    return profile;
  },

  async updateEmployee(employeeId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkImportEmployees(organizationId: string, employees: any[]) {
    const results = {
      success: [],
      errors: [],
    };

    for (const emp of employees) {
      try {
        const newEmployee = await this.addEmployee(organizationId, {
          email: emp.email,
          fullName: emp.full_name,
          role: emp.role,
          employeeId: emp.employee_id,
          designation: emp.designation,
          mobileNumber: emp.mobile_number,
        });
        results.success.push(newEmployee);
      } catch (error) {
        results.errors.push({ employee: emp, error: error.message });
      }
    }

    return results;
  },

  async generatePinForEmployee(userId: string): Promise<string> {
    const { data, error } = await supabase.rpc("generate_user_pin", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error in generate_user_pin RPC:", error);
      throw error;
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }

    if (!data || !data.pin) {
        // Check if the response structure is different, e.g., if it's just the pin string
        if (typeof data === 'string') {
            return data;
        }
        console.error("Invalid response from generate_user_pin RPC:", data);
        throw new Error("Failed to generate PIN: Invalid response from server.");
    }

    return data.pin;
  },

  async getOrganizationSettings(organizationId: string) {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrganizationSettings(organizationId: string, updates: any) {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", organizationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};