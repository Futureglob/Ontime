import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { superAdminService } from "@/services/superAdminService";

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationAdded: () => void;
}

export default function AddOrganizationModal({ isOpen, onClose, onOrganizationAdded }: AddOrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    // Organization fields
    name: "",
    contact_person: "",
    contact_email: "",
    logo_url: "",
    primary_color: "#3B82F6",
    secondary_color: "#1E40AF",
    // Organization Admin fields
    admin_name: "",
    admin_email: "",
    admin_password: "",
    admin_employee_id: "",
    admin_mobile: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Enhanced validation
    if (!formData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    if (!formData.admin_name.trim()) {
      setError("Admin name is required");
      return;
    }

    if (!formData.admin_email.trim()) {
      setError("Admin email is required");
      return;
    }

    if (!formData.admin_password.trim()) {
      setError("Admin password is required");
      return;
    }

    if (formData.admin_password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.admin_email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await superAdminService.createOrganizationWithAdmin({
        // Organization data
        name: formData.name.trim(),
        logo_url: formData.logo_url.trim() || undefined,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        contact_person: formData.contact_person.trim() || undefined,
        contact_email: formData.contact_email.trim() || undefined,
        // Admin data
        admin_name: formData.admin_name.trim(),
        admin_email: formData.admin_email.trim(),
        admin_password: formData.admin_password,
        admin_employee_id: formData.admin_employee_id.trim() || undefined,
        admin_mobile: formData.admin_mobile.trim() || undefined
      });
      
      // Reset form
      setFormData({
        name: "",
        contact_person: "",
        contact_email: "",
        logo_url: "",
        primary_color: "#3B82F6",
        secondary_color: "#1E40AF",
        admin_name: "",
        admin_email: "",
        admin_password: "",
        admin_employee_id: "",
        admin_mobile: ""
      });
      
      // Show success message
      alert(`Organization created successfully! 

IMPORTANT: The organization admin (${formData.admin_email}) needs to:
1. Check their email for a confirmation link
2. Click the confirmation link to verify their email
3. Then they can log in to the system

The admin cannot log in until their email is confirmed.`);
      
      onOrganizationAdded();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create organization");
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Organization Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Organization Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => handleInputChange("contact_person", e.target.value)}
                  placeholder="Contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleInputChange("contact_email", e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL (Optional)</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                    placeholder="#1E40AF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization Admin Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Organization Administrator</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin Name *</Label>
                <Input
                  id="admin_name"
                  value={formData.admin_name}
                  onChange={(e) => handleInputChange("admin_name", e.target.value)}
                  placeholder="Admin full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_employee_id">Employee ID</Label>
                <Input
                  id="admin_employee_id"
                  value={formData.admin_employee_id}
                  onChange={(e) => handleInputChange("admin_employee_id", e.target.value)}
                  placeholder="EMP001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin Email *</Label>
              <Input
                id="admin_email"
                type="email"
                value={formData.admin_email}
                onChange={(e) => handleInputChange("admin_email", e.target.value)}
                placeholder="admin@company.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  value={formData.admin_password}
                  onChange={(e) => handleInputChange("admin_password", e.target.value)}
                  placeholder="Secure password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_mobile">Mobile Number</Label>
                <Input
                  id="admin_mobile"
                  type="tel"
                  value={formData.admin_mobile}
                  onChange={(e) => handleInputChange("admin_mobile", e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📧 Email Requirements</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Use a real email domain (Gmail, Outlook, company email)</p>
              <p>• Avoid temporary email services (YOPmail, 10minutemail, etc.)</p>
              <p>• Example: admin@gmail.com, admin@company.com</p>
              <p>• Password must be at least 6 characters</p>
              <p>• <strong>Admin will receive email confirmation before login</strong></p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Organization & Admin"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
