
import { supabase } from "@/integrations/supabase/client";
import bcrypt from "bcryptjs";

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

      // Get user profile after successful login
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
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
          // If profile doesn't exist, create one for super admin
          if (email === "superadmin@system.com") {
            const { data: systemOrg } = await supabase
              .from("organizations")
              .select("id")
              .eq("name", "System Administration")
              .single();

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
      // Find user by employee ID
      const { data: profile, error: profileError } = await supabase
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

      // Check if account is locked
      if (profile.pin_locked_until && new Date(profile.pin_locked_until) > new Date()) {
        await this.logPinAttempt(profile.id, "locked_attempt", "Account locked");
        throw new Error("account_locked");
      }

      // Check if PIN exists
      if (!profile.pin_hash) {
        await this.logPinAttempt(profile.id, "no_pin", "No PIN set");
        throw new Error("invalid_pin");
      }

      // Check if PIN is expired
      if (profile.pin_expires_at && new Date(profile.pin_expires_at) < new Date()) {
        await this.logPinAttempt(profile.id, "expired_pin", "PIN expired");
        throw new Error("pin_expired");
      }

      // Verify PIN
      const pinValid = await bcrypt.compare(pin, profile.pin_hash);
      
      if (!pinValid) {
        // Increment failed attempts
        const newFailedAttempts = (profile.failed_pin_attempts || 0) + 1;
        const shouldLock = newFailedAttempts >= 5;
        
        const updateData: any = {
          failed_pin_attempts: newFailedAttempts
        };

        if (shouldLock) {
          // Lock account for 30 minutes
          updateData.pin_locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }

        await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", profile.id);

        await this.logPinAttempt(profile.id, shouldLock ? "locked" : "failed_attempt", 
          `Failed PIN attempt ${newFailedAttempts}/5`);

        throw new Error(shouldLock ? "account_locked" : "invalid_pin");
      }

      // Reset failed attempts on successful login
      await supabase
        .from("profiles")
        .update({
          failed_pin_attempts: 0,
          pin_locked_until: null
        })
        .eq("id", profile.id);

      await this.logPinAttempt(profile.id, "successful_login", "PIN login successful");

      // Create a temporary auth session for PIN users
      // Since Supabase auth requires email/password, we'll create a custom session
      return { user: null, profile, isPinLogin: true };

    } catch (error) {
      console.error("PIN sign in error:", error);
      throw error;
    }
  },

  async generatePin(userId: string, adminId: string): Promise<string> {
    // Generate a 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = await bcrypt.hash(pin, 10);
    
    // Set PIN expiry to 90 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { error } = await supabase
      .from("profiles")
      .update({
        pin_hash: pinHash,
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

    return pin; // Return the plain PIN to show to admin
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
          ip_address: "unknown", // Could be enhanced to get real IP
          user_agent: navigator.userAgent,
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

    // Create profile after successful signup
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
    const { data: { user }, error } = await supabase.auth.getUser();
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
    // Get system organization ID for super admin
    let organizationId = userData.organizationId;
    
    if (userData.role === "super_admin") {
      const { data: systemOrg } = await supabase
        .from("organizations")
        .select("id")
        .eq("name", "System Administration")
        .single();
      
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
