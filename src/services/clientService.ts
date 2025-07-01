import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/database";

export const clientService = {
  async getClients(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    
    // Add default is_active if missing and cast to proper type
    return (data || []).map((client: Record<string, unknown>) => ({
      ...client,
      is_active: client.is_active ?? true
    })) as Client[];
  },

  transformClientData(data: Record<string, unknown>): Client {
    return {
      id: data.id as string,
      organization_id: data.organization_id as string,
      name: data.name as string,
      email: data.email as string,
      phone: data.phone as string,
      address: data.address as string,
      is_active: data.is_active !== false,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string
    };
  },

  async createClient(clientData: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return this.transformClientData(data);
  },

  async updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", clientId)
      .select()
      .single();

    if (error) throw error;
    return this.transformClientData(data);
  },

  async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  }
};

export default clientService;
