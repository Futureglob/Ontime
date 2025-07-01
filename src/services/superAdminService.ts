import { supabase } from "@/integrations/supabase/client";
import type { Organization } from "@/types/database";

const superAdminService = {
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSystemStats() {
    const { data, error } = await supabase.rpc("get_system_stats" as any);
    if (error) throw error;
    return data;
  },

  async createOrganization(orgData: Omit<Organization, "id" | "created_at" | "updated_at" | "contact_person" | "address" | "contact_phone" | "is_active" | "credit_balance" | "credit_limit" | "last_credit_update">) {
    const { data, error } = await supabase
      .from("organizations")
      .insert(orgData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async createOrganizationWithAdmin(details: {
    name: string;
    contact_email: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
  }) {
    const { data, error } = await supabase.rpc('create_organization_and_admin' as any, {
      p_org_name: details.name,
      p_org_contact_email: details.contact_email,
      p_admin_full_name: details.admin_name,
      p_admin_email: details.admin_email,
      p_admin_password: details.admin_password,
    });
    if (error) throw error;
    return data;
  },

  async createOrganization(details: { name: string; adminEmail: string; adminFullName: string; }) {
    const { data, error } = await supabase.rpc("create_organization_and_admin", {
      org_name: details.name,
      admin_email: details.adminEmail,
      admin_full_name: details.adminFullName,
    });

    if (error) {
      console.error("Error creating organization:", error);
    }
    return { data, error };
  },

  async updateOrganization(id: string, updates: Partial<OrganizationForSuperAdminView>) {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteOrganization(orgId: string) {
    // This should probably be a cascading delete in the DB or an RPC function
    // to ensure all related data (users, tasks, etc.) is removed.
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);
    if (error) throw error;
    return true;
  },
};

export default superAdminService;
