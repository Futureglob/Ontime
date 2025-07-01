import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Profile } from "@/types/Profile";
import { profileService } from "@/services/profileService";

export default function ProfileSettings() {
  const { currentProfile, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(currentProfile);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(currentProfile);
  }, [currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    try {
      await profileService.updateProfile(user.id, profile);
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!profile) return;
    setProfile(prev => ({
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
                  value={profile?.full_name || ""}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={profile?.designation || ""}
                  onChange={(e) => handleInputChange("designation", e.target.value)}
                  placeholder="Enter your designation"
                />
              </div>

              <div>
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={profile?.mobile_number || ""}
                  onChange={(e) => handleInputChange("mobile_number", e.target.value)}
                  placeholder="Enter your mobile number"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  value={profile?.emergency_contact || ""}
                  onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
                  placeholder="Enter emergency contact"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profile?.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile?.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="skills">Skills</Label>
              <Textarea
                id="skills"
                value={profile?.skills || ""}
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
