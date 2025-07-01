import { supabase } from "@/integrations/supabase/client";
import type { Organization } from "@/types/database";

const superAdminService = {
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Organization[];
  },

  async createOrganization(orgData: {
    name: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }): Promise<Organization> {
    const { data, error } = await supabase.rpc("create_organization_and_admin", {
      org_name: orgData.name,
      admin_email: orgData.adminEmail,
      admin_password: orgData.adminPassword,
      admin_name: orgData.adminName
    });

    if (error) throw error;
    return data as Organization;
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .select()
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async deleteOrganization(orgId: string): Promise<void> {
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (error) throw error;
  }
};

export default superAdminService;
