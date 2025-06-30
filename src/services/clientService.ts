
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types";

export const clientService = {
  async getClients(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) throw error;
    return data as Client[];
  },

  async getClient(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as Client;
  },

  async createClient(client: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .insert([client])
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async searchClients(organizationId: string, searchTerm: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", organizationId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .order("name");

    if (error) throw error;
    return data as Client[];
  }
};
