
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export const clientService = {
  async getClientsByOrg(organizationId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching clients:", error);
      throw error;
    }
    return data || [];
  },

  async createClient(clientData: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }
    return data;
  },

  async updateClient(
    clientId: string,
    clientData: ClientUpdate
  ): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update(clientData)
      .eq("id", clientId)
      .select()
      .single();

    if (error) {
      console.error("Error updating client:", error);
      throw error;
    }
    return data;
  },

  async deleteClient(clientId: string) {
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
    return true;
  },
};
