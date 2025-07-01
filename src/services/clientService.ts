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
    return (data || []).map(client => ({
      ...client,
      is_active: (client as any).is_active ?? true
    })) as Client[];
  },

  async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ ...clientData, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    return { 
      ...data, 
      is_active: (data as any).is_active ?? true 
    } as Client;
  },

  async updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;
    return { 
      ...data, 
      is_active: (data as any).is_active ?? true 
    } as Client;
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
