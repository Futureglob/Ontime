
import { supabase } from "@/integrations/supabase/client";
import type { Credits, CreditTransaction } from "@/types";

const CREDIT_LIMIT = 500;

export const creditService = {
  async getOrganizationCredits(organizationId: string): Promise<Credits | null> {
    const { data, error } = await supabase
      .from("credits")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateCredits(
    organizationId: string,
    transaction: CreditTransaction
  ): Promise<Credits> {
    const { data: currentCredits, error: fetchError } = await supabase
      .from("credits")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    if (fetchError) throw fetchError;

    const newUsedCredits =
      transaction.operation === "add"
        ? currentCredits.used_credits - transaction.amount
        : currentCredits.used_credits + transaction.amount;

    if (newUsedCredits > CREDIT_LIMIT) {
      throw new Error("Credit limit exceeded");
    }

    const { data, error } = await supabase
      .from("credits")
      .update({ used_credits: newUsedCredits, updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async checkCreditAvailability(
    organizationId: string,
    requiredCredits: number
  ): Promise<boolean> {
    const credits = await this.getOrganizationCredits(organizationId);
    if (!credits) return false;
    
    return (credits.total_credits - credits.used_credits) >= requiredCredits;
  }
};

export default creditService;
