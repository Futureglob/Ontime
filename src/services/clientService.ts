
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

      async createClient(clientData: Omit<Client, "id" | "created_at" | "updated_at" | "is_active">): Promise<Client> {
        const { data, error } = await supabase
          .from("clients")
          .insert({ ...clientData, is_active: true })
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      async updateClient(clientId: string, updates: Partial<Omit<Client, "id" | "created_at" | "updated_at">>): Promise<Client> {
        const { data, error } = await supabase
          .from("clients")
          .update(updates)
          .eq("id", clientId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },

      async deleteClient(clientId: string): Promise<boolean> {
        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", clientId);

        if (error) throw error;
        return true;
      },
    };

    export default clientService;
  