import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { storageService } from "@/services/storageService";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  designation: z.string().optional(),
  mobile_number: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      designation: "",
      mobile_number: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const userProfile = await profileService.getProfile(user.id);
          setProfile(userProfile);
          if (userProfile) {
            form.reset({
              full_name: userProfile.full_name,
              designation: userProfile.designation || "",
              mobile_number: userProfile.mobile_number || "",
            });
            setAvatarPreview(userProfile.avatar_url);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast({ title: "Error", description: "Failed to fetch profile.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user, form, toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !profile) return;

    try {
      let avatar_url = profile.avatar_url;
      if (avatarFile) {
        avatar_url = await storageService.uploadProfilePhoto(user.id, avatarFile);
      }

      const updatedProfileData = {
        ...data,
        avatar_url,
      };

      const updatedProfile = await profileService.updateProfile(profile.id, updatedProfileData);
      setProfile(updatedProfile);
      toast({ title: "Success", description: "Profile updated successfully." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Could not load profile.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input type="file" accept="image/*" onChange={handleAvatarChange} />
            </div>
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
