
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    full_name: string;
    designation: string;
    avatar_url?: string;
  };
}

export interface EnrichedTask extends Task {
  created_by_profile?: Profile;
  assigned_to_profile?: Profile;
  client?: Client;
  photos?: Array<{
    id: string;
    url: string;
    caption?: string;
  }>;
}
