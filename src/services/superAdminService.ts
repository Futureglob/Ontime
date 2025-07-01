
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
    const { data, error } = await supabase.rpc("get_system_stats");
    if (error) throw error;
    return data;
  },

  async createOrganization(orgData: Omit<Organization, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("organizations")
      .insert(orgData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async createOrganizationWithAdmin(details: any) {
    const { data, error } = await supabase.rpc('create_organization_and_admin', {
      org_name: details.name,
      org_contact_email: details.contact_email,
      admin_full_name: details.admin_name,
      admin_email: details.admin_email,
      admin_password: details.admin_password,
    });
    if (error) throw error;
    return data;
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
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
  