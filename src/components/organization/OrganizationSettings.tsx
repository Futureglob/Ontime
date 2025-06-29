import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Settings, Shield, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  created_at: string;
  updated_at: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
}

interface OrganizationSettings {
  id?: string;
  organization_id: string;
  allow_employee_self_registration: boolean;
  require_admin_approval: boolean;
  enable_location_tracking: boolean;
  enable_photo_verification: boolean;
  max_employees: number;
  working_hours_start: string;
  working_hours_end: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  id: string;
  organization_id: string;
  role: "organization_admin" | "super_admin" | "task_manager" | "employee";
}

export default function OrganizationSettings() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    allow_employee_self_registration: false,
    require_admin_approval: true,
    enable_location_tracking: true,
    enable_photo_verification: true,
    max_employees: 100,
    working_hours_start: "09:00",
    working_hours_end: "17:00"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadOrganizationData = useCallback(async () => {
    if (!user) return;

    try {
      // Get user profile first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      if (profileData?.organization_id) {
        // Get organization data
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .single();

        if (orgError) throw orgError;
        
        // Set organization with default values for missing fields
        setOrganization({
          ...orgData,
          description: orgData.description || "",
          website: orgData.website || "",
          phone: orgData.phone || "",
          email: orgData.email || "",
          address: orgData.address || "",
          is_active: orgData.is_active ?? true
        });

        // Try to get organization settings (may not exist)
        const { data: settingsData } = await supabase
          .from("profiles")
          .select("*")
          .eq("organization_id", profileData.organization_id)
          .eq("role", "organization_admin")
          .single();

        if (settingsData) {
          // Use default settings if no specific settings table exists
          setSettings({
            organization_id: profileData.organization_id,
            allow_employee_self_registration: false,
            require_admin_approval: true,
            enable_location_tracking: true,
            enable_photo_verification: true,
            max_employees: 100,
            working_hours_start: "09:00",
            working_hours_end: "17:00"
          });
        }
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
      toast({
        title: "Error",
        description: "Failed to load organization data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOrganizationData();
  }, [loadOrganizationData]);

  const updateOrganization = async () => {
    if (!organization || !userProfile?.organization_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: organization.name,
          logo_url: organization.logo_url,
          primary_color: organization.primary_color,
          secondary_color: organization.secondary_color,
          description: organization.description,
          website: organization.website,
          phone: organization.phone,
          email: organization.email,
          address: organization.address,
          updated_at: new Date().toISOString()
        })
        .eq("id", userProfile.organization_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization updated successfully"
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = async () => {
    if (!userProfile?.organization_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("organization_settings")
        .upsert({
          organization_id: userProfile.organization_id,
          ...orgSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Organization Settings</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Organization Found</h3>
            <p className="text-muted-foreground">You are not associated with any organization.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has permission to edit organization settings
  const canEdit = userProfile?.role === "organization_admin" || userProfile?.role === "super_admin";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your organization's configuration and policies</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button onClick={updateOrganization} disabled={saving}>
              {saving ? "Saving..." : "Save Organization"}
            </Button>
            <Button onClick={updateSettings} disabled={saving} variant="outline">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={organization.name || ""}
                  onChange={(e) => setOrganization(prev => prev ? { ...prev, name: e.target.value } : null)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={organization.website || ""}
                  onChange={(e) => setOrganization(prev => prev ? { ...prev, website: e.target.value } : null)}
                  placeholder="https://example.com"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={organization.description || ""}
                onChange={(e) => setOrganization(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="Describe your organization..."
                rows={3}
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orgEmail">Email</Label>
                <Input
                  id="orgEmail"
                  type="email"
                  value={organization.email || ""}
                  onChange={(e) => setOrganization(prev => prev ? { ...prev, email: e.target.value } : null)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgPhone">Phone</Label>
                <Input
                  id="orgPhone"
                  value={organization.phone || ""}
                  onChange={(e) => setOrganization(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={organization.address || ""}
                onChange={(e) => setOrganization(prev => prev ? { ...prev, address: e.target.value } : null)}
                placeholder="Organization address..."
                rows={2}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center gap-4">
              <Badge variant={organization.is_active ? "default" : "secondary"}>
                {organization.is_active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Created: {new Date(organization.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Organization Policies
            </CardTitle>
            <CardDescription>
              Configure policies and settings for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Employee Self Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow employees to register themselves
                  </p>
                </div>
                <Switch
                  checked={orgSettings.allow_employee_self_registration}
                  onCheckedChange={(checked) =>
                    setOrgSettings(prev => ({ ...prev, allow_employee_self_registration: checked }))
                  }
                  disabled={!canEdit}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Admin Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    New employees need admin approval
                  </p>
                </div>
                <Switch
                  checked={orgSettings.require_admin_approval}
                  onCheckedChange={(checked) =>
                    setOrgSettings(prev => ({ ...prev, require_admin_approval: checked }))
                  }
                  disabled={!canEdit}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Location Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Track employee locations for field work
                  </p>
                </div>
                <Switch
                  checked={orgSettings.enable_location_tracking}
                  onCheckedChange={(checked) =>
                    setOrgSettings(prev => ({ ...prev, enable_location_tracking: checked }))
                  }
                  disabled={!canEdit}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Photo Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require photo verification for tasks
                  </p>
                </div>
                <Switch
                  checked={orgSettings.enable_photo_verification}
                  onCheckedChange={(checked) =>
                    setOrgSettings(prev => ({ ...prev, enable_photo_verification: checked }))
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxEmployees">Max Employees</Label>
                <Input
                  id="maxEmployees"
                  type="number"
                  value={orgSettings.max_employees}
                  onChange={(e) =>
                    setOrgSettings(prev => ({ ...prev, max_employees: parseInt(e.target.value) || 0 }))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workStart">Work Start Time</Label>
                <Input
                  id="workStart"
                  type="time"
                  value={orgSettings.working_hours_start}
                  onChange={(e) =>
                    setOrgSettings(prev => ({ ...prev, working_hours_start: e.target.value }))
                  }
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEnd">Work End Time</Label>
                <Input
                  id="workEnd"
                  type="time"
                  value={orgSettings.working_hours_end}
                  onChange={(e) =>
                    setOrgSettings(prev => ({ ...prev, working_hours_end: e.target.value }))
                  }
                  disabled={!canEdit}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!canEdit && (
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Limited Access</h3>
              <p className="text-muted-foreground">
                You need organization admin privileges to modify these settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
