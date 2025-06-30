
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const profileService = {
  async getOrganizationProfiles(organizationId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching organization profiles:", error);
      return [];
    }
    return data || [];
  },
};
