
    
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organizationId?: string;
  employeeId?: string;
  designation?: string;
  mobileNumber?: string;
  isActive?: boolean;
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const {  profile, error: profileError } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            role,
            organization_id,
            employee_id,
            designation,
            mobile_number,
            is_active,
            organization:organizations(
              id,
              name,
              logo_url,
              primary_color,
              secondary_color,
              is_active
            )
          `)
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          if (email === "superadmin@system.com") {
            const {  systemOrg, error: orgError } = await supabase
              .from("organizations")
              .select("id")
              .eq("name", "System Administration")
              .single();

            if (orgError) throw orgError;

            if (systemOrg) {
              const newProfile = await this.createUserProfile(data.user.id, {
                email: email,
                name: "System Administrator",
                role: "super_admin",
                organizationId: systemOrg.id,
                isActive: true
              });
              return { user: data.user, profile: newProfile };
            }
          }
          throw profileError;
        }

        return { user: data.user, profile };
      }

      return { user: data.user, profile: null };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async signInWithPin(employeeId: string, pin: string) {
    try {
      const {  profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          role,
          organization_id,
          employee_id,
          designation,
          mobile_number,
          is_active,
          pin_hash,
          pin_expires_at,
          failed_pin_attempts,
          pin_locked_until,
          organization:organizations(
            id,
            name,
            logo_url,
            primary_color,
            secondary_color,
            is_active
          )
        `)
        .eq("employee_id", employeeId.toUpperCase())
        .eq("is_active", true)
        .single();

      if (profileError || !profile) {
        await this.logPinAttempt(null, "failed_attempt", "Invalid employee ID");
        throw new Error("invalid_pin");
      }

      if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
        await this.logPinAttempt(profile.id, "locked_attempt", "Account locked");
        throw new Error("account_locked");
      }

      if (!profile.pin_hash) {
        await this.logPinAttempt(profile.id, "no_pin", "No PIN set");
        throw new Error("invalid_pin");
      }

      if (profile.pin_expires_at && new Date(profile.pin_expires_at) < new Date()) {
        await this.logPinAttempt(profile.id, "expired_pin", "PIN expired");
        throw new Error("pin_expired");
      }

      console.warn("PIN verification is not securely implemented. This check should be moved to a server-side function.");

      if (!pin || !profile.pin_hash) {
         throw new Error("invalid_pin");
      }

      await supabase
        .from("profiles")
        .update({
          failed_pin_attempts: 0,
          pin_locked_until: null
        })
        .eq("id", profile.id);

      await this.logPinAttempt(profile.id, "successful_login", "PIN login successful");

      return { user: null, profile, isPinLogin: true };

    } catch (error) {
      console.error("PIN sign in error:", error);
      throw error;
    }
  },

  async generatePin(userId: string, adminId: string): Promise<string> {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { error } = await supabase
      .from("profiles")
      .update({
        pin_hash: "placeholder_hash",
        pin_created_at: new Date().toISOString(),
        pin_expires_at: expiresAt.toISOString(),
        failed_pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_requested: false,
        pin_reset_requested_at: null
      })
      .eq("id", userId);

    if (error) throw error;

    await this.logPinAttempt(userId, "created", "PIN created by admin", adminId);

    return pin;
  },

  async requestPinReset(employeeId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        pin_reset_requested: true,
        pin_reset_requested_at: new Date().toISOString()
      })
      .eq("employee_id", employeeId.toUpperCase());

    if (error) throw error;

    await this.logPinAttempt(null, "reset_requested", `PIN reset requested for ${employeeId}`);
  },

  async logPinAttempt(userId: string | null, action: string, details?: string, createdBy?: string) {
    try {
      await supabase
        .from("pin_audit_logs")
        .insert({
          user_id: userId,
          action,
          details,
          ip_address: "unknown",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
          created_by: createdBy || userId
        });
    } catch (error) {
      console.error("Failed to log PIN attempt:", error);
    }
  },

  async signUp(email: string, password: string, userData?: Partial<AuthUser>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    if (data.user && userData) {
      await this.createUserProfile(data.user.id, {
        ...userData,
        email: data.user.email || email,
      });
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const {  { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      const profile = await this.getUserProfile(user.id);
      return { user, profile };
    }
    
    return { user: null, profile: null };
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Get user profile error:", error);
      return null;
    }
  },

  async createUserProfile(userId: string, userData: Partial<AuthUser> & { email: string }) {
    let organizationId = userData.organizationId;
    
    if (userData.role === "super_admin") {
      const {  systemOrg, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", "System Administration")
        .single();
      
      if (orgError) throw orgError;
      organizationId = systemOrg?.id;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: userData.name || "User",
        role: userData.role || "employee",
        organization_id: organizationId,
        employee_id: userData.employeeId,
        designation: userData.designation,
        mobile_number: userData.mobileNumber,
        is_active: userData.isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  }
};

export default authService;
  