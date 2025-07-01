import { supabase } from "@/integrations/supabase/client";
import type { Organization, OrganizationDetails, Profile, UserRole } from "@/types/database";

const organizationManagementService = {
  transformProfileData(data: Record<string, unknown>): Profile {
    return {
      id: data.id as string,
      user_id: (data.user_id || data.id) as string,
      organization_id: data.organization_id as string || undefined,
      employee_id: data.employee_id as string || undefined,
      full_name: data.full_name as string,
      designation: data.designation as string || undefined,
      mobile_number: data.mobile_number as string,
      bio: data.bio as string || null,
      skills: data.skills as string || null,
      address: data.address as string || null,
      emergency_contact: data.emergency_contact as string || null,
      role: data.role as UserRole,
      is_active: data.is_active as boolean,
      pin: data.pin as string || undefined,
      avatar_url: data.avatar_url as string || undefined,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  transformOrganizationData(data: Record<string, unknown>): Organization {
    return {
      id: data.id as string,
      name: data.name as string,
      logo_url: data.logo_url as string,
      primary_color: data.primary_color as string,
      secondary_color: data.secondary_color as string,
      owner_id: (data.owner_id || "") as string,
      is_active: data.is_active !== false,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  async getEmployees(organizationId: string): Promise<Profile[]> {
    if (!organizationId) return [];
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return (data || []).map(item => this.transformProfileData(item));
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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: employeeData.email, // Use email as temporary user_id
        organization_id: employeeData.organizationId,
        full_name: employeeData.fullName,
        employee_id: employeeData.employeeId,
        role: employeeData.role,
        designation: employeeData.designation,
        mobile_number: employeeData.mobileNumber,
        bio: null,
        skills: null,
        address: null,
        emergency_contact: null,
        is_active: true
      })
      .select()
      .single();

    if (profileError) throw profileError;
    return this.transformProfileData(profile);
  },

  async createEmployee(organizationId: string, employeeData: {
    email: string;
    full_name: string;
    role: string;
    employee_id: string;
    mobile_number?: string;
  }) {
    return this.addEmployee({
      email: employeeData.email,
      fullName: employeeData.full_name,
      role: employeeData.role as Profile["role"],
      employeeId: employeeData.employee_id,
      organizationId,
      mobileNumber: employeeData.mobile_number,
    });
  },

  async updateEmployee(profileId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId)
      .select()
      .single();

    if (error) throw error;
    return this.transformProfileData(data);
  },

  async deleteEmployee(profileId: string): Promise<boolean> {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (error) throw error;
    return true;
  },

  async getOrganizationSettings(organizationId: string): Promise<Organization | null> {
    if (!organizationId) return null;
    
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error) throw error;
    return this.transformOrganizationData(data);
  },

  async updateOrganizationSettings(organizationId: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", organizationId)
      .select()
      .single();

    if (error) throw error;
    return this.transformOrganizationData(data);
  },

  async getOrganizationDetails(organizationId: string): Promise<OrganizationDetails> {
    if (!organizationId) throw new Error("Organization ID is required");
    
    const { data: orgData, error: orgError } = await supabase
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

    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .eq("organization_id", organizationId);

    if (tasksError) throw tasksError;

    const taskCount = tasksData?.length || 0;
    const completedTasks = tasksData?.filter(t => t.status === "completed").length || 0;

    const orgDetails: OrganizationDetails = {
      ...this.transformOrganizationData(orgData),
      userCount: userCount || 0,
      taskCount,
      completedTasks,
    };

    return orgDetails;
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
    return this.transformProfileData(data);
  },

  async updateUserRole(userId: string, role: Profile["role"]): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return this.transformProfileData(data);
  },

  async deleteUserAndProfile(userId: string): Promise<boolean> {
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }

    return true;
  },
};

export default organizationManagementService;
