import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function ProfileSettings() {
  const { currentProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    designation: "",
    mobile_number: "",
    bio: "",
    skills: "",
    emergency_contact: "",
    address: ""
  });

  useEffect(() => {
    if (currentProfile) {
      setFormData({
        full_name: currentProfile.full_name || "",
        designation: currentProfile.designation || "",
        mobile_number: currentProfile.mobile_number || "",
        bio: currentProfile.bio || "",
        skills: currentProfile.skills || "",
        emergency_contact: currentProfile.emergency_contact || "",
        address: currentProfile.address || ""
      });
    }
  }, [currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Implement profile update logic
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange("designation", e.target.value)}
                  placeholder="Enter your designation"
                />
              </div>

              <div>
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={formData.mobile_number}
                  onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                  placeholder="Enter your mobile number"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  placeholder="Enter emergency contact"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="List your skills (comma separated)"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
