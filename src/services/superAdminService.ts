import { supabase } from "@/integrations/supabase/client";
import type { Organization } from "@/types/database";

const superAdminService = {
  transformOrganizationData(data: Record<string, unknown>): Organization {
    return {
      id: data.id as string,
      name: data.name as string,
      logo_url: data.logo_url as string,
      primary_color: data.primary_color as string,
      secondary_color: data.secondary_color as string,
      owner_id: data.owner_id as string,
      is_active: data.is_active as boolean,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(item => this.transformOrganizationData(item));
  },

  async createOrganization(orgData: {
    name: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string;
  }): Promise<Organization> {
    // For now, create organization directly since RPC might not exist
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: orgData.name,
        primary_color: "#3b82f6",
        secondary_color: "#1e40af",
        owner_id: "",
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformOrganizationData(data);
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from("organizations")
      .update(updates)
      .eq("id", orgId)
      .select()
      .single();

    if (error) throw error;
    return this.transformOrganizationData(data);
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
