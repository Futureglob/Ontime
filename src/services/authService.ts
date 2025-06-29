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
          if (email === "superadmin@system.com") {
            const { data: systemOrg, error: orgError } = await supabase
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
      console.log("PIN Login attempt:", { employeeId, pin });

      // Use case-insensitive search for employee ID and ensure the user is active.
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
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
        `
        )
        .ilike("employee_id", employeeId)
        .eq("is_active", true);

      if (profileError) {
        console.error("Profile query error:", profileError);
        throw new Error("invalid_pin");
      }

      if (!profiles || profiles.length === 0) {
        console.warn("No active profile found for employee ID:", employeeId);
        // As a fallback, let's check if a user exists with that ID but is inactive
        const { data: inactiveProfile } = await supabase
          .from("profiles")
          .select("employee_id, is_active")
          .ilike("employee_id", employeeId)
          .limit(1);
        if (inactiveProfile && inactiveProfile.length > 0) {
          console.warn("An inactive profile was found for employee ID:", employeeId);
        }
        throw new Error("invalid_pin");
      }

      if (profiles.length > 1) {
        console.warn(
          "Multiple active profiles found for employee ID:",
          employeeId,
          "Profiles:",
          profiles
        );
        // This indicates a data integrity issue.
        throw new Error("invalid_pin");
      }

      const profile = profiles[0];
      console.log("Profile found:", {
        id: profile.id,
        employee_id: profile.employee_id,
        pin_hash: profile.pin_hash ? "Exists" : "NULL",
        role: profile.role,
      });

      if (
        profile.pin_locked_until &&
        new Date(profile.pin_locked_until) > new Date()
      ) {
        console.warn("Account locked for employee:", employeeId);
        throw new Error("account_locked");
      }

      if (
        profile.pin_expires_at &&
        new Date(profile.pin_expires_at) < new Date()
      ) {
        console.warn("PIN expired for employee:", employeeId);
        throw new Error("pin_expired");
      }

      // In a real app, use a secure hashing library like bcrypt.
      // For this project, we're using a simple string comparison.
      const expectedPinHash = `pin_${pin}`;

      // If no PIN hash exists, this is the first login. Set the PIN.
      if (!profile.pin_hash) {
        console.log("First-time PIN setup for employee:", employeeId);
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            pin_hash: expectedPinHash,
            pin_created_at: new Date().toISOString(),
            pin_expires_at: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000
            ).toISOString(), // 90 days
            failed_pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq("id", profile.id);

        if (updateError) {
          console.error("Error setting PIN hash on first login:", updateError);
          throw new Error("invalid_pin");
        }

        console.log("PIN hash set successfully for employee:", employeeId);
        // Return the profile with the new hash for the session
        return {
          user: null,
          profile: { ...profile, pin_hash: expectedPinHash },
          isPinLogin: true,
        };
      }

      // Verify existing PIN hash
      if (profile.pin_hash !== expectedPinHash) {
        console.warn("PIN mismatch for employee:", employeeId);

        const newFailedAttempts = (profile.failed_pin_attempts || 0) + 1;
        const updates: {
          failed_pin_attempts: number;
          pin_locked_until?: string | null;
        } = {
          failed_pin_attempts: newFailedAttempts,
        };

        if (newFailedAttempts >= 5) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes
          updates.pin_locked_until = lockUntil.toISOString();
          console.warn(
            `Account for employee ${employeeId} locked for 15 minutes.`
          );
        }

        await supabase.from("profiles").update(updates).eq("id", profile.id);

        throw new Error("invalid_pin");
      }

      // On successful login, reset failed attempts
      if (profile.failed_pin_attempts > 0) {
        await supabase
          .from("profiles")
          .update({
            failed_pin_attempts: 0,
            pin_locked_until: null,
          })
          .eq("id", profile.id);
      }

      console.log("PIN login successful for employee:", employeeId);
      return { user: null, profile, isPinLogin: true };
    } catch (error) {
      // Catch specific errors to provide better feedback if needed,
      // otherwise, re-throw the original error.
      if (
        error instanceof Error &&
        ["account_locked", "pin_expired", "invalid_pin"].includes(error.message)
      ) {
        console.error(`PIN sign in failed: ${error.message}`, error);
        throw error;
      }
      console.error("An unexpected error occurred during PIN sign in:", error);
      throw new Error("invalid_pin"); // Generic error for anything else
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
    // Completely disable PIN audit logging to prevent 400 errors
    // This can be re-enabled once the pin_audit_logs table is properly configured
    console.log("PIN Audit Log (disabled):", {
      user_id: userId,
      action,
      details,
      created_by: createdBy || userId,
      timestamp: new Date().toISOString()
    });
    // No database calls to prevent 400 errors
    return Promise.resolve();
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage or session data
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        sessionStorage.clear();
        
        // Force reload to clear all state and redirect to home
        window.location.replace("/");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Even if there's an error, redirect to home
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
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
    let organizationId = userData.organizationId;
    
    if (userData.role === "super_admin") {
      const { data: systemOrg, error: orgError } = await supabase
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
  },

  async generatePinForUser(userId: string, adminId: string): Promise<string> {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const { error } = await supabase
      .from("profiles")
      .update({
        pin_hash: `pin_${pin}`, // Simple hash for demo - should use proper hashing
        pin_created_at: new Date().toISOString(),
        pin_expires_at: expiresAt.toISOString(),
        failed_pin_attempts: 0,
        pin_locked_until: null,
        pin_reset_requested: false,
        pin_reset_requested_at: null
      })
      .eq("id", userId);

    if (error) throw error;

    await this.logPinAttempt(userId, "pin_generated", "PIN generated by admin", adminId);

    return pin;
  },

  async resetUserPin(userId: string, adminId: string): Promise<string> {
    return this.generatePinForUser(userId, adminId);
  }
};

export default authService;
