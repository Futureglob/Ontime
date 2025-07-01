
import { supabase } from "@/integrations/supabase/client";
import type { Client } from "@/types/database";

const clientService = {
  async getClients(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) throw error;
    return data || [];
  },

  async createClient(clientData: Omit<Client, "id" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateClient(clientId: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", clientId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteClient(clientId: string) {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) throw error;
    return true;
  },
};

export default clientService;
  